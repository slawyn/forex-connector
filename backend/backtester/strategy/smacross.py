from backtesting import Strategy
from backtesting.lib import crossover
import talib
import pandas as pd

class SmaCross(Strategy):
    n1 = 5
    n2 = 20
    n = 20
    dev = 2

    calculator = None
    ratio = 2.25
    risk_amount = 5
    risk_lot = 0.01

    def init(self):
        close = self.data.Close
        
        # Calculate SMAs using TA-Lib
        self.sma1 = self.I(lambda: talib.SMA(close, timeperiod=self.n1), name='SMA1')
        self.sma2 = self.I(lambda: talib.SMA(close, timeperiod=self.n2), name='SMA2')

        # Calculate Bollinger Bands using TA-Lib
        self.upper_band, self.middle_band, self.lower_band = talib.BBANDS(
            close, timeperiod=self.n, nbdevup=self.dev, nbdevdn=self.dev, matype=0
        )

        # Register for plotting
        self.I(lambda: self.upper_band, name='Upper Band')
        self.I(lambda: self.middle_band, name='Middle Band')
        self.I(lambda: self.lower_band, name='Lower Band')

    def _get_current_trades(self):
        current_equity = self.equity
        for trade in self.trades:
            print(f"Open Trade ID: {trade.entry_time}, Entry Price: {trade.entry_price}, Size: {trade.size}")

        # Check current position
        if self.position:
            print(f"Current position size: {self.position.size}, Entry price: {self.position.pl}")

    def next(self):
        price = self.data.Close[-1]
        spread = self.data.Spread[-1]

        parameters = self.calculator.calculate_stoploss(price, spread, self.risk_amount, self.risk_lot)

        if crossover(self.sma1, self.sma2):
            print("BUY: ", parameters.ask, parameters.sl_buy, parameters.tp_buy)
            self.buy(size=self.risk_lot, sl=parameters.sl_buy, tp=parameters.tp_buy)
        elif crossover(self.sma2, self.sma1):
            print("SELL: ", parameters.bid, parameters.sl_sell, parameters.tp_sell)
            self.sell(size=self.risk_lot, sl=parameters.sl_sell, tp=parameters.tp_sell)
