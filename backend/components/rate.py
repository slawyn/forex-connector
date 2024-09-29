import pandas as pd
from helpers import *

class Rate:
    IDX_TIME = 0
    IDX_OPEN = 1
    IDX_HIGH = 2
    IDX_LOW = 3
    IDX_CLOSE = 4
    IDX_VOLUME = 5
    IDX_SPREAD = 6

    def __init__(self, rate):
        # convert to ms
        self.time = int(rate[Rate.IDX_TIME])
        self.open = rate[Rate.IDX_OPEN]
        self.high = rate[Rate.IDX_HIGH]
        self.low = rate[Rate.IDX_LOW]
        self.close = rate[Rate.IDX_CLOSE]
        self.volume = int(rate[Rate.IDX_VOLUME])
        self.spread = int(rate[Rate.IDX_SPREAD])

    def add(data):
        rates = [Rate(d) for d in data]
        return rates

    def get_min_max(rates):
        """Find min and max for price and volume"""

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
            H = rates[0].high
            L = rates[0].low
            Cp = rates[0].close
            trs = []
            for idx in range(1, count):
                H = rates[idx].high
                L = rates[idx].low
                tr = max([(H-L), abs(H-Cp), abs(L-Cp)])
                trs.append(tr)
                Cp = rates[idx].close

            if len(trs) != 0:
                atr = sum(trs)/(len(trs))
        except Exception as e:
            print(e)
        return atr

    def to_pandas(rates):
        data = [{
            'time': utc_convert_to_utc(rate.time),
            'Open': rate.open,
            'High': rate.high,
            'Low': rate.low,
            'Close': rate.close,
            'Volume': rate.volume,
            'Spread': rate.spread,
        } for rate in rates]
        
        df = pd.DataFrame(data)
        df.set_index('time', inplace=True)
        return df

    def to_json(rates):
        _json = []
        for rate in rates:
            _json.append({"time": rate.time*1000,
                          "open": rate.open,
                          "high": rate.high,
                          "low": rate.low,
                          "close": rate.close,
                          "volume": rate.volume
                          })

        return _json
