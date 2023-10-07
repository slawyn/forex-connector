import MetaTrader5 as mt5


def app(text):
    with open("test.txt", "a") as myfile:
        myfile.write(str(text) + "\n")


class Symbol:
    EXCEPTED_FIXED = {""}

    def __init__(self, sym):
        self.time = sym.time
        self.step = sym.trade_tick_size
        self.spread = sym.spread * sym.trade_tick_size
        self.digits = sym.digits
        self.name = sym.name
        self.description = sym.description
        self.volume_step = sym.volume_step
        self.trade_tick_value = sym.trade_tick_value
        self.point_value = (sym.trade_tick_value*sym.point)/sym.trade_tick_size
        self.contract_size = sym.trade_contract_size

        if self.contract_size == 1:
            self.point_value *= 100.0

        # Pips
        if self.digits == 3:
            self.point_value /= 100.0

        # updatable: first creation sets the updated flag
        self.update(sym)
        self.updated = True

    def update(self, sym):
        self.updated = (self.time != sym.time)
        self.ask = sym.ask
        self.bid = sym.bid
        self.time = sym.time
        self.session_open = sym.session_open

    def get_info(self):
        return self.updated, self.name, self.spread, self.ask, self.bid, self.digits, self.step, self.session_open, self.volume_step, self.point_value, self.contract_size, self.description, self.trade_tick_value

    def is_updated(self):
        return self.updated

    def get_frame_type_m1():
        return mt5.TIMEFRAME_M1

    def get_frame_type_h1():
        return mt5.TIMEFRAME_H1

    def get_frame_type_d1():
        return mt5.TIMEFRAME_D1
