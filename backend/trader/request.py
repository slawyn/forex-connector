import MetaTrader5 as mt5


class TradeRequest:
    MAGIC = 234000
    COMMENT = "TEST TRADE"
    ORDER_TYPES = [mt5.ORDER_TYPE_BUY,
                   mt5.ORDER_TYPE_BUY_LIMIT,
                   mt5.ORDER_TYPE_BUY_STOP,
                   mt5.ORDER_TYPE_SELL,
                   mt5.ORDER_TYPE_SELL_LIMIT,
                   mt5.ORDER_TYPE_SELL_STOP,
                   mt5.ORDER_TYPE_CLOSE_BY
                   ]

    TRADE_TYPES = [mt5.TRADE_ACTION_DEAL,
                   mt5.TRADE_ACTION_DEAL,
                   mt5.TRADE_ACTION_DEAL,
                   mt5.TRADE_ACTION_DEAL,
                   mt5.TRADE_ACTION_DEAL,
                   mt5.TRADE_ACTION_DEAL,
                   mt5.TRADE_ACTION_CLOSE_BY
                   ]

    def __init__(self, symbol, lot, order, price, stoploss, takeprofit,  position, comment="TEST TRADE"):
        order_type = TradeRequest.ORDER_TYPES[order]
        action_type = TradeRequest.TRADE_TYPES[order]
        self.request = {
            "action": action_type,
            "symbol": symbol,
            "type": order_type,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
            "magic": TradeRequest.MAGIC,
            "deviation": 1
        }

        if price != None:
            self.request["price"] = price
        if lot != None:
            self.request["volume"] = lot
        if stoploss != None:
            self.request["sl"] = stoploss
        if takeprofit != None:
            self.request["tp"] = takeprofit
        if stoploss != None:
            self.request["sl"] = stoploss
        if comment != None:
            self.request["comment"] = comment
        if position != None:
            self.request["position"] = position

    def get_type_market_buy():
        return 0

    def get_type_limit_buy():
        return 1

    def get_type_stop_buy():
        return 2

    def get_type_market_sell():
        return 3

    def get_type_limit_sell():
        return 4

    def get_type_stop_sell():
        return 5

    def get_type_close():
        return 6

    def get_request(self):
        return self.request
