from helpers import *
from trader import Trader
import tkinter as tk
from  tkinter import ttk
import datetime


class Gui:
    BACKGROUND =  '#AC99F2'
    COLOR_BUY = '#03b6fc'
    COLOR_SELL = '#fc034e'
    def __init__(self, trader):
        self.trader = trader
        self.window  = tk.Tk()
        self.window .title('Trading Tool')
        self.window.geometry('800x800')

        #self.window.grid_columnconfigure(0, weight=1)
        #self.window.grid_rowconfigure(0, weight=1)

        self.window.columnconfigure(tuple(range(3)), weight=1)
        self.window.rowconfigure(tuple(range(2)), weight=1)

        self.window ['bg'] = Gui.BACKGROUND

        ### Frames
        self.left = tk.Frame(master=self.window)
        self.left.grid(column=0, row=0, sticky="nswe", columnspan=1, rowspan=3)

        self.right = tk.Frame(master=self.window)
        self.right.grid(column=1, row=0, sticky="nswe", columnspan=3,  rowspan=3)

        ###### Left ######
        self.instruments = ttk.Treeview(self.left)

        vsb = tk.Scrollbar(self.left, orient='vertical', command=self.instruments.yview)
        vsb.pack(side= tk.RIGHT, fill=tk.Y)
        self.instruments.configure(yscrollcommand=vsb.set)

        # Values
        self.instruments['columns'] = ('instrument', 'atr', 'change','time')
        self.instruments.column("#0", width=0,  stretch=tk.NO)
        self.instruments.column("instrument",anchor=tk.CENTER, width=80)
        self.instruments.column("atr",anchor=tk.CENTER, width=80)
        #self.instruments.column("bid",anchor=tk.CENTER, width=80)
        #self.instruments.column("ask",anchor=tk.CENTER, width=80)
        self.instruments.column("change",anchor=tk.CENTER, width=80)
        self.instruments.column("time",anchor=tk.CENTER, width=80)

        self.instruments.heading("#0",text="",anchor=tk.CENTER)
        self.instruments.heading("instrument",text="Instrument",anchor=tk.CENTER)
        self.instruments.heading("atr", text="ATR",anchor=tk.CENTER)
        #self.instruments.heading("bid",text="Bid",anchor=tk.CENTER)
        #self.instruments.heading("ask",text="Ask",anchor=tk.CENTER)
        self.instruments.heading("change",text="Change",anchor=tk.CENTER)
        self.instruments.heading("time",text="Time",anchor=tk.CENTER)

        # config
        self.instruments.tag_configure('negative', background='#FF0000')
        self.instruments.tag_configure('positive', background='#00FF00')
        self.instruments.pack(side=tk.LEFT, fill=tk.BOTH, expand=tk.TRUE)

        ###### Right ######
        symbol_name = tk.Label(self.right, text="--",anchor="ne")
        symbol_name.grid(column=1,row=1)


        #Buttons
        button_update = tk.Button(self.right, text="Update", command=self._build_tree)
        button_update.grid(column=1,row=2)

        #Update google
        button_google = tk.Button(self.right, text="Save to Google", command=self._save_to_google)
        button_google.grid(column=2,row=2)

        ## Ordering buttons
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
        #self.trader.update_history_info()
        self.window.mainloop()

    def _save_to_google(self):
        self.trader.update_history_info()

    def _build_tree(self):
        for i in self.instruments.get_children():
               self.instruments.delete(i)

        syms = trader.get_symbols_sorted()
        for idx in range(len(syms)):
            sym = syms[idx]

            symtick = self.trader.get_tick(sym)

            if symtick != None and ( sym.currency_base == trader.currency or sym.currency_profit == trader.currency):
                percent_change = sym.price_change #100.0 * (((symtick.bid)-sym.session_open)/sym.session_open)

                if abs(percent_change)>2:
                    atr = trader.get_atr(sym)
                    fg  = ('',)
                    if percent_change>0:
                        fg =('positive',)
                    else:
                        fg =('negative',)

                    #self.instruments.insert(parent='',index='end',iid=idx,text='', values=(sym.name, sym.bid, sym.ask, "%-2.2f"%percent_change, datetime.datetime.fromtimestamp(sym.time)), tags=fg)
                    self.instruments.insert(parent='',index='end',iid=idx,text='', values=(sym.name, "%-2.2f"%atr, "%-2.2f"%percent_change, datetime.datetime.fromtimestamp(sym.time)), tags=fg)



if __name__ == "__main__":
   config_name = "config/config.txt"

   # Initialize mt5 and google drive controller
   try:
       trader = Trader(config_name)

       # Gui
       gui = Gui(trader)
       gui.run()

   except Exception as e:
       log(e)
