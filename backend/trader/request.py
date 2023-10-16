import MetaTrader5 as mt5


class TradeRequest:
    MAGIC = 234000
    COMMENT = "TEST TRADE"

    def __init__(self, symbol, lot, order, price, stoploss, takeprofit,  position, comment="TEST TRADE"):
        order_type = order
        action_type = mt5.TRADE_ACTION_DEAL
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
        return mt5.ORDER_TYPE_BUY

    def get_type_limit_buy():
        return mt5.ORDER_TYPE_BUY_LIMIT

    def get_type_stop_buy():
        return mt5.ORDER_TYPE_BUY_STOP

    def get_type_market_sell():
        return mt5.ORDER_TYPE_SELL

    def get_type_limit_sell():
        return mt5.ORDER_TYPE_SELL_LIMIT

    def get_type_stop_sell():
        return mt5.ORDER_TYPE_SELL_STOP

    def get_type_close():
        return mt5.ORDER_TYPE_CLOSE_BY

    def get_request(self):
        return self.request
