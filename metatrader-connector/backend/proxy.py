import datetime
from flask import Flask, request, render_template

from commander import Commander
from trader.trader import Trader
from trader.request import TradeRequest
from trader.accountinfo import AccountInfo
from trader.position import Position
from trader.symbol import Symbol
from helpers import *


APP_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(APP_PATH, 'html/')


CONFIG_NAME = "backend/config/config.txt"
flask = Flask(__name__)
app = None


class App:
    COL_INSTRUMENT = 'INSTRUMENT'
    COL_ASK = 'ASK'
    COL_BID = 'BID'
    COL_SPREAD = 'SPREAD'
    COL_ATR = 'ATR'
    COL_WEDGE = 'WEDGE[%]'
    COL_AVAIL = 'AVAILABLE[%]'
    COL_UPDATE = 'UPDATE'
    COLUMNS = [COL_INSTRUMENT, COL_ASK, COL_BID, COL_SPREAD, COL_ATR, COL_WEDGE, COL_AVAIL, COL_UPDATE]

    def __init__(self):
        self.config = load_config(CONFIG_NAME)
        self.trader = Trader(self.config)
        self.commander = Commander()
        self._set_filter("currency")

    def send_to_commander(self, data):
        data = self.commander.send_instrument(data)

    def run(self):
        self.window.mainloop()

    def _save_to_google(self):
        self.trader.update_history_info()

    def _set_filter(self, filter):
        self.trader.set_filter(filter)

    def _get_account_info(self):
        info = self.trader.get_account_info()
        return {"balance": info.balance,
                "currency": info.currency,
                "profit": info.profit,
                "leverage": info.leverage,
                "company": info.company,
                "server": info.server,
                "login": info.login}

    def _get_symbol(self, sym):
        s = self.trader.get_symbol(sym)
        return s

    def _trade(self, symbol,  lot, type, entry_buy, entry_sell, stoploss_buy, stoploss_sell, takeprofit_buy, takeprofit_sell):
        ACTIONS = {
            "market_buy":  [TradeRequest.get_type_market_buy(), entry_buy, stoploss_buy, takeprofit_buy],
            "limit_buy":   [TradeRequest.get_type_limit_buy(), entry_buy, stoploss_buy, takeprofit_buy],
            "stop_buy":    [TradeRequest.get_type_stop_buy(), entry_buy, stoploss_buy, takeprofit_buy],
            "market_sell": [TradeRequest.get_type_market_sell(), entry_sell, stoploss_sell, takeprofit_sell],
            "limit_sell":  [TradeRequest.get_type_limit_sell(), entry_sell, stoploss_sell, takeprofit_sell],
            "stop_sell":   [TradeRequest.get_type_stop_sell(), entry_sell, stoploss_sell, takeprofit_sell]
        }

        try:
            action = ACTIONS[type]
            tr = TradeRequest(symbol, lot, action[0], action[1], action[2], action[3])
            log(tr.get_request())
            self.trader.trade(tr)
        except Exception as e:
            print("Exception", e)
        return True

    def _get_history_positions(self):
        start_date = convert_string_to_date(self.config["date"])
        positions = self.trader.get_history_positions(start_date, onlyfinished=False)
        print(positions)
        return positions

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
            updated, name, spread, ask, bid, digits, step, session_open, volume_step, point_value, contract_size = sym.get_info()

            # additional calcs
            ratio = (spread/atr)*100
            atr_reserve = ((session_open-bid)/atr)*100

            # Create data set
            #timer = convert_timestamp_to_string(epoch - sym.time)
            timer = get_current_date()
            if updated or not filter_updated:
                react_data[name] = [name,
                                    f"%2.{digits}f" % ask,
                                    f"%2.{digits}f" % bid,
                                    f"%2.{digits}f" % (spread),
                                    "%-2.2f" % atr,
                                    "%-2.2f" % (ratio),
                                    "%-2.2f" % (atr_reserve),
                                    timer]

        return indices, App.COLUMNS,  react_data


def get_current_date():
    return datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")


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
    index, headers, instruments = app._get_symbols(filter)
    account = app._get_account_info()
    return {"headers": headers, "instruments": instruments, "account": account}


def send_command(data):
    '''Updates table with instruments
    '''
    return


@flask.route('/server')
def get_time():
    return {"date": get_current_date()}


@flask.route('/update', methods=['GET'])
def update():
    return get_with_terminal_info()


@flask.route('/get-positions', methods=['GET'])
def get_positions():
    pos = app._get_history_positions()
    return pos


@flask.route('/update-all', methods=['GET'])
def update_all():
    return get_with_terminal_info(force=True)


@flask.route('/trade', methods=['POST'])
def trade():
    data = request.get_json()
    symbol = data.get("symbol")
    lot = data.get("lot")
    type = data.get("type")
    entry_buy = data.get("entry_buy")
    entry_sell = data.get("entry_sell")
    stoploss_buy = data.get("stoploss_buy")
    stoploss_sell = data.get("stoploss_sell")
    takeprofit_buy = data.get("takeprofit_buy")
    takeprofit_sell = data.get("takeprofit_sell")
    app._trade(symbol, lot, type, entry_buy, entry_sell, stoploss_buy, stoploss_sell, takeprofit_buy, takeprofit_sell)
    return {"id": 0}


@flask.route('/command', methods=['POST'])
def command():
    data = request.get_json()
    instrument = data.get("instrument")

    status = app.send_to_commander(instrument)
    symbol = app._get_symbol(instrument)

    updated, name, spread, ask, bid, digits, step, session_open, volume_step, point_value, contract_size = symbol.get_info()
    return {"info": {"name": name, "step": step, "ask": ask, "bid": bid, "volume_step": volume_step, "point_value": point_value, "contract_size": contract_size}}


if __name__ == "__main__":
    try:

        app = App()
        flask.run(debug=True)
    except Exception as e:
        log(e)
