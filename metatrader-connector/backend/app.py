from helpers import *
from trader import Trader
import tkinter as tk
from tkinter import ttk
import datetime
from flask import Flask, render_template


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

    def __init__(self, trader):
        self.trader = trader

    def run(self):
        self.window.mainloop()

    def _save_to_google(self):
        self.trader.update_history_info()

    def _build_tree(self):
        indices = []
        data = {App.COL_0: [], App.COL_1: [], App.COL_2: [], App.COL_3: [], }
        columns = [App.COL_0, App.COL_1, App.COL_2, App.COL_3]
        syms = self.trader.get_symbols_sorted()
        react_data = []

        for idx in range(len(syms)):
            sym = syms[idx]

            symtick = self.trader.get_tick(sym)

            # Filter based on in and out currency
            if symtick != None and (sym.currency_base == self.trader.currency or sym.currency_profit == self.trader.currency):
                percent_change = sym.price_change  # 100.0 * (((symtick.bid)-sym.session_open)/sym.session_open)

                # Filter based on change
                if abs(percent_change) > 0:
                    log(f"[+]{sym.name}")
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
                else:
                    log(f"[-]{sym.name}")

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
    index, columns, data, rd = app._build_tree()

    # create html
    #df = pd.DataFrame(data, columns=columns, index=index)

    # df.style.pipe(make_pretty)
    #table = df.to_html(classes='mystyle', table_id='IdTable')
    # return table
    return rd

# Route for seeing a data


@flask.route('/data')
def get_time():

    # Returning an api for showing in  reactjs
    return {
        'Name': "geek",
        "Age": "22",
        "Date": datetime.datetime.now(),
        "programming": "python"
    }


@flask.route('/')
def index():
    return render_template("index.html", test_table=update_table())


@flask.route('/update', methods=['GET', 'POST', 'DELETE', 'PATCH'])
def update():
    return update_table()
    # return render_template("index.html", test_table=update_table())  # , 204


if __name__ == "__main__":
    try:

        app = App(Trader(CONFIG_NAME))
        flask.run(debug=True)
    except Exception as e:
        log(e)
