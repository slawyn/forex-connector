
from helpers import *
from trader.trader import Trader
import datetime


def export(data):
    log(f"EXPORTER:Started with {len(data)} Entries")

    log(f"EXPORTER:Finished")


if __name__ == "__main__":
    trader = Trader()
    sym_names = [sym.name for sym in trader.get_symbols()]

    start_msc = get_millisecond_timestamp_for_date(datetime.datetime(2020, 1, 1))
    stop_msc = get_millisecond_timestamp_for_date(datetime.datetime(2021, 1, 1))
    now_msc = get_millisecond_timestamp_for_date(datetime.datetime.utcnow())

    selected_symbol = 'GOLD'
    if selected_symbol in sym_names:
        data = trader.get_rates_for_symbol(selected_symbol, start_msc, stop_msc)
        #data2 = trader.get_ticks_for_symbol(selected_symbol, start_msc, stop_msc)
        export(data)
