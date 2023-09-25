class Symbol:
    def __init__(self, sym):
        self.time = sym.time
        self.step = sym.trade_tick_size
        self.spread = sym.spread * sym.trade_tick_size
        self.digits = sym.digits
        self.name = sym.name
        self.volume_step = sym.volume_step
        self.point_value = (sym.trade_tick_value*sym.point)/sym.trade_tick_size
        self.contract_size = sym.trade_contract_size

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
        return self.updated, self.name, self.spread, self.ask, self.bid, self.digits, self.step, self.session_open, self.volume_step, self.point_value, self.contract_size

    def is_updated(self):
        return self.updated
