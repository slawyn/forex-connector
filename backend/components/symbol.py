class Symbol:
    EXCEPTED_FIXED = "JPY"

    def __init__(self, sym, conversion=False):
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

    def update(self, sym):
        self.updated = (self.time != sym.time)
        self.ask = sym.ask
        self.bid = sym.bid
        self.time = sym.time
        self.session_open = sym.session_open
        self.spread = sym.spread * sym.trade_tick_size

        # Fix broker problem with the tick value
        self.tick_value = sym.trade_tick_value  # (self.contract_size*self.step)

        # calculate point value, does not always work
        self.point_value = (self.tick_value * sym.point)/self.step
        self.price_change = ((self.bid-self.session_open)/(self.session_open+0.00000001))*100.0

        ##
        self.point_value = 1

        # Pips
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

    def calculate_stoploss(self, risk_amount, risk_lot):
        point_value = self.point_value
        if self.conversion:
            point_value = 1/self.ask
        points = (risk_amount / (self.contract_size * point_value * risk_lot))

        sl_sell = self.ask + points
        sl_buy = self.bid - points
        return [points, sl_sell, sl_buy]
