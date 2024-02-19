import MetaTrader5 as mt5
import datetime

def app(text):
    with open("test.txt", "a") as myfile:
        myfile.write(str(text) + "\n\n")


RATES_TIMESTAMP = 0
class Symbol:
    EXCEPTED_FIXED = "JPY"

    def __init__(self, sym, conversion=False):
        self.rates = []
        self.time = sym.time
        self.step = sym.trade_tick_size
        self.digits = sym.digits
        self.name = sym.name
        self.description = sym.description
        self.volume_step = sym.volume_step
        self.contract_size = sym.trade_contract_size
        self.currency = f"{sym.currency_base}/{sym.currency_profit}"

        self.conversion = conversion

        # updatable: first creation sets the updated flag
        self.update(sym)
        self.updated = True

    def add_rates(self, rates):
        '''Extend the rates
        '''
        if len(rates)>0:
            _timestamp = rates[0][RATES_TIMESTAMP]

            # if the first new element has the same timestamp
            if len(self.rates)>0 and self.rates[-1][RATES_TIMESTAMP] == _timestamp:
                self.rates.extend(rates[1:])
            else:
                self.rates.extend(rates)

    def get_last_timestamp(self):
        if len(self.rates)>0:
            return self.rates[-1][RATES_TIMESTAMP]
        return datetime.datetime.utcnow()- datetime.timedelta(days=14)

    def update(self, sym):
        self.updated = (self.time != sym.time)
        self.ask = sym.ask
        self.bid = sym.bid
        self.time = sym.time
        self.session_open = sym.session_open
        self.spread = sym.spread * sym.trade_tick_size

        # Fix broker problem with the tick value
        self.trade_tick_value = sym.trade_tick_value  # (self.contract_size*self.step)

        # calculate point value, does not always work
        self.point_value = (self.trade_tick_value * sym.point)/self.step

        ##
        self.point_value = 1

        # Pips
        if Symbol.EXCEPTED_FIXED in self.currency:
            self.point_value /= 100.0

    def get_info(self):
        return self.updated, self.name, self.spread, self.ask, self.bid, self.digits, self.step, self.session_open, self.volume_step, self.point_value, self.contract_size, self.description, self.trade_tick_value

    def get_conversion(self):
        return self.conversion

    def get_currency(self):
        return self.currency

    def is_updated(self):
        return self.updated

    def get_frame_type_m1():
        return mt5.TIMEFRAME_M1

    def get_frame_type_h1():
        return mt5.TIMEFRAME_H1

    def get_frame_type_d1():
        return mt5.TIMEFRAME_D1

    def calculate_stoploss(self, risk_amount, risk_lot):
        point_value = self.point_value
        if self.conversion:
            point_value = 1/self.ask
        points = (risk_amount / (self.contract_size * point_value * risk_lot))

        sl_sell = self.ask + points
        sl_buy = self.bid - points
        return [points, sl_sell, sl_buy]
