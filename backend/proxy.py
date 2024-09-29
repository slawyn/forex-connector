from flask import Flask, request, send_from_directory
from google.driver import DriveFileController
import sys
import traceback

from commander.commander import Commander
from trader.trader import Trader
from components.position import ClosedPosition, OpenPosition
from components.rate import Rate

from config import Config
from helpers import *
from grafana import Grafana
from backtester.backtester import Backtester

# Configurable values
CONFIG_ENABLE_TRADING = True


def calculate_indicators(spread, open_price, bid, atr):
    ratio = (spread/atr)*100
    atr_reserve = (open_price-bid)/atr*100
    signal = (abs(atr_reserve) - ratio)
    if signal > 0:
        if atr_reserve > 0:
            direction = "[Sell]"
        else:
            direction = "[Buy]"
        formatted_signal = "%-2.2f %s" % (signal, direction)
    else:
        formatted_signal = ""

    return (formatted_signal, ratio, atr_reserve)


class App(Flask):
    COL_INSTRUMENT = 'INSTRUMENT'
    COL_BASE = 'CURRENCY'
    COL_DESCRIPTION = 'DESCRIPTION'
    COL_ASK = 'ASK'
    COL_BID = 'BID'
    COL_SPREAD = 'SPREAD'
    COL_ATR = 'ATR'
    COL_WEDGE = 'SPREAD:ATR[%]'
    COL_AVAIL = 'ATR.LEFT[%]'
    COL_SIGNAL = 'SIGNAL[%]'
    COL_UPDATE = 'UPDATE'
    COL_CHANGE = 'CHANGE[%]'
    COLUMNS = [COL_INSTRUMENT, COL_BASE, COL_DESCRIPTION, COL_ASK, COL_BID, COL_SPREAD, COL_ATR, COL_WEDGE, COL_AVAIL, COL_SIGNAL, COL_UPDATE, COL_CHANGE]

    def __init__(self):
        super().__init__(__name__)

    def initialize(self, cfg):
        self.cfg = cfg
        self.trader = Trader(cfg.get_metatrader_configuration(), cfg.get_metatrader_process(), CONFIG_ENABLE_TRADING)
        self.commander = Commander()
        self.grafana = Grafana(
            cb_get_timeframes=self.trader.get_timeframes,
            cb_get_instruments=lambda: [sym.name for sym in self.trader.get_symbols()],
            cb_get_rates=self.get_rates_json
        )

    def fetch_resource(self, path):
        return send_from_directory(self.cfg.get_export_folder(), path)

    def set_filter(self, filter):
        self.trader.set_filter(filter)

    def get_rates_json(self, instrument, time_frame, start_ms, end_ms):
        symbol = self.trader.get_symbol(instrument)
        return Rate.to_json(self.trader.get_rates(symbol, time_frame, int(start_ms), int(end_ms)))

    def get_rates_pandas(self, instrument, time_frame, start_ms, end_ms):
        symbol = self.trader.get_symbol(instrument)
        return Rate.to_pandas(self.trader.get_rates(symbol, time_frame, int(start_ms), int(end_ms)))

    def get_account_info(self):
        return self.trader.get_account_info().to_json()

    def save_to_google(self):
        """ Collect Information and add to excel sheet"""
        drive_handle = DriveFileController(self.cfg.get_google_secrets_file(),
                                           self.cfg.get_google_folder_id(),
                                           self.cfg.get_google_spreadsheet(),
                                           self.cfg.get_google_worksheet(),
                                           self.cfg.get_export_folder())
        start_date = convert_string_to_date(self.cfg.get_google_startdate())
        positions = self.trader.get_closed_positions(start_date, drive_handle.get_optimal_bar_count())
        drive_handle.update_google_sheet(positions)
        return []

    def show_closed_positions(self):
        """Gets closed positions with headers"""
        start_date = convert_string_to_date(self.cfg.get_google_startdate())
        positions = self.trader.get_history_positions(start_date, only_finished=True)
        return ClosedPosition.get_info_header(), [positions[p].get_info() for p in positions]

    def show_open_positions(self):
        """Gets open positions with headers"""
        positions = self.trader.get_open_positions()
        return OpenPosition.get_info_header(), [positions[p].get_info() for p in positions]

    def show_symbols(self, filter):
        """Builds a list of instruments based on filter"""
        react_data = {}

        ##
        syms = self.trader.get_symbols()
        for idx in range(len(syms)):
            sym = syms[idx]

            name = sym.get_name()
            spread = sym.get_spread()
            bid = sym.get_bid()
            digits = sym.get_digits()

            # indicators
            atr = self.trader.get_atr(sym)
            formatted_signal, ratio, atr_reserve = calculate_indicators(spread, sym.get_session_open(), bid, atr)

            # Create data set
            timer = get_current_date()
            if sym.is_updated() or filter:
                react_data[name] = [name,
                                    sym.get_currency(),
                                    sym.get_description(),
                                    f"%2.{digits}f" % sym.get_ask(),
                                    f"%2.{digits}f" % bid,
                                    f"%2.{digits}f" % (spread),
                                    "%-2.4f" % atr,
                                    "%-2.2f" % (ratio),
                                    "%-2.2f" % abs(atr_reserve),
                                    formatted_signal,
                                    timer,
                                    f"%2.2f" % sym.get_price_change()]

        return App.COLUMNS,  react_data


app = App()


@app.route('/metrics', methods=['POST'])
def on_metrics():
    return app.grafana.get_metrics()


@app.route('/variable', methods=['POST'])
def on_variable():
    return app.grafana.get_variable(request.get_json())


@app.route('/query', methods=['POST'])
def on_query():
    return app.grafana.get_query(request.get_json())


@app.route('/backtesting', methods=['POST'])
def on_backtesting():
    data = request.get_json()
    instrument = data.get("instrument")
    start_ms = data.get("start")
    end_ms = data.get("end")
    time_frame = data.get("timeframe")
    risk = data.get("risk")
    volume = data.get("volume")

    pd_data = app.get_rates_pandas(instrument, time_frame, start_ms, end_ms)
    sym = app.trader.get_symbol(instrument)
    bt = Backtester(pd_data,
                    sym.get_conversion(),
                    sym.get_contract_size(),
                    sym.get_step(),
                    sym.get_point_value(),
                    float(risk),
                    float(volume))
    bt.run()
    return {}


@app.route('/update', methods=['GET'])
def on_update():
    force = request.args.get("force", default=False, type=is_it_true)
    instr_headers, instr = app.show_symbols(filter=force)
    op_headers, open_positions = app.show_open_positions()
    return {"date": get_current_date(), "headers": instr_headers, "instruments": instr, "account":  app.get_account_info(), "op_headers": op_headers, "open": open_positions}


@app.route('/history', methods=['GET'])
def on_history():
    headers, positions = app.show_closed_positions()
    return {"positions": positions, "headers": headers}


@app.route('/rates', methods=['GET'])
def on_rates():
    instrument = request.args.get("instrument", default='', type=str)
    start_ms = request.args.get("start", default=0, type=int)
    end_ms = request.args.get("end", default=0, type=int)
    time_frame = request.args.get("timeframe", default="D1", type=str)
    return {"instrument": instrument,
            "data":
            {
                time_frame: app.get_rates_json(instrument, time_frame, start_ms, end_ms)
            }}


@app.route('/symbol', methods=['GET'])
def on_symbol():
    symbol = app.trader.get_symbol(request.args.get("instrument", ""))
    if symbol is not None:
        return {"info":
                {"name": symbol.get_name(),
                 "step": symbol.get_step(),
                 "ask": symbol.get_ask(),
                 "bid": symbol.get_bid(),
                 "volume_step": symbol.get_volume_step(),
                 "point_value": symbol.get_point_value(),
                 "contract_size": symbol.get_contract_size(),
                 "digits": symbol.get_digits(),
                 "tick_size": symbol.get_step(),
                 "tick_value": symbol.get_tick_value(),
                 "conversion": symbol.get_conversion()
                 }
                }
    return {}


@app.route('/save', methods=['POST'])
def on_save():
    app.save_to_google()
    return {"id": 0}


@app.route('/<path:path>')
def on_resource(path):
    return app.fetch_resource(path)


@app.route('/trade', methods=['POST'])
def on_trade():
    data = request.get_json()
    symbol = data.get("symbol")
    position = data.get("position")
    pending = data.get("pending", False)
    lot = data.get("lot")
    type = data.get("type")
    price = data.get("price")
    stoplimit = data.get("stoplimit")
    stoploss = data.get("stoploss")
    takeprofit = data.get("takeprofit")
    comment = data.get("comment")
    result = app.trader.trade(symbol, lot, type, price, stoplimit, stoploss, takeprofit, comment, pending, position)
    return {"error": result[0], "text": result[1]}


@app.route('/command', methods=['POST'])
def on_command():
    data = request.get_json()
    type = data.get("command")
    if type == "select":
        status = app.commander.send_instrument(data.get("data"))

    elif type == "preview":
        preview = data.get("data")
        sl = preview.get("sl")
        tp = preview.get("tp")
        ask = preview.get("ask")
        bid = preview.get("bid")
        status = app.commander.send_drawlines([str(ask), str(bid), str(sl[0]), str(sl[1]), str(tp[0]), str(tp[1])])

    return {}


if __name__ == "__main__":
    try:
        app.initialize(Config(sys.argv[1]))
        app.set_filter("currency")
        app.run(debug=True)
    except Exception as e:
        loge(traceback.format_exc())
