
class RatesContainer:

    def __init__(self):
        self.rates = {}

    def add_rates(self, rates, time_frame):
        '''Extend the rates
        '''
        if len(rates)>0:
            _timestamp = rates[0][Rate.IDX_TIME]
            if time_frame not in self.rates:
                self.rates[time_frame] = []

            # if the first new element has the same timestamp that matches the old timestamp
            if len(self.rates[time_frame]) > 0 and self.rates[time_frame][-1].get_timestamp() == _timestamp:
                rates = rates[1:]

            for rate in rates:
                self.rates[time_frame].append(Rate(rate))

    def get_rates(self):
        return self.rates

    def get_last_timestamp(self):
        if len(self.rates)>0:
            key = list(self.rates.keys())[-1]
            return self.rates[key][-1].get_timestamp()
        return 0
    
class Rate:
    IDX_TIME = 0
    IDX_OPEN = 1
    IDX_HIGH = 2
    IDX_LOW = 3
    IDX_CLOSE = 4
    IDX_VOLUME = 5

    def __init__(self, rate):
        self.time = rate[Rate.IDX_TIME]
        self.open = rate[Rate.IDX_OPEN]
        self.high = rate[Rate.IDX_HIGH]
        self.low = rate[Rate.IDX_LOW]
        self.close = rate[Rate.IDX_CLOSE]
        self.volume = rate[Rate.IDX_VOLUME]

    def get_timestamp(self):
        return self.time

    def get_min_max(rates):
        '''
        Find min and max for price and volume
        '''

        # Find highest and lowest
        price_max = 0
        price_min = 0xFFFFFFFF
        volume_max = 0
        volume_min = 0xFFFFFFFF

        # time-0 open-1 high-2 low-3 close-4 tickvolume-5 spread-6 realvolume-7
        for rate in rates:
            if rate.high > price_max:
                price_max = rate.high

            if rate.low < price_min:
                price_min = rate.low

            if rate.volume > volume_max:
                volume_max = rate.volume

            if rate.volume < volume_min:
                volume_min = rate.volume

        return price_max, price_min, volume_max, volume_min

    def calculate_average_true_range(rates):
        atr = 0.0001
        try:
            count = len(rates)-1
            H = rates[0][Rate.IDX_HIGH]
            L = rates[0][Rate.IDX_LOW]
            Cp = rates[0][Rate.IDX_CLOSE]
            trs = []
            for idx in range(1, count):
                H = rates[idx][Rate.IDX_HIGH]
                L = rates[idx][Rate.IDX_LOW]
                tr = max([(H-L), abs(H-Cp), abs(L-Cp)])
                trs.append(tr)
                Cp = rates[idx][Rate.IDX_CLOSE]

            if len(trs) != 0:
                atr = sum(trs)/(len(trs))
        except Exception as e:
            print(e)
        return atr
