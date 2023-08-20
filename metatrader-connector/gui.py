from helpers import *
from trader import Trader
import tkinter as tk
from tkinter import ttk
import datetime
from flask import Flask, render_template


APP_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(APP_PATH, 'html/')


app = Flask(__name__)
gui = None


class Gui:
    BACKGROUND = '#AC99F2'
    COLOR_BUY = '#03b6fc'
    COLOR_SELL = '#fc034e'

    def __init__(self, trader):
        self.trader = trader
        self.window = tk.Tk()
        self.window .title('Trading Tool')
        self.window.geometry('800x800')

        # self.window.grid_columnconfigure(0, weight=1)
        # self.window.grid_rowconfigure(0, weight=1)

        self.window.columnconfigure(tuple(range(3)), weight=1)
        self.window.rowconfigure(tuple(range(2)), weight=1)

        self.window['bg'] = Gui.BACKGROUND

        # Frames
        self.left = tk.Frame(master=self.window)
        self.left.grid(column=0, row=0, sticky="nswe", columnspan=1, rowspan=3)

        self.right = tk.Frame(master=self.window)
        self.right.grid(column=1, row=0, sticky="nswe", columnspan=3,  rowspan=3)

        ###### Left ######
        self.instruments = ttk.Treeview(self.left)

        vsb = tk.Scrollbar(self.left, orient='vertical', command=self.instruments.yview)
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        self.instruments.configure(yscrollcommand=vsb.set)

        # Values
        self.instruments['columns'] = ('instrument', 'atr', 'change', 'time')
        self.instruments.column("#0", width=0,  stretch=tk.NO)
        self.instruments.column("instrument", anchor=tk.CENTER, width=80)
        self.instruments.column("atr", anchor=tk.CENTER, width=80)
        # self.instruments.column("bid",anchor=tk.CENTER, width=80)
        # self.instruments.column("ask",anchor=tk.CENTER, width=80)
        self.instruments.column("change", anchor=tk.CENTER, width=80)
        self.instruments.column("time", anchor=tk.CENTER, width=80)

        self.instruments.heading("#0", text="", anchor=tk.CENTER)
        self.instruments.heading("instrument", text="Instrument", anchor=tk.CENTER)
        self.instruments.heading("atr", text="ATR", anchor=tk.CENTER)
        # self.instruments.heading("bid",text="Bid",anchor=tk.CENTER)
        # self.instruments.heading("ask",text="Ask",anchor=tk.CENTER)
        self.instruments.heading("change", text="Change", anchor=tk.CENTER)
        self.instruments.heading("time", text="Time", anchor=tk.CENTER)

        # config
        self.instruments.tag_configure('negative', background='#FF0000')
        self.instruments.tag_configure('positive', background='#00FF00')
        self.instruments.pack(side=tk.LEFT, fill=tk.BOTH, expand=tk.TRUE)

        ###### Right ######
        symbol_name = tk.Label(self.right, text="--", anchor="ne")
        symbol_name.grid(column=1, row=1)

        # Buttons
        button_update = tk.Button(self.right, text="Update", command=self._build_tree)
        button_update.grid(column=1, row=2)

        # Update google
        button_google = tk.Button(self.right, text="Save to Google", command=self._save_to_google)
        button_google.grid(column=2, row=2)

        # Ordering buttons
        self.button_buy_market = tk.Button(self.right, text="Buy[Market]", bg=Gui.COLOR_BUY)
        self.button_buy_market.grid(column=1, row=3, sticky="nsew")

        self.button_buy_limit = tk.Button(self.right, text="Buy[Limit]", bg=Gui.COLOR_BUY)
        self.button_buy_limit.grid(column=2, row=3, sticky="nsew")

        self.button_buy_stop = tk.Button(self.right, text="Buy[Stop]", bg=Gui.COLOR_BUY)
        self.button_buy_stop.grid(column=3, row=3, sticky="nsew")

        self.button_sell_market = tk.Button(self.right, text="Sell[Market]", bg=Gui.COLOR_SELL)
        self.button_sell_market.grid(column=1, row=4, sticky="nsew")

        self.button_sell_limit = tk.Button(self.right, text="Sell[Limit]", bg=Gui.COLOR_SELL)
        self.button_sell_limit.grid(column=2, row=4, sticky="nsew")

        self.button_sell_stop = tk.Button(self.right, text="Sell[Stop]", bg=Gui.COLOR_SELL)
        self.button_sell_stop.grid(column=3, row=4, sticky="nsew")

        #
        self._build_tree()

    def run(self):
        # self.trader.update_history_info()
        self.window.mainloop()

    def _save_to_google(self):
        self.trader.update_history_info()

    def _build_tree(self):
        # for i in self.instruments.get_children():
        #    self.instruments.delete(i)
        indices = []
        data = {'INSTRUMENT': [], 'ATR': [], 'CHANGE[%]': [], 'TIME': [], }
        columns = ['INSTRUMENT', 'ATR', 'CHANGE[%]', 'TIME']
        syms = trader.get_symbols_sorted()
        for idx in range(len(syms)):
            sym = syms[idx]
            log(sym.name)
            symtick = self.trader.get_tick(sym)

            if symtick != None and (sym.currency_base == trader.currency or sym.currency_profit == trader.currency):
                percent_change = sym.price_change  # 100.0 * (((symtick.bid)-sym.session_open)/sym.session_open)

                if abs(percent_change) > 0:
                    atr = trader.get_atr(sym)
                    fg = ('',)
                    if percent_change > 0:
                        fg = ('positive',)
                    else:
                        fg = ('negative',)

                    indices.append(idx)
                    data['INSTRUMENT'].append(sym.name)
                    data['ATR'].append("%-2.2f   " % atr)
                    data['CHANGE[%]'].append("%-2.2f" % percent_change)
                    data['TIME'].append(datetime.datetime.fromtimestamp(sym.time))

                    # info
                    #self.instruments.insert(parent='',index='end',iid=idx,text='', values=(sym.name, sym.bid, sym.ask, "%-2.2f"%percent_change, datetime.datetime.fromtimestamp(sym.time)), tags=fg)
                    #self.instruments.insert(parent='', index='end', iid=idx, text='', values=(sym.name, "%-2.2f" % atr, "%-2.2f" % percent_change, datetime.datetime.fromtimestamp(sym.time)), tags=fg)
        return indices, columns, data


def make_pretty(styler):
    styler.format_index(lambda v: v.strftime("%A"))
    styler.background_gradient(axis=None, vmin=1, vmax=5, cmap="YlGnBu")
    return styler


def update_table():
    # real data
    index, columns, data = gui._build_tree()

    # create html
    df = pd.DataFrame(data, columns=columns, index=index)

    df.style.pipe(make_pretty)
    table = df.to_html(classes='mystyle', table_id='IdTable')
    return table


@app.route('/')
def index():
    return render_template("index.html", test_table=update_table())


@app.route('/update', methods=['GET', 'POST', 'DELETE', 'PATCH'])
def update():
    return render_template("index.html", test_table=update_table())  # , 204


if __name__ == "__main__":

    # Initialize mt5 and google drive controller
    try:
        config_name = "config/config.txt"
        trader = Trader(config_name)

        # Gui
        gui = Gui(trader)
        app.run(debug=True)
        # gui.run()

    except Exception as e:
        log(e)
