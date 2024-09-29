from backtesting import Strategy
from backtesting.lib import crossover
from backtesting.test import SMA


class SmaCross(Strategy):
    n1 = 10
    n2 = 20
    calculator = None
    ratio = 2.25
    risk_amount = 5
    risk_lot = 0.01

    def init(self):
        close = self.data.Close
        self.sma1 = self.I(SMA, close, self.n1)
        self.sma2 = self.I(SMA, close, self.n2)

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
            print("BUY: ",parameters.ask, parameters.sl_buy, parameters.tp_buy)
            self.buy(size=self.risk_lot, sl=parameters.sl_buy, tp = parameters.tp_buy)
        elif crossover(self.sma2, self.sma1):
            print("SELL: ",parameters.bid, parameters.sl_sell, parameters.tp_sell)
            self.sell(size=self.risk_lot, sl=parameters.sl_sell, tp = parameters.tp_sell)

