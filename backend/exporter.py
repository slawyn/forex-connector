
from helpers import *
from trader.trader import Trader
import datetime
import pytz


class Exporter():
    def __init__(self, symbol, datetime_start, datetime_end):
        #timezone = pytz.timezone("Etc/UTC")

        self.trader = Trader()
        self.symbol = symbol
        sym_names = [sym.name for sym in self.trader.get_symbols()]
        if self.symbol not in sym_names:
            raise Exception(f"Symbol <{symbol}> not found")
        else:
            self.date_start = datetime_start
            self.date_end = datetime_end

    def get_rates(self, now=False):
        end_date = datetime.datetime.utcnow() if now else self.date_end
        start_date = self.date_start
        data = self.trader.get_rates_for_symbol(self.symbol, start_date, end_date)
        return data

    def get_ticks(self, now=False):
        end_date = datetime.datetime.utcnow() if now else self.date_end
        start_date = self.date_start
        data = self.trader.get_ticks_for_symbol(self.symbol, start_date, end_date)
        return data


# Example of usage
if __name__ == "__main__":
    exporter = Exporter('GOLD', datetime.datetime(2023, 2, 11), datetime.datetime(2023, 2, 12))
    data = exporter.get_ticks()
