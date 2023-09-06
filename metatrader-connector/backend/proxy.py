from helpers import *
from trader import Trader, AccountInfo
import tkinter as tk
from tkinter import ttk
import datetime
from flask import Flask, request, render_template
from commander import Commander

APP_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(APP_PATH, 'html/')


CONFIG_NAME = "backend/config/config.txt"
flask = Flask(__name__)
app = None


class App:
    COL_0 = 'INSTRUMENT'
    COL_1 = 'ATR'
    COL_2 = 'SPREAD'
    COL_3 = 'CHANGE'
    COL_4 = 'TIME'

    def __init__(self):
        self.trader = Trader(CONFIG_NAME)
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

    def _get_symbols(self, filter):
        '''Builds a list of instruments based on filter
        '''
        indices = []
        data = {App.COL_0: [], App.COL_1: [], App.COL_2: [], App.COL_3: [], App.COL_4: []}
        columns = [App.COL_0, App.COL_1, App.COL_2, App.COL_3, App.COL_4]
        react_data = []

        ##
        syms = self.trader.get_symbols_sorted()
        indices = range(len(syms))
        for idx in indices:
            sym = syms[idx]
            atr = self.trader.get_atr(sym)
            step = sym.trade_tick_size
            spread = (sym.spread*step)
            ratio = (spread/atr)*100
            atr_reserve = ((sym.session_open-sym.bid)/atr)*100
            data[App.COL_0].append(sym.name)
            data[App.COL_1].append(sym.spread)
            data[App.COL_2].append("%-2.2f" % atr)
            data[App.COL_3].append("%-2.2f" % sym.price_change)
            data[App.COL_4].append(datetime.datetime.fromtimestamp(sym.time))

            react_data.append({"id": idx,
                               "items": [sym.name,
                                         f"%-2.{sym.digits}f" % (spread),
                                         "%-2.2f" % atr,
                                         "%-2.2f" % (ratio),
                                         "%-2.2f" % (atr_reserve),
                                         datetime.datetime.fromtimestamp(sym.time)]
                               })

        return indices, columns, data, react_data


def make_pretty(styler):
    '''Sets up a pretty styler
        styler: styler object
    '''
    styler.format_index(lambda v: v.strftime("%A"))
    styler.background_gradient(axis=None, vmin=1, vmax=5, cmap="YlGnBu")
    return styler


def get_with_terminal_info():
    '''Updates table with instruments
    '''
    filter = []
    index, columns, data, instruments = app._get_symbols(filter)
    account = app._get_account_info()
    return {"instruments": instruments, "account": account}


def send_command(data):
    '''Updates table with instruments
    '''
    app.send_to_commander(data)
    return {'id': '0'}


@flask.route('/data')
def get_time():

    # Returning an api for showing in  reactjs
    return {
        'Name': "geek",
        "Age": "22",
        "Date": datetime.datetime.now(),
        "programming": "python"
    }


@flask.route('/update', methods=['GET'])
def update():
    return get_with_terminal_info()


@flask.route('/command', methods=['POST'])
def command():
    data = request.get_json()
    instrument = data.get("Instrument")
    return send_command(instrument)


if __name__ == "__main__":
    try:

        app = App()
        flask.run(debug=True)
    except Exception as e:
        log(e)
