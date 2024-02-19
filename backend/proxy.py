import datetime
from flask import Flask, request, render_template
from google.driver import DriveFileController

from commander import Commander
from trader.trader import Trader
from trader.request import TradeRequest
from trader.accountinfo import AccountInfo
from trader.position import ClosedPosition, OpenPosition
from trader.symbol import Symbol
from config import Config
from helpers import *

# Configurable values
CONFIG_ENABLE_TRADING = True

# Flask variables
flask = Flask(__name__)
app = None


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
    COLUMNS = [COL_INSTRUMENT, COL_BASE, COL_DESCRIPTION, COL_ASK, COL_BID, COL_SPREAD, COL_ATR, COL_WEDGE, COL_AVAIL, COL_SIGNAL, COL_UPDATE]

    def __init__(self, config):
        self.config = config
        self.trader = Trader()
        self.commander = Commander()
        self._set_filter("currency")

    def select_instrument(self, data):
        data = self.commander.send_instrument(data)

    def draw_preview(self, ask, bid, sl, tp):
        drawlines = [str(ask), str(bid), str(sl[0]), str(sl[1]), str(tp[0]), str(tp[1])]
        data = self.commander.send_drawlines(drawlines)

    def run(self):
        self.window.mainloop()

    def _save_to_google(self):
        self.trader.update_history_info()

    def _set_filter(self, filter):
        self.trader.set_filter(filter)

    def _get_account_info(self):
        self.trader.update_account_info()
        info = self.trader.get_account_info()
        return {"balance": info.balance,
                "currency": info.currency,
                "profit": "%2.2f" % info.profit,
                "leverage": info.leverage,
                "company": info.company,
                "server": info.server,
                "login": info.login}

    def _get_symbol(self, sym):
        return self.trader.get_symbol(sym)

    def _trade(self, symbol, lot, type, entry_buy, entry_sell, stoploss_buy, stoploss_sell, takeprofit_buy, takeprofit_sell, comment, position):
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

    def _save_to_google(self):
        ''' Collect Information '''
        # Get Positions of closed deals and add them to excel sheet
        drive_handle = DriveFileController(self.config.get_google_secrets_file(),
                                           self.config.get_google_folder_id(),
                                           self.config.get_google_spreadsheet(),
                                           self.config.get_google_worksheet(),
                                           self.config.get_export_folder())
        start_date = convert_string_to_date(self.config.get_google_startdate())
        positions = self.trader.get_closed_positions(start_date)
        drive_handle.update_google_sheet(positions)
        return []

    def _get_history_positions(self):
        '''Gets closed positions from history
        '''
        start_date = convert_string_to_date(self.config.get_google_startdate())
        positions = self.trader.get_history_positions(start_date, onlyfinished=False)
        json_positions = [positions[p].get_info() for p in positions]
        return ClosedPosition.get_info_header(), json_positions

    def _get_open_positions(self):
        '''Open Positions
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

    def _get_symbols(self, filter_updated=True):
        '''Builds a list of instruments based on filter
        '''
        indices = []
        react_data = {}

        ##

        syms = self.trader.get_updated_symbols_sorted()
        indices = range(len(syms))
        date = datetime.datetime.utcnow() - datetime.datetime(1970, 1, 1)
        epoch = date.total_seconds()  # + (2*60*60)

        for idx in indices:
            sym = syms[idx]
            atr = self.trader.get_atr(sym)
            updated, name, spread, ask, bid, digits, step, session_open, volume_step, point_value, contract_size, description, tick_value = sym.get_info()
            currency = sym.get_currency()

            # additional calcs
            ratio = (spread/atr)*100
            atr_reserve = ((session_open-bid)/atr)*100
            signal = (ratio/atr_reserve)*100

            # Create data set
            #timer = convert_timestamp_to_string(epoch - sym.time)
            timer = get_current_date()
            if updated or not filter_updated:
                react_data[name] = [name,
                                    currency,
                                    description,
                                    f"%2.{digits}f" % ask,
                                    f"%2.{digits}f" % bid,
                                    f"%2.{digits}f" % (spread),
                                    "%-2.4f" % atr,
                                    "%-2.2f" % (ratio),
                                    "%-2.2f" % (abs(atr_reserve)),
                                    "%-2.2f" % (abs(signal)),
                                    timer]

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
    filter = not force
    instr_headers, instr = app._get_symbols(filter)
    account = app._get_account_info()
    op_headers, open_positions = app._get_open_positions()

    # Instruments sub-dictionary
    instruments = {}
    return {"date": get_current_date(), "headers": instr_headers, "instruments": instr, "account": account, "op_headers": op_headers, "open": open_positions}


def send_command(data):
    '''Updates table with instruments
    '''
    return


@flask.route('/update', methods=['GET'])
def update():
    return get_with_terminal_info()


@flask.route('/get-positions', methods=['GET'])
def get_positions():
    headers, positions = app._get_history_positions()
    return {"positions": positions, "headers": headers}


@flask.route('/update-all', methods=['GET'])
def update_all():
    return get_with_terminal_info(force=True)


@flask.route('/save', methods=['POST'])
def save():
    app._save_to_google()
    return {"id": 0}


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
    result = app._trade(symbol, lot, type, entry_buy, entry_sell, stoploss_buy, stoploss_sell, takeprofit_buy, takeprofit_sell, comment, position)

    return {"error": result[0], "text": result[1]}


@flask.route('/command', methods=['POST'])
def command():
    data = request.get_json()
    type = data.get("command")
    if type == "instrument":
        instrument = data.get("instrument")
        status = app.select_instrument(instrument)
        symbol = app._get_symbol(instrument)
        updated, name, spread, ask, bid, digits, step, session_open, volume_step, point_value, contract_size, description, tick_value = symbol.get_info()
        conversion = symbol.get_conversion()


        return {"info": {"name": name,
                         "step": step,
                         "ask": ask,
                         "bid": bid,
                         "volume_step": volume_step,
                         "point_value": point_value,
                         "contract_size": contract_size,
                         "digits": digits,
                         "tick_size": step,
                         "tick_value": tick_value,
                         "conversion": conversion
                         }}

    elif type == "preview":
        preview = data.get("preview")
        sl = preview.get("sl")
        tp = preview.get("tp")
        ask = preview.get("ask")
        bid = preview.get("bid")
        status = app.draw_preview(ask, bid, sl, tp)
        return {"id": 0}


if __name__ == "__main__":
    try:
        CONFIG_NAME = "config/config.json"
        app = App(Config(CONFIG_NAME))
        flask.run(debug=True)
    except Exception as e:
        log(e)
