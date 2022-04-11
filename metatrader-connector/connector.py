''''''
from helpers import *
from driver import DriveFileController
from chart import DrawChart
from trade import PositionData, DealData

import sys
from datetime import datetime, timedelta

import MetaTrader5 as mt5
import time





class Trader:

    def __init__(self, configname):
        # 1. Establish connection to the MetaTrader 5 terminal
        if not mt5.initialize():
            raise ValueError("initialize() failed, error code =" + str(mt5.last_error()))

        self.config = loadConfig(configname)
        self.risk = 2
        self.balance = 500
        self.ratio = 1

        # Get Positions of closed deals and add them to excel sheet
        self.history_start = datetime(2021,1,1)
        self.drive_handle = None

    def createDriveHandle(self):
        self.drive_handle = DriveFileController(self.config["secretsfile"], self.config["folderid"], self.config["spreadsheet"], self.config["worksheet"])

    def updateBalance(self):
        self.balance = mt5.account_info().balance

    def getSymbols(self, wildcard):
        syms = mt5.symbols_get(group = wildcard)

        #for s in syms:
        #    log(s.name+":"+str(s))

        return syms


    def calculateStopLoss(self,  sym):

        loss_profit = self.balance*(self.risk/100)
        lot_min = sym.volume_min
        lot_step = sym.volume_step
        contractsforlot = sym.trade_contract_size
        print(contractsforlot)
        lots = lot_min
        # lots * contracts per lot * pricediff = loss_profit

        value_per_point = sym.trade_tick_value * sym.point/sym.trade_tick_size

        if sym.digits == 3:
            value_per_point/=100.0

        points = loss_profit/(contractsforlot * lots * value_per_point)

        buy_stoploss = sym.bid - points
        buy_takeprofit =  sym.bid + self.ratio * points
        sell_stoploss = sym.ask + points
        sell_takeprofit =  sym.ask - self.ratio * points


        log("%s:[A:%f B:%f] %s %s %s %s"%(s.name, sym.ask, sym.bid, str(buy_stoploss), str(buy_takeprofit),str(sell_stoploss), str(sell_takeprofit)))
        log("\tRisk: %f Diff: %f tickval=%f point=%f ticksize=%f"%(loss_profit,points,sym.trade_tick_value, sym.point, sym.trade_tick_size))
        return [buy_stoploss, buy_takeprofit, sell_stoploss,sell_takeprofit]

    def updateDrive(self, positions):
        self.drive_handle.updateInformation(positions)

    def getHistoryForPeriod(self):

        # get historyDeals for symbols whose names contain "GBP" within a specified interval
        historyDeals = mt5.history_deals_get(self.history_start, datetime.now())
        historyPositions = []

        # Get all Positions
        for deal in historyDeals:
            position = deal.position_id
            if deal.entry == 1 and (position not in historyPositions):
                historyPositions.append(position)

        donePositions = []
        if(len(historyPositions)):
            log("Number of positions:%d"%len(historyPositions))
            for p in historyPositions:
                historyDeals = mt5.history_deals_get(position=p)

                positionData = PositionData()
                positionData.position = p
                positionData.symbol = historyDeals[0].symbol

                # try to find the symbol
                # Caution, futures change names
                try:
                    symbilInfoDictionary = mt5.symbol_info( historyDeals[0].symbol)._asdict()

                    # Get exchange rate for one point
                    #print(symbilInfoDictionary)
                    positionData.exchange = symbilInfoDictionary["trade_tick_value"]
                    positionData.pointDigits = 1/symbilInfoDictionary["point"]
                except Exception as e:
                    log("Symbol doesn't have \"rate data\". Could be a futures")
                    positionData.exchange = 0


                # go through all the history deals for the position
                for i in range(0,len(historyDeals)):
                    dealData = DealData()
                    dealData.direction = historyDeals[i].type
                    dealData.order = historyDeals[i].order
                    dealData.time = historyDeals[i].time_msc
                    dealData.price = historyDeals[i].price
                    dealData.volume = historyDeals[i].volume
                    dealData.swap = historyDeals[i].swap
                    dealData.profit = historyDeals[i].profit
                    positionData.appendDeal(dealData, historyDeals[i].entry)


                # Check if stop loss has been set, if not set it to a value by parsing other orders regarding this position
                # Problem some data doesn't have stop loss or take profit data in the database, although it is set in metatrader. Don't know why
                allOrders =  mt5.history_orders_get(position = p)
                for order in allOrders:
                     if positionData.stopLoss == 0.0:
                        positionData.stopLoss = order.sl

                     if positionData.takeProfit == 0.0:
                        positionData.takeProfit = order.tp

                # Calculate everything needed for excel
                if positionData.calculate():
                    donePositions.append(positionData)

                positionData.printData()
        else:
            log("No positions have been found")

        return donePositions


if __name__ == "__main__":
    config_name = "config/config.txt"

    # Initialize mt5 and google drive controller
    trader = None
    try:
        trader = Trader(config_name)
        trader.createDriveHandle()
        #trader.updateBalance()

    except Exception as e:
        log(e)
        sys.exit(1)

    syms = trader.getSymbols("EURUSD,*USDJPY*,GOLD,SILVER,*NDAQ*,USDHUF")


    for s in syms:
        out = trader.calculateStopLoss(s)






'''
lot = 0.01
point = mt5.symbol_info(symbol).point
price = mt5.symbol_info_tick(symbol).ask
deviation = 20
request = {
    "action": mt5.TRADE_ACTION_DEAL,
    "symbol": symbol,
    "volume": lot,
    "type": mt5.ORDER_TYPE_BUY,
    "price": price,
    "sl": price - 100 * point,
    "tp": price + 100 * point,
    "deviation": deviation,
    "magic": 234000,
    "comment": "python script open",
    "type_time": mt5.ORDER_TIME_GTC,
    "type_filling": mt5.ORDER_FILLING_IOC,
}


# send a trading request
result = mt5.order_send(request)
# check the execution result
log("1. order_send(): by {} {} lots at {} with deviation={} points".format(symbol,lot,price,deviation));
if result.retcode != mt5.TRADE_RETCODE_DONE:
    log("2. order_send failed, retcode={}".format(result.retcode))
    # request the result as a dictionary and display it element by element
    result_dict=result._asdict()
    for field in result_dict.keys():
        log("   {}={}".format(field,result_dict[field]))
        # if this is a trading request structure, display it element by element as well
        if field=="request":
            traderequest_dict=result_dict[field]._asdict()
            for tradereq_filed in traderequest_dict:
                log("       traderequest: {}={}".format(tradereq_filed,traderequest_dict[tradereq_filed]))
    log("shutdown() and quit")
    mt5.shutdown()
    quit()

log("2. order_send done, ", result)
log("   opened position with POSITION_TICKET={}".format(result.order))
log("   sleep 2 seconds before closing position #{}".format(result.order))
time.sleep(2)
# create a close request
position_id=result.order
price=mt5.symbol_info_tick(symbol).bid
deviation=20
request={
    "action": mt5.TRADE_ACTION_DEAL,
    "symbol": symbol,
    "volume": lot,
    "type": mt5.ORDER_TYPE_SELL,
    "position": position_id,
    "price": price,
    "deviation": deviation,
    "magic": 234000,
    "comment": "python script close",
    "type_time": mt5.ORDER_TIME_GTC,
    "type_filling": mt5.ORDER_FILLING_RETURN,
}
# send a trading request
result=mt5.order_send(request)
# check the execution result
log("3. close position #{}: sell {} {} lots at {} with deviation={} points".format(position_id,symbol,lot,price,deviation));
if result.retcode != mt5.TRADE_RETCODE_DONE:
    log("4. order_send failed, retcode={}".format(result.retcode))
    log("   result",result)
else:
    log("4. position #{} closed, {}".format(position_id,result))
    # request the result as a dictionary and display it element by element
    result_dict=result._asdict()
    for field in result_dict.keys():
        log("   {}={}".format(field,result_dict[field]))
        # if this is a trading request structure, display it element by element as well
        if field=="request":
            traderequest_dict=result_dict[field]._asdict()
            for tradereq_filed in traderequest_dict:
                log("       traderequest: {}={}".format(tradereq_filed,traderequest_dict[tradereq_filed]))
'''
# shut down connection to the MetaTrader 5 terminal
#mt5.shutdown()
