import MetaTrader5 as mt5


class TradeRequest:
    MAGIC = 234000

    def __init__(self, symbol, lot, order, price, stoplimit, stoploss, takeprofit,  position, pending, comment):
        order_type = order
        if pending:
            action_type = mt5.TRADE_ACTION_PENDING
        else:
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
        if stoplimit != None:
            self.request["stoplimit"] = stoplimit
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

    def get_request(self):
        return self.request
