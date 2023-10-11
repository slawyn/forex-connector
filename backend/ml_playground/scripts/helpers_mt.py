import MetaTrader5 as mt5

def initialize_mt5():
    # Connect to MetaTrader 5
    if not mt5.initialize():
        print("MetaTrader 5 initialization failed")
        return False
    return True


def disconnect_mt5():
    # Disconnect from MetaTrader 5
    mt5.shutdown()

def fetch_ticks(symbol, start_date, end_date):
    if not initialize_mt5():
        return None

    # Retrieve symbol tick data for the specified time range
    ticks = mt5.copy_ticks_range(symbol, start_date, end_date, mt5.COPY_TICKS_ALL)

    disconnect_mt5()

    return ticks