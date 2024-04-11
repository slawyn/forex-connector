import datetime
from flask import Flask, request, render_template, send_from_directory
from google.driver import DriveFileController
import sys

from commander import Commander
from trader.trader import Trader
from trader.request import TradeRequest
from trader.accountinfo import AccountInfo
from trader.position import ClosedPosition, OpenPosition
from trader.symbol import Symbol
from config import Config
from helpers import *
import re

# Configurable values
CONFIG_ENABLE_TRADING = True

# Flask variables
flask = Flask(__name__)


def calculate_indicators(spread, open_price, bid, atr):
    ratio = (spread/atr)*100
    atr_reserve = (open_price-bid)/atr*100
    signal = (abs(atr_reserve) - ratio)
    if signal > 0:
        if atr_reserve>0:
            direction = "[Sell]"
        else:
            direction = "[Buy]"
        formatted_signal = "%-2.2f %s" % (signal, direction)
    else:
        formatted_signal = ""

    return (formatted_signal, ratio, atr_reserve)
class App:
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

    def __init__(self, config):
        self.config = config
        self.trader = Trader(config.get_metatrader_configuration(), config.get_metatrader_process())
        self.commander = Commander()
        self._set_filter("currency")

    def run(self):
        self.window.mainloop()

    def fetch_resource(self, path):
        return send_from_directory(self.config.get_export_folder(), path)

    def terminal_select(self, symbol):
        data = self.commander.send_instrument(symbol)

    def terminal_preview(self, ask, bid, sl, tp):
        data = self.commander.send_drawlines([str(ask), str(bid), str(sl[0]), str(sl[1]), str(tp[0]), str(tp[1])])

    def save_to_google(self):
        self.trader.update_history_info()

    def _set_filter(self, filter):
        self.trader.set_filter(filter)

    def get_symbol(self, instrument):
        return self.trader.get_symbol(instrument)

    def get_rates(self, instrument, time_frame, start_ms, end_ms):
        symbol = self.trader.get_symbol(instrument)
        return self.trader.update_rates_for_symbol(symbol, time_frame, start_ms/1000, end_ms/1000)

    def get_account_info(self):
        self.trader.update_account_info()
        info = self.trader.get_account_info()
        return {"balance": info.balance,
                "currency": info.currency,
                "profit": "%2.2f" % info.profit,
                "leverage": info.leverage,
                "company": info.company,
                "server": info.server,
                "login": info.login}
    
    def trade(self, symbol, lot, type, entry_buy, entry_sell, stoploss_buy, stoploss_sell, takeprofit_buy, takeprofit_sell, comment, position):
        ''' Send trade to terminal
        '''
        ACTIONS = {
            "market_buy":  [TradeRequest.get_type_market_buy(), entry_buy, stoploss_buy, takeprofit_buy],
            "limit_buy":   [TradeRequest.get_type_limit_buy(), entry_buy, stoploss_buy, takeprofit_buy],
            "stop_buy":    [TradeRequest.get_type_stop_buy(), entry_buy, stoploss_buy, takeprofit_buy],
            "market_sell": [TradeRequest.get_type_market_sell(), entry_sell, stoploss_sell, takeprofit_sell],
            "limit_sell":  [TradeRequest.get_type_limit_sell(), entry_sell, stoploss_sell, takeprofit_sell],
            "stop_sell":   [TradeRequest.get_type_stop_sell(), entry_sell, stoploss_sell, takeprofit_sell],
            "close_sell":  [TradeRequest.get_type_market_buy(), entry_buy, None, None],
            "close_buy":  [TradeRequest.get_type_market_sell(), entry_sell, None, None]
        }

        try:
            action = ACTIONS[type]
            tr = TradeRequest(symbol, lot, action[0], action[1], action[2], action[3], position, comment)
            return_info = self.trader.trade(tr, CONFIG_ENABLE_TRADING)
        except Exception as e:
            print("Exception", e)
        return return_info

    def save_to_google(self):
        ''' Collect Information and add to excel sheet
        '''
        drive_handle = DriveFileController(self.config.get_google_secrets_file(),
                                           self.config.get_google_folder_id(),
                                           self.config.get_google_spreadsheet(),
                                           self.config.get_google_worksheet(),
                                           self.config.get_export_folder())
        start_date = convert_string_to_date(self.config.get_google_startdate())
        positions = self.trader.get_closed_positions(start_date)
        drive_handle.update_google_sheet(positions)
        return []

    def get_history_positions(self):
        '''Gets closed positions from terminal
        '''
        start_date = convert_string_to_date(self.config.get_google_startdate())
        positions = self.trader.get_history_positions(start_date, onlyfinished=False)
        json_positions = [positions[p].get_info() for p in positions]
        return ClosedPosition.get_info_header(), json_positions

    def _get_open_positions(self):
        ''' Get Open Positions from terminal
        '''
        TYPES = {
            TradeRequest.get_type_market_buy(): "market_buy",
            TradeRequest.get_type_limit_buy(): "limit_buy",
            TradeRequest.get_type_stop_buy(): "stop_buy",
            TradeRequest.get_type_market_sell(): "market_sell",
            TradeRequest.get_type_limit_sell(): "limit_sell",
            TradeRequest.get_type_stop_sell(): "stop_sell",
        }

        positions = self.trader.get_open_positions()
        diff_positions = {}
        for p in positions:
            pos = positions[p]
            if pos.updated or True:
                diff_positions[pos.id] = pos.get_info(types_map=TYPES)

        return OpenPosition.get_info_header(), diff_positions

    def get_symbols(self, filter):
        '''Builds a list of instruments based on filter
        '''
        react_data = {}

        ##
        syms = self.trader.get_updated_symbols_sorted()
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


def convert_timestamp_to_string(timestamp_sec):
    seconds = int(timestamp_sec % 60)
    minutes = int(timestamp_sec/60 % 60)
    hours = int(timestamp_sec/60/60)
    return f"{hours:02}: {minutes:02}: {seconds:02}"


def make_pretty(styler):
    '''Sets up a pretty styler
       styler: styler object
    '''
    styler.format_index(lambda v: v.strftime("%A"))
    styler.background_gradient(axis=None, vmin=1, vmax=5, cmap="YlGnBu")
    return styler


def get_with_terminal_info(force=False):
    '''Updates table with instruments
    '''
    instr_headers, instr = app.get_symbols(filter=force)
    account = app.get_account_info()
    op_headers, open_positions = app._get_open_positions()
    return {"date": get_current_date(), "headers": instr_headers, "instruments": instr, "account": account, "op_headers": op_headers, "open": open_positions}


def is_it_true(value):
  return value.lower() == 'true'

@flask.route('/update', methods=['GET'])
def get_update():
    force = request.args.get("force", default=False, type=is_it_true)
    return get_with_terminal_info(force=force)

@flask.route('/history', methods=['GET'])
def get_history():
    headers, positions = app.get_history_positions()
    return {"positions": positions, "headers": headers}

@flask.route('/rates', methods=['GET'])
def get_rates():
    instrument = request.args.get("instrument", default='', type=str)
    start_ms = request.args.get("start", default=0, type=int)
    end_ms = request.args.get("end", default=0, type=int)
    time_frame = request.args.get("timeframe", default="D1", type=str)
    rates = []
    if instrument != '':
        rates = app.get_rates(instrument, time_frame, start_ms, end_ms)
    
    return json.dumps(rates)

@flask.route('/symbol', methods=['GET'])
def get_symbol():
    symbol = app.get_symbol(request.args.get("instrument", ""))
    if symbol is not None:
        return {"info": {"name": symbol.get_name(),
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

@flask.route('/save', methods=['POST'])
def save():
    app.save_to_google()
    return {"id": 0}

@flask.route('/<path:path>')
def on_socket(path):
    '''Socket on-fetch handler
        ->path      : requested path
        <-resource  : resource
    '''
    return app.fetch_resource(path)

@flask.route('/trade', methods=['POST'])
def trade():
    data = request.get_json()
    symbol = data.get("symbol")
    position = data.get("position")
    lot = data.get("lot")
    type = data.get("type")
    entry_buy = data.get("entry_buy")
    entry_sell = data.get("entry_sell")
    stoploss_buy = data.get("stoploss_buy")
    stoploss_sell = data.get("stoploss_sell")
    takeprofit_buy = data.get("takeprofit_buy")
    takeprofit_sell = data.get("takeprofit_sell")
    comment = data.get("comment")
    result = app.trade(symbol, lot, type, entry_buy, entry_sell, stoploss_buy, stoploss_sell, takeprofit_buy, takeprofit_sell, comment, position)
    # result = [10009,'test']
    return {"error": result[0], "text": result[1]}



@flask.route('/command', methods=['POST'])
def command():
    data = request.get_json()
    type = data.get("command")
    if type == "select":
        status = app.terminal_select(data.get("data"))
 
    elif type == "preview":
        preview = data.get("data")
        sl = preview.get("sl")
        tp = preview.get("tp")
        ask = preview.get("ask")
        bid = preview.get("bid")
        status = app.terminal_preview(ask, bid, sl, tp)

    return {}

if __name__ == "__main__":
    try:
        app = App(Config(sys.argv[1]))
        flask.run(debug=True)
    except Exception as e:
        log(e)
