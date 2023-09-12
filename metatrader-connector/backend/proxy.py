from helpers import *
from trader import Trader, AccountInfo
import tkinter as tk
from tkinter import ttk
import datetime
from datetime import datetime
from flask import Flask, request, render_template
from commander import Commander
import time


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

    def _get_symbol(self, sym):
        s = self.trader.get_symbol(sym)
        return s

    def _get_symbols(self, filter):
        '''Builds a list of instruments based on filter
        '''
        indices = []
        react_data = {}

        ##

        syms = self.trader.get_updated_symbols_sorted()
        indices = range(len(syms))
        date = datetime.utcnow() - datetime(1970, 1, 1)
        epoch = date.total_seconds() + (2*60*60)

        for idx in indices:
            sym = syms[idx]
            atr = self.trader.get_atr(sym)
            updated, name, spread, ask, bid, digits, step, session_open, volume_step, point_value = sym.get_info()

            # additional calcs
            ratio = (spread/atr)*100
            atr_reserve = ((session_open-bid)/atr)*100

            # Create data set
            time_diff_sec = (epoch - sym.time)
            if updated:
                react_data[name] = [name,
                                    f"%2.{digits}f" % ask,
                                    f"%2.{digits}f" % bid,
                                    f"%2.{digits}f" % (spread),
                                    "%-2.2f" % atr,
                                    "%-2.2f" % (ratio),
                                    "%-2.2f" % (atr_reserve),
                                    convert_timestamp_to_string(time_diff_sec)]

        return indices, App.COLUMNS,  react_data


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


def get_with_terminal_info():
    '''Updates table with instruments
    '''
    filter = []
    index, headers, instruments = app._get_symbols(filter)
    account = app._get_account_info()
    return {"headers": headers, "instruments": instruments, "account": account}


def send_command(data):
    '''Updates table with instruments
    '''
    return


@flask.route('/server')
def get_time():

    # Returning an api for showing in  reactjs
    return {"date": datetime.now()}


@flask.route('/update', methods=['GET'])
def update():
    return get_with_terminal_info()


@flask.route('/command', methods=['POST'])
def command():
    data = request.get_json()
    instrument = data.get("Instrument")

    status = app.send_to_commander(instrument)
    symbol = app._get_symbol(instrument)

    updated, name, spread, ask, bid, digits, step, session_open, volume_step, point_value = symbol.get_info()
    return {"info": {"name": name, "step": step, "ask": ask, "bid": bid, "volume_step": volume_step, "point_value": point_value}}


if __name__ == "__main__":
    try:

        app = App()
        flask.run(debug=True)
    except Exception as e:
        log(e)
