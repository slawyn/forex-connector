from backtesting import Strategy
from backtesting.lib import crossover
from backtesting.test import SMA


class SmaCross(Strategy):
    n1 = 10
    n2 = 20
    calculator = None
    def init(self):
        close = self.data.Close
        self.sma1 = self.I(SMA, close, self.n1)
        self.sma2 = self.I(SMA, close, self.n2)

    def next(self):
        # Get the current open and close prices
        current_open = self.data.Open[-1]
        current_close = self.data.Close[-1]
        
        if crossover(self.sma1, self.sma2):
            self.buy(size=0.01)
        elif crossover(self.sma2, self.sma1):
            self.sell(size=0.01)

