from backtesting import Backtest
from backtester.strategy.smacross import SmaCross


class Backtester:
    def __init__(self, pd,  conversion, contract_size, tick_size, point_value):
        self.calculator = Calculator(conversion, contract_size, tick_size, point_value)
        self.bt = Backtest(pd,
                           SmaCross,
                           cash=500,
                           commission=0,
                           exclusive_orders=True)

    def run(self):
        output = self.bt.run(calculator=self.calculator)
        print(output)
        self.bt.plot()


class Calculator:

    def __init__(self, conversion, contract_size, tick_size, point_value):
        self.conversion = conversion
        self.contract_size = contract_size
        self.point_value = point_value
        self.tick_size = tick_size

    def calculate_stoploss(self, price, spread, risk_amount, risk_lot):
        point_value = self.point_value
        bid = price
        ask = spread * self.tick_size
        if self.conversion:
            point_value = 1/ask
        points = (risk_amount / (self.contract_size * point_value * risk_lot))

        sl_sell = ask + points
        sl_buy = bid - points
        return [points, sl_sell, sl_buy]
