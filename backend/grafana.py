import helpers

class Grafana:
    def __init__(self, cb_get_timeframes, cb_get_instruments, cb_get_rates):
        self.cb_get_timeframes = cb_get_timeframes
        self.cb_get_instruments = cb_get_instruments
        self.cb_get_rates = cb_get_rates

    def get_metrics(self):
        labels = [{"label":timeframe,"value":timeframe} for timeframe in self.cb_get_timeframes()]
        instruments = [{"label":sym,"value":sym} for sym in self.cb_get_instruments()]
        return  [{
                "value": "Data",
                "payloads": [
                    {
                        "name": "timeframe",
                        "type": "select",
                        "options": labels
                    },
                    {
                        "name": "instrument",
                        "type": "select",
                        "options": instruments
                    }]
        }]
    
    def get_variable(self, data):
        variable = data.get("payload").get("target")
        if variable == "instrument":
            return [{"__text": sym , "__value":sym} for sym in self.cb_get_instruments()]
        elif variable == "timeframe":
            return [{"__text": timeframe , "__value":timeframe}  for timeframe in self.cb_get_timeframes()]
        return []
    
    def get_query(self, data):
        period = data.get("range")
        payloads =  data.get("targets")[0].get("payload")
        timeframe = payloads.get("timeframe")
        instrument = payloads.get("instrument")

        _interval = data.get("intervalMs")

        _from_timestamp_ms = helpers.convert_date_to_timestamp_ms(period.get("from"))
        _totimestamp_ms = helpers.convert_date_to_timestamp_ms(period.get("to"))

        data = []
        highs, lows, opens, closes, volumes = [], [], [], [], []
        for timestamp_ms, rate in self.cb_get_rates(instrument, timeframe, _from_timestamp_ms, _totimestamp_ms).items():
            highs.append([rate.high, timestamp_ms])
            lows.append([rate.low, timestamp_ms])
            opens.append([rate.open, timestamp_ms])
            closes.append([rate.close, timestamp_ms])
            volumes.append([rate.volume, timestamp_ms])

        data.append({"target": "high", "datapoints": highs})
        data.append({"target": "low", "datapoints": lows})
        data.append({"target": "open", "datapoints": opens})
        data.append({"target": "close", "datapoints": closes})
        data.append({"target": "volume", "datapoints": volumes})
        return data