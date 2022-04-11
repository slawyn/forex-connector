from helpers import *

import datetime
from datetime import datetime, timedelta, date
import time


class DealData:
    def __init__(self):
        self.order = "0"
        self.volume = 0.0
        self.price  = 0.0
        self.time   = 0
        self.profit = 0
        self.swap   = 0
        self.direction = 0

class PositionData:
    def __init__(self):
        self.position = "0"
        self.exchange = 0
        self.type = ""
        self.volumeTotal = 0.0
        self.priceOpenAverage = 0.0
        self.priceCloseAverage = 0.0
        self.stopLoss = 0.0
        self.takeProfit = 0.0
        self.stopPips = 0.0
        self.takePips = 0.0
        self.pointDigits = 0.0
        self.profitTotal = 0.0
        self.symbol = ""
        self.swap = 0.0
        self.openingDeals = []
        self.closingDeals = []
        self.openingDate = ""
        self.closingDate = ""


    def calculate(self):
        openingVolume = 0.0
        closingVolume = 0.0
        for i in range(0,len(self.openingDeals)):
            openingVolume = openingVolume + float(self.openingDeals[i].volume)
            self.priceOpenAverage = self.priceOpenAverage +  self.openingDeals[i].price*self.openingDeals[i].volume

        for i in range(0,len(self.closingDeals)):
            closingVolume = closingVolume + float(self.closingDeals[i].volume)
            self.priceCloseAverage = self.priceCloseAverage +  self.closingDeals[i].price*self.closingDeals[i].volume
            self.profitTotal = self.profitTotal + self.closingDeals[i].profit


        # Calculate Averages
        self.volumeTotal = openingVolume
        self.priceOpenAverage = self.priceOpenAverage/openingVolume
        self.priceCloseAverage = self.priceCloseAverage/closingVolume

        if self.openingDeals[0].direction == 0:
            self.type = "BUY"
        else:
            self.type = "SELL"

        if self.stopLoss != 0.0 and self.stopLoss>0.01:
            self.stopPips = abs((self.priceOpenAverage)-self.stopLoss)*self.pointDigits

        if self.takeProfit != 0.0 and self.takeProfit>0.01:
            self.takePips = abs(self.takeProfit-self.priceOpenAverage)*self.pointDigits

        # Check if the position is fully closed
        difference = openingVolume -closingVolume
        if difference<0.01 and difference>-0.01:
            self.openingDate = self.openingDeals[len(self.openingDeals)-1].time
            self.closingDate = self.closingDeals[len(self.closingDeals)-1].time
            return True
        else:
            return False

    def appendDeal(self, deal, type):
        self.swap = self.swap + deal.swap
        if type == 0:
            self.openingDeals.append(deal)
        else:
            self.closingDeals.append(deal)

    def getFirstOpeningDeal(self):
        return self.openingDeals[0]

    def getLastClosingDeal(self):
        return self.closingDeals[len(self.closingDeals)-1]


    # Create Data Set for Excel
    def getDataForExcelRow(self):
        lst = []
        lst.append(self.position)
        lst.append(datetime.fromtimestamp(self.openingDate/1000.0).strftime('%Y-%m-%d %H:%M'))
        lst.append(datetime.fromtimestamp(self.closingDate/1000.0).strftime('%Y-%m-%d %H:%M'))
        lst.append(self.symbol)
        lst.append(self.volumeTotal)
        lst.append(self.type)
        lst.append(self.priceOpenAverage)
        lst.append(self.priceCloseAverage)
        lst.append(self.swap)
        lst.append(self.stopPips)
        lst.append(self.takePips)
        lst.append(self.profitTotal)
        lst.append(self.exchange)
        #print(lst)
        return lst

    def printData(self):
        log("#%s[%s]"%(self.position,self.symbol))
        log("\tStop Loss: %f" %self.stopLoss)
        log("\tTake Profit: %f"%self.takeProfit)
        log("\tAverage Open: %f"%self.priceOpenAverage)
        log("\tTotal Volume: %f"%self.volumeTotal)
        log("\tSwap: %f"%(self.swap))
        log("\tTotal Profit: %f"%self.profitTotal)
        log("\tExchange: %f"%self.exchange)
        for i in range(0,len(self.openingDeals)):
            deal = self.openingDeals[i]
            log("\t*Opening Deal:%s"%deal.order)
            log("\t\tTime:%s"%pd.to_datetime(deal.time, unit='ms'))
            log("\t\tPrice:%s"%deal.price)
            log("\t\tVolume:%s"%deal.volume)

        for i in range(0,len(self.closingDeals)):
            deal = self.closingDeals[i]
            log("\t*Closing Deal:%s"%deal.order)
            log("\t\tTime:%s"%deal.time)
            log("\t\tPrice:%s"%deal.price)
            log("\t\tVolume:%s"%deal.volume)
            log("\t\tProfit:%s"%deal.profit)
