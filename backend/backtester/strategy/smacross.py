from backtesting import Strategy
from backtesting.lib import crossover
import talib
import pandas as pd
from helpers import *


class SmaCross(Strategy):
    n1 = 5
    n2 = 20
    n = 20
    dev = 2

    calculator = None
    ratio = 2.25
    risk_amount = 5

    PATTERN_BAR_COUNT = 6
    LINEAR_BAR_COUNT = 2
    ANGLE_RISE = 0.05
    ANGLE_FALL = -0.05

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



    def _calc_engulfing_pattern(self):
        close = self.data.Close[-SmaCross.PATTERN_BAR_COUNT:]
        open = self.data.Open[-SmaCross.PATTERN_BAR_COUNT:]
        high = self.data.High[-SmaCross.PATTERN_BAR_COUNT:]
        low = self.data.Low[-SmaCross.PATTERN_BAR_COUNT:]
        return {"engulfing":talib.CDLENGULFING(open, high, low, close).tolist()[-1]}
    
    def _calc_hammer_pattern(self):
        close = self.data.Close[-SmaCross.PATTERN_BAR_COUNT:]
        open = self.data.Open[-SmaCross.PATTERN_BAR_COUNT:]
        high = self.data.High[-SmaCross.PATTERN_BAR_COUNT:]
        low = self.data.Low[-SmaCross.PATTERN_BAR_COUNT:]
        return {"hammer":talib.CDLHAMMER(open, high, low, close).tolist()[-1]}
    
    def _calc_linear_reg(self):
        close = self.data.Close[-SmaCross.PATTERN_BAR_COUNT:]
        slope =  talib.LINEARREG_SLOPE(close, timeperiod=SmaCross.LINEAR_BAR_COUNT)
        angle =  talib.LINEARREG_ANGLE(close, timeperiod=SmaCross.LINEAR_BAR_COUNT)

        current_angle = angle.tolist()[-1]
        desc = "side"
        if current_angle > SmaCross.ANGLE_RISE:
            desc = "rise"
        elif current_angle < SmaCross.ANGLE_FALL:
            desc = "fall"
        return {"slope":slope.tolist()[-1], "angle":current_angle, "desc_angle":desc}


    def next(self):
        price = self.data.Close[-1]
        spread = self.data.Spread[-1]

        close = self.data.Close[-1]
        open = self.data.Open[-1]
        high = self.data.High[-1]
        low = self.data.Low[-1]

        parameters = self.calculator.calculate_stoploss(price, spread, self.risk_amount)
        analysis = {**self._calc_engulfing_pattern(),  **self._calc_hammer_pattern(), **self._calc_linear_reg()}
        

        print_dict(analysis)
        if crossover(self.sma1, self.sma2):
            print("BUY: ", parameters.ask, parameters.sl_buy, parameters.tp_buy)
            self.buy(size=parameters.risk_volume, sl=parameters.sl_buy, tp=parameters.tp_buy)
        elif crossover(self.sma2, self.sma1):
            print("SELL: ", parameters.bid, parameters.sl_sell, parameters.tp_sell)
            self.sell(size=parameters.risk_volume, sl=parameters.sl_sell, tp=parameters.tp_sell)
