import MetaTrader5 as mt5


class TradeRequest:
    MAGIC = 234000
    COMMENT = "TEST TRADE"
    ORDER_TYPES = [mt5.ORDER_TYPE_BUY, mt5.ORDER_TYPE_BUY_LIMIT, mt5.ORDER_TYPE_BUY_STOP,
                   mt5.ORDER_TYPE_SELL, mt5.ORDER_TYPE_SELL_LIMIT, mt5.ORDER_TYPE_SELL_STOP, ]

    def __init__(self, symbol, lot, order_type, price, stoploss, takeprofit, comment="TEST TRADE"):
        order_type = TradeRequest.ORDER_TYPES[order_type]
        self.request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": lot,
            "type": order_type,
            "price": price,
            "sl": stoploss,
            "tp": takeprofit,
            "deviation": 1,
            "magic": TradeRequest.MAGIC,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC
        }

    def get_type_market_buy():
        return TradeRequest.ORDER_TYPES[0]

    def get_type_limit_buy():
        return TradeRequest.ORDER_TYPES[1]

    def get_type_stop_buy():
        return TradeRequest.ORDER_TYPES[2]

    def get_type_market_sell():
        return TradeRequest.ORDER_TYPES[3]

    def get_type_limit_sell():
        return TradeRequest.ORDER_TYPES[4]

    def get_type_stop_sell():
        return TradeRequest.ORDER_TYPES[5]

    def get_request(self):
        return self.request
