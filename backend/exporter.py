
from helpers import *
from trader.trader import Trader
import datetime
import pytz


def export(data):
    log(f"EXPORTER:Started with {len(data)} Entries")

    log(f"EXPORTER:Finished")


if __name__ == "__main__":
    trader = Trader()
    sym_names = [sym.name for sym in trader.get_symbols()]

    selected_symbol = 'GOLD'

    timezone = pytz.timezone("Etc/UTC")
    utc_from = datetime.datetime(1991, 1, 10, tzinfo=timezone)
    utc_to = datetime.datetime(2020, 2, 11, tzinfo=timezone)
    now_msc = datetime.datetime.utcnow()

    if selected_symbol in sym_names:
        data = trader.get_rates_for_symbol(selected_symbol, utc_from, utc_to)
        #data2 = trader.get_ticks_for_symbol(selected_symbol, utc_from, utc_to)
        export(data)
