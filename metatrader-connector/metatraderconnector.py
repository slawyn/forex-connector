''''''
import os
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import pandas as pd
from pandas.plotting import register_matplotlib_converters

import MetaTrader5 as mt5
import time
from pprint import pprint
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from PIL import Image, ImageDraw, ImageFont
from pydrive.drive import GoogleDrive
from pydrive.auth  import GoogleAuth

import json

def output(*s):
    print(s[0])


def generateChartForPosition(currentPosition):
    # Get the right amount of candles
    weekends = [5,6]

    def daterange(date1, date2):
        for n in range(int ((date2 - date1).days)+1):
            yield date1 + timedelta(n)

    daymsc = 86400000
    week = daymsc * 7
    month = week * 4
    hours4 = daymsc/6
    hours1 = daymsc/24
    minutes30 = daymsc/48
    minutes15 = daymsc/96
    minutes3 = hours1/20

    startingmsc = currentPosition.getFirstOpeningDeal().time
    endingmsc = currentPosition.getLastClosingDeal().time

    difference =   endingmsc - startingmsc
    keptoverweekend = 0

    # Count weekend days during trade
    for dt in daterange(datetime.fromtimestamp ((startingmsc/1000.0)), datetime.fromtimestamp ((endingmsc/1000.0))):
        if dt.weekday() in weekends:                    # to print only the weekdates
            keptoverweekend = keptoverweekend +1

    startingmsc = startingmsc - keptoverweekend/2*daymsc
    endingmsc = endingmsc + keptoverweekend/2*daymsc

    # update new starting and ending dates
    startDate = datetime.fromtimestamp ((startingmsc/1000.0))
    endDate = datetime.fromtimestamp ((endingmsc/1000.0))


   # Check if starting day is monday
    period = 0

    #orientation point: about 100 bars altogether per chart

    #months if more than 30 months
    if  difference >(month*30):
        period = mt5.TIMEFRAME_MN1
        fillup = (110-difference/month)*month

    # weeks if more than 30 weeks
    elif difference >(week*30):
        period = mt5.TIMEFRAME_W1
        fillup = (110-difference/week)*week

    # days if more than 30 days
    elif difference >(daymsc*30):
        period = mt5.TIMEFRAME_D1
        fillup = (110-difference/daymsc)*daymsc

    # hours4 if more than 30 hours4
    elif difference >(hours4*30):
        period = mt5.TIMEFRAME_H4
        fillup = (110-difference/hours4)*hours4

    elif difference >(hours1*30):
        period = mt5.TIMEFRAME_H1
        fillup = (110-difference/hours1)*hours1

    else:
        period = mt5.TIMEFRAME_M30
        fillup = (110-difference/minutes30)*minutes30



    '''
    elif difference >(hours1*30):
        period = mt5.TIMEFRAME_H1
        startingmsc = startingmsc - hours1*50
        endingmsc = endingmsc + hours1*10

    # 30mins if more than a half a day
    elif difference >(minutes30*30):
        period = mt5.TIMEFRAME_M30
        startingmsc = startingmsc - minutes30*50
        endingmsc = endingmsc + minutes30*10

    elif difference >(minutes15*30):
        period = mt5.TIMEFRAME_M15
        startingmsc = startingmsc - minutes15*50
        endingmsc = endingmsc + minutes15*10
    else:
        period = mt5.TIMEFRAME_M3
        startingmsc = startingmsc - minutes3*50
        endingmsc = endingmsc + minutes3*10
    '''

    if fillup<0:
       fillup = 0


    # Start of the week
    somedate = startDate-timedelta(days=startDate.weekday())
    somedate = somedate.replace( hour=0, minute=0, second=0, microsecond=0)

    # Go back in time and add weekends
    restfillup = fillup*0.9-(startDate.timestamp()-somedate.timestamp())*1000
    additionalweekends = 0
    while (restfillup>=0):
        output("log:%d %s Backward weekends expansion starting from %s"%(currentPosition.position, currentPosition.symbol,str(somedate)))
        additionalweekends = additionalweekends + 1
        restfillup  = restfillup - daymsc*7


    # if it further back than first monday
    startingmsc = startingmsc - (fillup*0.9+additionalweekends*2*daymsc)

    # Go forward in time and add weekends
    somedate = endDate+timedelta(4-endDate.weekday())
    somedate = somedate.replace( hour=23, minute=59, second=59, microsecond=999)

    restfillup = fillup*0.1-(somedate.timestamp()-endDate.timestamp())*1000
    additionalweekends = 0
    while (restfillup>=0):
        output("log:%d %s Forward weekends expansion starting from %s"%(currentPosition.position, currentPosition.symbol,str(somedate)))
        additionalweekends = additionalweekends + 1
        restfillup  = restfillup - daymsc*7

    # if it further back than first monday

    endingmsc = endingmsc + (fillup*0.1+additionalweekends*2*daymsc)

    # if the endingmsc is beyond current time, we set it to current time
    if endingmsc > int(round(time.time() * 1000)):
        endingmsc = int(round(time.time() * 1000))

    # Set dates for the price history
    startdate = datetime.fromtimestamp ((startingmsc/1000.0))
    enddate = datetime.fromtimestamp((endingmsc)/1000.0)

    rates = mt5.copy_rates_range(currentPosition.symbol, period, startdate, enddate)


    chart = DrawChart(rates, period, currentPosition)
    chart.drawChart()
    return chart




# Draw Chart
class DrawChart():
    SIZEY = 1080.0
    SIZEX = 1920.0
    OFFSET_Y_TOP = 20
    OFFSET_Y_BOTTOM = 100.0
    SPACE_BETWEEN_BARS = 8

    # Offset for prices scale
    OFFSET_X_PRICES = SIZEX-100

    # offset for chart
    CHART_EXTRA_OFFSET = 30
    CHART_AREA_X = OFFSET_X_PRICES
    CHART_OFFSET_BOTTOM = OFFSET_Y_BOTTOM+CHART_EXTRA_OFFSET


    CHART_AREA_Y = SIZEY-OFFSET_Y_TOP-CHART_OFFSET_BOTTOM-CHART_EXTRA_OFFSET

    COLOR_STOP_LOSS = (255,200,0)
    COLOR_TAKE_PROFIT = (0,200,255)
    COLOR_ARROW_SELL = (255,100,255)
    COLOR_ARROW_BUY = (0,200,255)
    COLOR_BACKGROUND = (0,10,30)
    COLOR_BAR_UP = (0,200,0)
    COLOR_BAR_DOWN = (255,0,0)
    COLOR_VOLUME = (100,100,100)
    COLOR_PRICES  = (255,255,255)

    def __init__(self, rates, period, positiondata):
        self.rates = rates
        self.period = period
        self.positionData = positiondata
        self.image = Image.new("RGB",(int(DrawChart.SIZEX),int(DrawChart.SIZEY)),color=DrawChart.COLOR_BACKGROUND)
        self.draw = ImageDraw.Draw(self.image)
        self.fontDate = ImageFont.truetype('arial.ttf',10)
        self.fontPrices = ImageFont.truetype('arial.ttf',12)
        self.fontPeriod = ImageFont.truetype('arial.ttf', 40)
        self.candleWidth = 1
        self.candleScaleFactor = 1
        self.volumeScaleFactor = 1
        self.chartdir = os.path.abspath("trades")
        self.chartname = "%s.png"%str(positiondata.position)

    def drawPrices(self,maxprice, minprice):
        self.draw.rectangle([(DrawChart.OFFSET_X_PRICES+10,DrawChart.OFFSET_Y_TOP),(DrawChart.SIZEX, DrawChart.SIZEY - DrawChart.OFFSET_Y_BOTTOM + DrawChart.OFFSET_Y_TOP)], fill=None, outline=DrawChart.COLOR_PRICES,width=2)

        precision = 20
        # 10 steps
        step = (maxprice-minprice)/precision
        offsetstep = (DrawChart.CHART_AREA_Y)/precision
        for i in range(precision+1):
            price = "%2.5f"%(maxprice-i*step)
            self.draw.text((DrawChart.OFFSET_X_PRICES+20, (DrawChart.OFFSET_Y_TOP+DrawChart.CHART_EXTRA_OFFSET)+i*offsetstep), price, font=self.fontPrices, fill=DrawChart.COLOR_PRICES)


    def drawTradeArrowUp(self, posx, posy):
        point0 = (posx+self.barWidth/2,posy+0)  # Center
        point1 = (posx-self.barWidth/2, posy+self.barWidth)   # Left
        point2 = (posx+self.barWidth*3/2,posy+self.barWidth)   # Right
        self.draw.polygon([point0, point1, point2], fill = DrawChart.COLOR_ARROW_BUY)
        self.draw.rectangle([posx+self.barWidth/4,posy+self.barWidth,posx+self.barWidth*3/4,posy+self.barWidth*2],fill=DrawChart.COLOR_ARROW_BUY)

    def drawTradeArrowDown(self, posx, posy):
        point0 = (posx+self.barWidth/2,posy+0)  # Center
        point1 = (posx-self.barWidth/2, posy-self.barWidth)   # Left
        point2 = (posx+self.barWidth*3/2,posy-self.barWidth)   # Right
        self.draw.polygon([point0, point1, point2], fill = DrawChart.COLOR_ARROW_SELL)
        self.draw.rectangle([posx+self.barWidth/4,posy-self.barWidth,posx+self.barWidth*3/4,posy-self.barWidth*2],fill=DrawChart.COLOR_ARROW_SELL)


    def drawTrade(self, maxprice,minprice):

        sl = self.positionData.stopLoss
        tp = self.positionData.takeProfit

        # find deals on chart
        maxlength = len(self.rates)
        deals = self.positionData.openingDeals + self.positionData.closingDeals

        for opendeal in deals:
            date = opendeal.time/1000
            idx = 0

            # find the date
            while idx<maxlength and date>=self.rates[idx][0]:
                idx = idx +1

            posx = DrawChart.SPACE_BETWEEN_BARS + (self.barWidth + DrawChart.SPACE_BETWEEN_BARS)*(idx-1)
            posy = self.calculateCandleImageYCoordinate(opendeal.price-minprice)

            # Draw arrows
            if opendeal.direction == 0:  #BUY
                self.drawTradeArrowUp(posx,posy)
            elif opendeal.direction == 1:#SELL
                self.drawTradeArrowDown(posx,posy)
            else:
                output("log:Unknown type of deal %d"%opendeal.direction)
                while True:
                    pass


        # Check if sl on chart
        if sl>0.0 and maxprice>= sl and sl>= minprice:
            slpos = self.calculateCandleImageYCoordinate(sl - minprice)
            self.draw.line([(0, slpos), (DrawChart.OFFSET_X_PRICES, slpos)], fill=DrawChart.COLOR_STOP_LOSS)
        self.draw.text((10,60),"Stop-Loss:"+str(sl),font=self.fontPrices,fill=DrawChart.COLOR_STOP_LOSS)

        # Check if tp is on chart
        if tp>0.0 and maxprice>=tp and tp>=minprice:
            tppos = self.calculateCandleImageYCoordinate(tp - minprice)
            self.draw.line([(0, tppos), (DrawChart.OFFSET_X_PRICES, tppos)], fill=DrawChart.COLOR_TAKE_PROFIT)
        self.draw.text((10,80),"Take-Profit:"+str(tp),font=self.fontPrices,fill=DrawChart.COLOR_TAKE_PROFIT)


    def timeframeSeparators(self, timeframe):
        if timeframe == mt5.TIMEFRAME_M3:
            return 20
        elif timeframe == mt5.TIMEFRAME_M15:
            return 94
        elif timeframe == mt5.TIMEFRAME_M30:
            return 48
        elif timeframe == mt5.TIMEFRAME_H1:
            return 24
        elif timeframe == mt5.TIMEFRAME_H4:
            return 6
        elif timeframe == mt5.TIMEFRAME_D1:
            return 7
        elif timeframe == mt5.TIMEFRAME_W1:
            return 4


    def timeframePeriodText(self, timeframe):
        if timeframe == mt5.TIMEFRAME_M3:
            return "M3"
        elif timeframe == mt5.TIMEFRAME_M15:
            return "M15"
        elif timeframe == mt5.TIMEFRAME_M30:
            return "M30"
        elif timeframe == mt5.TIMEFRAME_H1:
            return "H1"
        elif timeframe == mt5.TIMEFRAME_H4:
            return "H4"
        elif timeframe == mt5.TIMEFRAME_D1:
            return "D1"
        elif timeframe == mt5.TIMEFRAME_W1:
            return "W1"

    def drawFrame(self):
        #draw.rectangle([(0,SIZEY-offsetYbottom),(SIZEX,SIZEY)], fill=entryColor, outline=None,width=1) # debug rectangles
        self.draw.rectangle([(0,0),(DrawChart.SIZEX,DrawChart.OFFSET_Y_TOP)], fill=None, outline=DrawChart.COLOR_PRICES,width=2)
        self.draw.text((10,20), self.timeframePeriodText(self.period), font=self.fontPeriod, fill=DrawChart.COLOR_PRICES)
        self.draw.text((100,20),self.positionData.symbol,font=self.fontPeriod,fill=DrawChart.COLOR_PRICES)
        self.draw.text((500,20),str(len(self.rates))+" bars",font=self.fontPeriod,fill=DrawChart.COLOR_PRICES)


    def drawVolume(self, idx, volume, color):
        posx = DrawChart.SPACE_BETWEEN_BARS + (self.barWidth + DrawChart.SPACE_BETWEEN_BARS)*(idx)
        self.draw.rectangle([posx,volume,posx+self.barWidth,DrawChart.SIZEY],fill=color,outline=None,width=1)


    def drawCandle(self, idx, close,open, high,low, color):
        posx = DrawChart.SPACE_BETWEEN_BARS + (self.barWidth + DrawChart.SPACE_BETWEEN_BARS)*(idx)
        self.draw.rectangle([posx, close, posx + self.barWidth,open], fill=color, outline=None,width=1)
        self.draw.line([(posx+self.barWidth/2, high), (posx+self.barWidth/2, low)], fill=color)


    def calculateCandleImageYCoordinate(self, posy):
        mappedy = DrawChart.SIZEY-((posy*self.candleScalefactor)+DrawChart.CHART_OFFSET_BOTTOM)
        return mappedy

    def calculateVolumeImageYCoordinate(self, posy):
        mappedy = DrawChart.SIZEY-((posy*self.volumeScaleFactor))
        return mappedy

    def drawChart(self):

        period = self.period
        rates = self.rates

        # Find highest and lowest
        candleMaxHighValue = 0
        candleMinLowValue = 0xFFFFFFFF
        volumeMaxValue = 0
        volumeMinValue = 0xFFFFFFFF

        # time-0 open-1 high-2 low-3 close-4 tickvolume-5 spread-6 realvolume-7
        for rate in rates:
            if rate[2]>candleMaxHighValue:
                candleMaxHighValue = rate[2]

            if rate[3]<candleMinLowValue:
                candleMinLowValue = rate[3]

            if rate[5]>volumeMaxValue:
                volumeMaxValue = rate[5]

            if rate[5]<volumeMinValue:
                volumeMinValue = rate[5]


        numberOfCandles = len(rates)
        self.barWidth = (DrawChart.CHART_AREA_X - DrawChart.SPACE_BETWEEN_BARS*numberOfCandles)/numberOfCandles
        self.candleScalefactor = (DrawChart.CHART_AREA_Y)/(candleMaxHighValue-candleMinLowValue)


        if self.barWidth<DrawChart.SPACE_BETWEEN_BARS:
            output("log:Error: Timeframe is too big for the PERIOD. Try selecting another period or a smaller timeframe.")
            while True:
                pass

        self.volumeScaleFactor = (DrawChart.OFFSET_Y_BOTTOM)/(volumeMaxValue)

        output("log:Candles:: Low: %f High: %f Scale: %f Max:%f Count:%d"%(candleMinLowValue,candleMaxHighValue,self.candleScaleFactor,(candleMaxHighValue-candleMinLowValue)*self.candleScaleFactor+DrawChart.OFFSET_Y_BOTTOM,numberOfCandles))
        output("log:Volumes:: Low: %f High: %f Candle Scale: %f Max:%f "%(volumeMinValue,volumeMaxValue,self.volumeScaleFactor,(volumeMaxValue-volumeMinValue)*self.volumeScaleFactor))


        separator = self.timeframeSeparators(period)

        # Draw candles and Volume
        baridx = 0
        idx = 0
        offsetx = DrawChart.SPACE_BETWEEN_BARS
        for rate in rates:
            open = self.calculateCandleImageYCoordinate(rate[1]-candleMinLowValue)
            close = self.calculateCandleImageYCoordinate(rate[4]-candleMinLowValue)
            high = self.calculateCandleImageYCoordinate(rate[2]-candleMinLowValue)
            low = self.calculateCandleImageYCoordinate(rate[3]-candleMinLowValue)
            volume = self.calculateVolumeImageYCoordinate(rate[5])
            timestamp = pd.to_datetime(rate[0], unit='s')


            # Draw separators and dates
            if baridx == 0:
                offsetx = DrawChart.SPACE_BETWEEN_BARS + (self.barWidth + DrawChart.SPACE_BETWEEN_BARS)*(idx)
                self.draw.text((offsetx+5,3),str(timestamp),font=self.fontDate,fill=DrawChart.COLOR_PRICES)
                self.draw.line([(offsetx, 0), (offsetx, DrawChart.SIZEY)], fill=DrawChart.COLOR_VOLUME)

            baridx = (baridx +1)%separator

            # Bull candle
            if close < open:
               self.drawCandle(idx, open, close, high, low, DrawChart.COLOR_BAR_UP)
            # Bear candle
            else:
               self.drawCandle(idx, open, close, high, low, DrawChart.COLOR_BAR_DOWN)

            # Draw Volume
            self.drawVolume(idx, volume, DrawChart.COLOR_VOLUME)
            idx = idx + 1


        # Draw Stop Loss and Take Profit
        self.drawTrade(candleMaxHighValue,candleMinLowValue)

        # Draw other data
        self.drawPrices(candleMaxHighValue, candleMinLowValue)
        self.drawFrame()
        self.image.save(os.path.join(self.chartdir,self.chartname))


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
        output("Position: #%s %s"%(self.position,self.symbol))
        output("\tStop Loss: %f" %self.stopLoss)
        output("\tTake Profit: %f"%self.takeProfit)
        output("\tAv. Open: %f"%self.priceOpenAverage)
        output("\tTl. Volume: %f"%self.volumeTotal)
        output("\tSwap: %f"%(self.swap))
        output("\tTl. Profit: %f"%self.profitTotal)
        for i in range(0,len(self.openingDeals)):
            deal = self.openingDeals[i]
            output("\t*Opening Deal:%s"%deal.order)
            output("\t\tTime:%s"%pd.to_datetime(deal.time, unit='ms'))
            output("\t\tPrice:%s"%deal.price)
            output("\t\tVolume:%s"%deal.volume)

        for i in range(0,len(self.closingDeals)):
            deal = self.closingDeals[i]
            output("\t*Closing Deal:%s"%deal.order)
            output("\t\tTime:%s"%deal.time)
            output("\t\tPrice:%s"%deal.price)
            output("\t\tVolume:%s"%deal.volume)
            output("\t\tProfit:%s"%deal.profit)


class DriveFileController:
    REQUEST_SCOPE = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
    def __init__(self, jsonconfig):


        try:
            with open(jsonconfig) as json_file:
                config = json.load(configfile)
                print(config)
                self.param_secretsfile = config["secretsfile"]
                self.param_images_folder_id = config["images_folder_id"]
                self.params_spreadsheet_name = config["spreadsheet_name"]
                self.params_worksheet_name = config["worksheet_name"]
        except:
            sys.exit(1)

        # use creds to create a client to interact with the Google Drive API
        creds = ServiceAccountCredentials.from_json_keyfile_name(self.param_secretsfile, DriveFileController.REQUEST_SCOPE)
        client = gspread.authorize(creds)
        spreadsheet = client.open(self.params_spreadsheet_name)        # Open spreadsheet


        # Used for managing images
        gauth = GoogleAuth()
        gauth.credentials = creds
        self.drive = GoogleDrive(gauth)

        # Inits
        self.worksheet = spreadsheet.worksheet(self.params_worksheet_name)
        self.freeRow = 0
        self.lastPosition = 0
        self.allValues = None

    def getImagesRequest(self):
        return "'%s' in parents and trashed=false"%self.param_images_folder_id

    def getAllUploadedImages(self):
        images = self.drive.ListFile({'q': self.getImagesRequest()}).GetList()
        imagesDic = {}
        for k in images:
            imagesDic[k["title"].split(".")[0]] = k["id"]
        return imagesDic

    def deleteAllUploadedFiles():
        request_template = "'root' in parents and trashed=false"
        file_list = drive.ListFile({'q': request_template}).GetList()
        for folder in file_list:
            print(folder['title'])
            file1 = drive.CreateFile({'id': folder["id"]})
            file1.Delete()

    # Extract and output all of the values
    def loadValuesFromSheet(self):
        self.allValues = self.worksheet.get_all_values()
        self.freeRow = len(self.allValues)
        self.header = self.allValues[0]
        #output(self.allValues)


    def updateInformation(self, positionarray):
        # Last position in the sheet
        self.loadValuesFromSheet()
        positionsUploaded = []

        self.worksheet.format("A1:Q1",{'textFormat':{'fontSize':10,'fontFamily':"Calibri","bold":True}})
        self.worksheet.format("B2:Q%d"%self.freeRow,{'textFormat':{'fontSize':10,'fontFamily':"Calibri"}})
        self.worksheet.format("A1:A%d"%self.freeRow,{'textFormat':{'fontSize':10,'fontFamily':"Calibri","bold":True}})


        #self.freeRow = 1
        if self.freeRow >1:
            positionsUploaded =list(map(lambda x: x[0],self.allValues))

        #output("log:Uploaded Positions:")
        #output(positionsUploaded)

        allImages = self.getAllUploadedImages()
        imagekeys = allImages.keys()

        # Update rows
        for positionData in positionarray:
            # Generate chart for position

            # if position is not in the already saved list
            position = positionData.position
            if str(position) not in positionsUploaded:

                self.freeRow = self.freeRow + 1
                entry = positionData.getDataForExcelRow()
                self.allValues.append(entry)
                self.worksheet.update('A%d:M%d'%(self.freeRow,self.freeRow), [entry])



        # upload images
        # only the ones that can be generated
        for positionData in positionarray:
            if positionData.exchange != 0:
                if str(positionData.position) not in imagekeys:
                    chart = generateChartForPosition(positionData)
                    output("log: Uploading %s"%chart.chartname)
                    file = self.drive.CreateFile({'title': chart.chartname,'parents':[{'id':self.param_images_folder_id}]})
                    file.SetContentFile(os.path.join(chart.chartdir, chart.chartname))
                    file.Upload()

                    # Add to the array
                    allImages[(str(positionData.position))] = file["id"]

                    # Change Permissions so anyone with the link can view it
                    permission = file.InsertPermission({
                        'type': 'anyone',
                        'value': 'anyone',
                        'role': 'reader'})

        #
        # Add Image links to the rows
        imagekeys = allImages.keys()
        output("log:Checking Chart links")
        links = self.worksheet.range('P1:P%d'%(self.freeRow))
        for i in range(1,self.freeRow):
            row = self.allValues[i]
            position = str(row[0])

            link = links[i].value

            # if there is no link
            if link == "":
                if position in allImages:
                    output("log: Inserting \"Hyperlink\" into P%d"%(i+1))
                    file = self.drive.CreateFile({'id': allImages[str(position)],'parents':[{'id':self.images_folder_id}]})
                    file.FetchMetadata(fetch_all=True)
                    link = file['alternateLink']

                    #if "www." not in link and "https://" in link:
                    #    link = link.replace("https://","https://www.")
                    value = '=HYPERLINK(\"%s\",\"<link>\")'%(link)
                    self.worksheet.update_acell('P%d'%(i+1),value)
                else:
                    output("log: Inserting \"none\" into P%d"%(i+1))
                    self.worksheet.update_acell('P%d'%(i+1),"none")




if __name__ == "__main__":

    # establish connection to the MetaTrader 5 terminal
    if not mt5.initialize():
        output("initialize() failed, error code =",mt5.last_error())
        quit()


    # get the number of orders in history
    from_date = datetime(2021,1,1)
    to_date = datetime.now()

    # get historyDeals for symbols whose names contain "GBP" within a specified interval
    historyDeals = mt5.history_deals_get(from_date, to_date)
    historyPositions = []

    # Get all Positions
    for deal in historyDeals:
        position = deal.position_id
        if deal.entry == 1 and (position not in historyPositions):
            historyPositions.append(position)

    donePositions = []
    if(len(historyPositions)):
        output("log:Number of positions:%d"%len(historyPositions))
        output("log:Finding all relevant deals")
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
                output("log:Symbol doesn't have \"rate data\". Could be a futures")
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

           # positionData.printData()

    else:
        output("No Positions have been found")

    DriveFileController = DriveFileController("config.txt")
    DriveFileController.updateInformation(donePositions)

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
output("1. order_send(): by {} {} lots at {} with deviation={} points".format(symbol,lot,price,deviation));
if result.retcode != mt5.TRADE_RETCODE_DONE:
    output("2. order_send failed, retcode={}".format(result.retcode))
    # request the result as a dictionary and display it element by element
    result_dict=result._asdict()
    for field in result_dict.keys():
        output("   {}={}".format(field,result_dict[field]))
        # if this is a trading request structure, display it element by element as well
        if field=="request":
            traderequest_dict=result_dict[field]._asdict()
            for tradereq_filed in traderequest_dict:
                output("       traderequest: {}={}".format(tradereq_filed,traderequest_dict[tradereq_filed]))
    output("shutdown() and quit")
    mt5.shutdown()
    quit()

output("2. order_send done, ", result)
output("   opened position with POSITION_TICKET={}".format(result.order))
output("   sleep 2 seconds before closing position #{}".format(result.order))
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
output("3. close position #{}: sell {} {} lots at {} with deviation={} points".format(position_id,symbol,lot,price,deviation));
if result.retcode != mt5.TRADE_RETCODE_DONE:
    output("4. order_send failed, retcode={}".format(result.retcode))
    output("   result",result)
else:
    output("4. position #{} closed, {}".format(position_id,result))
    # request the result as a dictionary and display it element by element
    result_dict=result._asdict()
    for field in result_dict.keys():
        output("   {}={}".format(field,result_dict[field]))
        # if this is a trading request structure, display it element by element as well
        if field=="request":
            traderequest_dict=result_dict[field]._asdict()
            for tradereq_filed in traderequest_dict:
                output("       traderequest: {}={}".format(tradereq_filed,traderequest_dict[tradereq_filed]))
'''
# shut down connection to the MetaTrader 5 terminal
#mt5.shutdown()
