import MetaTrader5 as mt5
import subprocess
from helpers import *
from trader.mt5codes import ERROR_CODES

TYPES_MAP = {
    mt5.ORDER_TYPE_BUY:"market_buy",
    mt5.ORDER_TYPE_BUY_LIMIT:"limit_buy",
    mt5.ORDER_TYPE_BUY_STOP:"stop_buy",
    mt5.ORDER_TYPE_SELL:"market_sell",
    mt5.ORDER_TYPE_SELL_LIMIT:"limit_sell",
    mt5.ORDER_TYPE_SELL_STOP:"stop_sell",
}

CLOSING_TYPES = {
    "close_sell": mt5.ORDER_TYPE_BUY,
    "close_buy": mt5.ORDER_TYPE_SELL,
}

class MetatraderApi:

    def __init__(self, mt_process, mt_config):
        cmd = [mt_process, f"/config:{mt_config}"]
        p = subprocess.Popen(cmd, start_new_session=True)
        log("INFO", cmd)

    def resolve_type_mt5_to_api(self, type):
        return TYPES_MAP[type]
    
    def resolve_type_api_to_mt5(self, type):
        for mt5_type, api_type in TYPES_MAP.items():
            if type == api_type:
                return mt5_type
            
        if type in CLOSING_TYPES:
            return CLOSING_TYPES[type]
        
        raise Exception(f"{__class__.__name__}: Unknown type {type}")
    

    def get_open_positions(self):
        return mt5.positions_get()
    
    def is_connection_present(self):
        if mt5.account_info() is None and not mt5.initialize():
            raise ValueError(f"{__class__.__name__}: initialize() failed, error code =" + str(mt5.last_error()))
        else:
            return True
        
    def get_account(self):
        return mt5.account_info()
    
    def get_orders(self):
        return mt5.orders_get()
    
    def get_rates(self, symbol_name, utc_from, utc_to, frame=mt5.TIMEFRAME_H1):
        data = []
        try:
            data = mt5.copy_rates_range(symbol_name, frame, utc_from, utc_to)
            code = mt5.last_error()[0]
            if code != 1:
                data = []
                raise Exception(f"{__class__.__name__}: During fetching of rates {symbol_name} {mt5.last_error()}")
        except Exception as e:
            log(e)
        return data
    
    def get_ticks_for_symbol(self, symbol_name, utc_from, utc_to):
        data = []
        try:
            data = mt5.copy_ticks_range(symbol_name, utc_from, utc_to, mt5.COPY_TICKS_ALL)
            code = mt5.last_error()[0]
            if code != 1:
                data = []
                raise Exception(f"{__class__.__name__}: During fetching of ticks {symbol_name} {mt5.last_error()}")
        except Exception as e:
            log(e)

        return data
    
    def trade(self, request):
        try:
            log(request)
            result = mt5.order_send(request)
            if result != None:
                return [result.retcode, ERROR_CODES[result.retcode]]
            else:
                retcode = mt5.last_error()
                return [retcode[0], retcode[1]]
        except Exception as e:
            print("Exception", e)

        return [-1, "unknown error"]