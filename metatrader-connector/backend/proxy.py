from helpers import *
from trader import Trader
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
    COL_2 = 'CHANGE'
    COL_3 = 'TIME'

    def __init__(self):
        self.trader = Trader(CONFIG_NAME)
        self.commander = Commander()

    def send_to_commander(self, data):
        data = self.commander.send_instrument(data)

    def run(self):
        self.window.mainloop()

    def _save_to_google(self):
        self.trader.update_history_info()

    def get_account_info():
        pass

    def _build_tree(self, filter):
        '''Builds a list of instruments based on filter
        '''
        indices = []
        data = {App.COL_0: [], App.COL_1: [], App.COL_2: [], App.COL_3: [], }
        columns = [App.COL_0, App.COL_1, App.COL_2, App.COL_3]
        react_data = []

        ##
        syms = self.trader.get_symbols_sorted()
        for idx in range(len(syms)):
            sym = syms[idx]
            symtick = self.trader.get_tick(sym)

            # Filter based on in and out currency
            if symtick != None and (sym.currency_base == self.trader.currency or sym.currency_profit == self.trader.currency):
                percent_change = sym.price_change  # 100.0 * (((symtick.bid)-sym.session_open)/sym.session_open)

                # Filter based on change
                # TODO add filter here
                atr = self.trader.get_atr(sym)
                fg = ('',)
                if percent_change > 0:
                    fg = ('positive',)
                else:
                    fg = ('negative',)

                indices.append(idx)
                data[App.COL_0].append(sym.name)
                data[App.COL_1].append("%-2.2f   " % atr)
                data[App.COL_2].append("%-2.2f" % percent_change)
                data[App.COL_3].append(datetime.datetime.fromtimestamp(sym.time))

                react_data.append({"id": idx,
                                   "items": [sym.name,
                                             "%-2.2f" % atr,
                                             "%-2.2f" % percent_change,
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


def update_table():
    '''Updates table with instruments
    '''
    filter = []
    index, columns, data, rd = app._build_tree(filter)
    return rd


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


@flask.route('/update', methods=['GET', 'POST', 'DELETE', 'PATCH'])
def update():
    return update_table()


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
