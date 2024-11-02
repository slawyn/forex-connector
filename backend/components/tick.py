from components.rate import Rate

class Tick:
    IDX_ASK = 2
    IDX_BID = 1
    IDX_TIME = 0


    def __init__(self, name, time_ms):
        self.name = name
        self.ask = 0
        self.bid = 0
        self.spread = 0
        self.time_ms = time_ms- 1000
    
    def update(self, tick_data, rate_data, symbol_tick_size, end_ms):
        if len(tick_data) > 0:
            last_tick = tick_data[-1]
            self.time_ms = last_tick[Tick.IDX_TIME]*1000
            self.ask = last_tick[Tick.IDX_ASK]
            self.bid = last_tick[Tick.IDX_BID]
            self.spread = self.ask - self.bid
        elif len(rate_data) > 0:
            last_rate = rate_data[-1]
            self.time_ms = last_rate.time*1000
            self.spread = last_rate.spread*symbol_tick_size
            self.ask = last_rate.close + self.spread
            self.bid = last_rate.close
        else:
            self.time_ms = end_ms