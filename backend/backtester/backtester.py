from backtesting import Backtest, Strategy
from backtesting.lib import crossover
from backtesting.test import SMA


class SmaCross(Strategy):
    n1 = 10
    n2 = 20

    def init(self):
        close = self.data.Close
        self.sma1 = self.I(SMA, close, self.n1)
        self.sma2 = self.I(SMA, close, self.n2)

    def next(self):
        if crossover(self.sma1, self.sma2):
            self.buy()
        elif crossover(self.sma2, self.sma1):
            self.sell()


class Backtester:
    def __init__(self, pd):
        self.bt = Backtest(pd,
                           SmaCross,
                           cash=500,
                           commission=.002,
                           exclusive_orders=True)

    def run(self):
        output = self.bt.run()
        print(output)
        self.bt.plot()

