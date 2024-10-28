class Tick:
    IDX_ASK = 2
    IDX_BID = 1
    IDX_TIME = 0
    def __init__(self, name, time_ms, data=[]):
        self.name = name
        self.ask = 0
        self.bid = 0
        self.spread = 0
        self.update(data, time_ms- 1000)
    
    def update(self, data, end_ms):
        if len(data) > 0:
            last_data = data[-1]
            self.time_ms = last_data[Tick.IDX_TIME]*1000
            self.ask = last_data[Tick.IDX_ASK]
            self.bid = last_data[Tick.IDX_BID]
            self.spread = self.ask - self.bid
        else:
            self.time_ms = end_ms