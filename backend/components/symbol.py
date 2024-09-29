class Symbol:
    EXCEPTED_FIXED = "JPY"
    DIVISION_BY_ZERO = 0.0000001
    def __init__(self, sym, conversion=False):
        self.updated = False  # Initialize `updated` flag as False
        self.step = sym.trade_tick_size
        self.digits = sym.digits
        self.name = sym.name
        self.description = sym.description
        self.volume_step = sym.volume_step
        self.contract_size = sym.trade_contract_size
        self.currency = f"{sym.currency_base}/{sym.currency_profit}"
        self.conversion = conversion
        self.update(sym)  # Call `update()` method to set initial values

    def update(self, sym):
        # Only set member variables inside the update method
        self.updated = (self.time != sym.time) if hasattr(self, 'time') else True
        self.time = sym.time
        self.ask = sym.ask
        self.bid = sym.bid
        self.session_open = sym.session_open+Symbol.DIVISION_BY_ZERO
        self.spread = sym.spread * sym.trade_tick_size

        # Fix broker problem with the tick value
        self.tick_value = sym.trade_tick_value

        # Calculate point value, does not always work
        # self.point_value = (self.tick_value * sym.point) / self.step if self.step else 0
        self.point_value = 1
        self.price_change = ((self.bid - self.session_open) / (self.session_open)) * 100.0

        # Override point value based on currency exception
        if Symbol.EXCEPTED_FIXED in self.currency:
            self.point_value /= 100.0

    def get_price_change(self):
        return self.price_change

    def get_digits(self):
        return self.digits
    
    def get_tick_value(self):
        return self.tick_value

    def get_contract_size(self):
        return self.contract_size

    def get_point_value(self):
        return self.point_value

    def get_step(self):
        return self.step
    
    def get_volume_step(self):
        return self.volume_step
    
    def get_session_open(self):
        return self.session_open
    
    def get_description(self):
        return self.description

    def get_name(self):
        return self.name
    
    def get_spread(self):
        return self.spread
    
    def get_ask(self):
        return self.ask
    
    def get_bid(self):
        return self.bid

    def get_conversion(self):
        return self.conversion

    def get_currency(self):
        return self.currency

    def is_updated(self):
        return self.updated
