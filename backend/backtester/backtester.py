from backtesting import Backtest
from backtester.strategy.smacross import SmaCross


class Parameters:
    def __init__(self, ask, bid, points, sl_sell, sl_buy, tp_buy, tp_sell):
        self.ask = ask
        self.bid = bid
        self.points = points
        self.sl_sell = sl_sell
        self.sl_buy = sl_buy
        self.tp_sell = tp_sell
        self.tp_buy = tp_buy

    def __str__(self):
        return f"{self.ask:10} {self.bid:10} {self.points:10} [{self.sl_sell:10} {self.tp_sell}] [{self.sl_buy} {self.tp_buy}]" 
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
        ask = price + spread * self.tick_size
        if self.conversion:
            point_value = 1/ask
        points = (risk_amount / (self.contract_size * point_value * risk_lot))
        ratioed_points = points*2.25

        sl_sell = bid + points
        tp_sell = bid - ratioed_points
        
        sl_buy = ask - points
        tp_buy = ask + ratioed_points
        return Parameters(ask, bid, points, sl_sell, sl_buy,  tp_buy, tp_sell)
