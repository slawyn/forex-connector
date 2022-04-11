
import os
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import MetaTrader5 as mt5


from helpers import *


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
    for dt in daterange(datetime.datetime.fromtimestamp ((startingmsc/1000.0)), datetime.datetime.fromtimestamp ((endingmsc/1000.0))):
        if dt.weekday() in weekends:                    # to print only the weekdates
            keptoverweekend = keptoverweekend +1

    startingmsc = startingmsc - keptoverweekend/2*daymsc
    endingmsc = endingmsc + keptoverweekend/2*daymsc

    # update new starting and ending dates
    startDate = datetime.datetime.fromtimestamp ((startingmsc/1000.0))
    endDate = datetime.datetime.fromtimestamp ((endingmsc/1000.0))


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

    if fillup < 0:
       fillup = 0


    # Start of the week
    somedate = startDate - timedelta(days=startDate.weekday())
    somedate = somedate.replace( hour=0, minute=0, second=0, microsecond=0)

    # Go back in time and add weekends
    restfillup = fillup*0.9-(startDate.timestamp()-somedate.timestamp())*1000
    additionalweekends = 0
    while (restfillup>=0):
        log("log:%d %s Backward weekends expansion starting from %s"%(currentPosition.position, currentPosition.symbol,str(somedate)))
        additionalweekends = additionalweekends + 1
        restfillup  = restfillup - daymsc*7


    # if it further back than first monday
    startingmsc = startingmsc - (fillup*0.9+additionalweekends*2*daymsc)

    # Go forward in time and add weekends
    somedate = endDate + timedelta(4-endDate.weekday())
    somedate = somedate.replace( hour=23, minute=59, second=59, microsecond=999)

    restfillup = fillup*0.1-(somedate.timestamp()-endDate.timestamp())*1000
    additionalweekends = 0
    while (restfillup>=0):
        log("log:%d %s Forward weekends expansion starting from %s"%(currentPosition.position, currentPosition.symbol,str(somedate)))
        additionalweekends = additionalweekends + 1
        restfillup  = restfillup - daymsc*7

    # if it further back than first monday

    endingmsc = endingmsc + (fillup*0.1+additionalweekends*2*daymsc)

    # if the endingmsc is beyond current time, we set it to current time
    if endingmsc > int(round(time.time() * 1000)):
        endingmsc = int(round(time.time() * 1000))

    # Set dates for the price history
    startdate = datetime.datetime.fromtimestamp ((startingmsc/1000.0))
    enddate = datetime.datetime.fromtimestamp((endingmsc)/1000.0)

    rates = mt5.copy_rates_range(currentPosition.symbol, period, startdate, enddate)
    return rates, period



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

    def __init__(self, positiondata):
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

        rates, period = generateChartForPosition(positiondata)
        self.rates = rates
        self.period = period
        self.positionData = positiondata


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
                log("log:Unknown type of deal %d"%opendeal.direction)
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
            log("log:Error: Timeframe is too big for the PERIOD. Try selecting another period or a smaller timeframe.")
            while True:
                pass

        self.volumeScaleFactor = (DrawChart.OFFSET_Y_BOTTOM)/(volumeMaxValue)

        log("log:Candles:: Low: %f High: %f Scale: %f Max:%f Count:%d"%(candleMinLowValue,candleMaxHighValue,self.candleScaleFactor,(candleMaxHighValue-candleMinLowValue)*self.candleScaleFactor+DrawChart.OFFSET_Y_BOTTOM,numberOfCandles))
        log("log:Volumes:: Low: %f High: %f Candle Scale: %f Max:%f "%(volumeMinValue,volumeMaxValue,self.volumeScaleFactor,(volumeMaxValue-volumeMinValue)*self.volumeScaleFactor))


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
