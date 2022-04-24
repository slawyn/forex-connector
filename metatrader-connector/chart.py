
import os
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import MetaTrader5 as mt5

from helpers import *

# Draw Chart
class DrawChart():
    CHART_SIZEY = 1080
    CHART_SIZEX = 1920
    SPACE_BETWEEN_BARS = 8

    # Offset for chart
    CHART_OFFSET_EXTRA = 30
    CHART_OFFSET_PRICESX = CHART_SIZEX-100
    CHART_OFFSET_TOPY = 20
    CHART_OFFSET_BOTTOMY = 100
    CHART_OFFSET_BOTTOM = CHART_OFFSET_BOTTOMY + CHART_OFFSET_EXTRA

    CHART_AREA_X = CHART_OFFSET_PRICESX
    CHART_AREA_Y = CHART_SIZEY - CHART_OFFSET_TOPY - CHART_OFFSET_BOTTOM - CHART_OFFSET_EXTRA

    COLOR_STOP_LOSS = (255,200,0)
    COLOR_TAKE_PROFIT = (0,200,255)
    COLOR_ARROW_SELL = (255,100,255)
    COLOR_ARROW_BUY = (0,200,255)
    COLOR_BACKGROUND = (0,10,30)
    COLOR_BAR_UP = (0,200,0)
    COLOR_BAR_DOWN = (255,0,0)
    COLOR_VOLUME = (100,100,100)
    COLOR_PRICES  = (255,255,255)

    TIMEFRAME_SEPARATORS = {"M1":60, "M2":30, "M3":20,"M4":15, "M5":12,"M6":10,"M10":6,"M12":5,"M15":94, "M20":9, "M30":48, "H1":24,"H2":12, "H3":8, "H4":6,"H8":9, "H12":6,"D1":7, "W1":4 }
    def __init__(self, dir):
        self.chartdir = os.path.abspath(dir)
        self.image = Image.new("RGB", (DrawChart.CHART_SIZEX, DrawChart.CHART_SIZEY), color=DrawChart.COLOR_BACKGROUND)
        self.draw = ImageDraw.Draw(self.image)
        self.font_date = ImageFont.truetype('arial.ttf',8)
        self.font_prices = ImageFont.truetype('arial.ttf',12)
        self.font_period = ImageFont.truetype('arial.ttf', 40)
        self.candle_width = 1
        self.candle_scale = 1
        self.volume_scale = 1


    def draw_prices(self, maxprice, minprice):
        self.draw.rectangle([(DrawChart.CHART_OFFSET_PRICESX+10,DrawChart.CHART_OFFSET_TOPY),(DrawChart.CHART_SIZEX, DrawChart.CHART_SIZEY - DrawChart.CHART_OFFSET_BOTTOMY + DrawChart.CHART_OFFSET_TOPY)], fill=None, outline=DrawChart.COLOR_PRICES,width=2)
        precision = 20

        # 10 steps
        step = (maxprice-minprice)/precision
        offsetstep = (DrawChart.CHART_AREA_Y)/precision
        for i in range(precision+1):
            price = "%2.5f"%(maxprice-i*step)
            self.draw.text((DrawChart.CHART_OFFSET_PRICESX+20, (DrawChart.CHART_OFFSET_TOPY+DrawChart.CHART_OFFSET_EXTRA)+i*offsetstep), price, font=self.font_prices, fill=DrawChart.COLOR_PRICES)

    def draw_arrow_up(self, posx, posy):
        point0 = (posx+self.bar_width/2,posy+0)  # Center
        point1 = (posx-self.bar_width/2, posy+self.bar_width)   # Left
        point2 = (posx+self.bar_width*3/2,posy+self.bar_width)   # Right
        self.draw.polygon([point0, point1, point2], fill = DrawChart.COLOR_ARROW_BUY)
        self.draw.rectangle([posx+self.bar_width/4, posy+self.bar_width,posx+self.bar_width*3/4,posy+self.bar_width*2],fill=DrawChart.COLOR_ARROW_BUY)

    def draw_arrow_down(self, posx, posy):
        point0 = (posx+self.bar_width/2,posy+0)  # Center
        point1 = (posx-self.bar_width/2, posy-self.bar_width)   # Left
        point2 = (posx+self.bar_width*3/2,posy-self.bar_width)   # Right
        self.draw.polygon([point0, point1, point2], fill = DrawChart.COLOR_ARROW_SELL)
        self.draw.rectangle([posx+self.bar_width/4, posy-self.bar_width,posx+self.bar_width*3/4,posy-self.bar_width*2],fill=DrawChart.COLOR_ARROW_SELL)


    def draw_trade(self, sl, tp, rates, deals, maxprice, minprice):

        # find deals on chart
        maxlength = len(rates)

        for deal in deals:
            date = deal[1]
            idx = 0

            # find the date
            while idx<maxlength and date>=rates[idx][0]:
                idx = idx +1

            posx = DrawChart.SPACE_BETWEEN_BARS + (self.bar_width + DrawChart.SPACE_BETWEEN_BARS)*(idx-1)
            posy = self.calculate_candle_y_coordinate(deal[2]- minprice)

            # Draw arrows
            if deal[0] == 'B':  #BUY
                self.draw_arrow_up(posx,posy)
            elif deal[0] == 'S':#SELL
                self.draw_arrow_down(posx, posy)
            else:
                log("log:Unknown type of deal %d"%deal[0])
                while True:
                    pass


        # Check if sl on chart
        if sl>0.0 and maxprice>= sl and sl>= minprice:
            sl_pos = self.calculate_candle_y_coordinate(sl - minprice)
            self.draw.line([(0, sl_pos), (DrawChart.CHART_OFFSET_PRICESX, sl_pos)], fill=DrawChart.COLOR_STOP_LOSS)
        self.draw.text((10,60),"Stop-Loss:"+str(sl),font=self.font_prices,fill=DrawChart.COLOR_STOP_LOSS)

        # Check if tp is on chart
        if tp>0.0 and maxprice>=tp and tp>=minprice:
            tp_pos = self.calculate_candle_y_coordinate(tp - minprice)
            self.draw.line([(0, tp_pos), (DrawChart.CHART_OFFSET_PRICESX, tp_pos)], fill=DrawChart.COLOR_TAKE_PROFIT)
        self.draw.text((10,80),"Take-Profit:"+str(tp),font=self.font_prices,fill=DrawChart.COLOR_TAKE_PROFIT)

    def draw_frame(self, symbol, barcount, period):

        #draw.rectangle([(0,CHART_SIZEY-offsetYbottom),(CHART_SIZEX,CHART_SIZEY)], fill=entryColor, outline=None,width=1) # debug rectangles
        self.draw.rectangle([(0,0),(DrawChart.CHART_SIZEX, DrawChart.CHART_OFFSET_TOPY)], fill=None, outline=DrawChart.COLOR_PRICES,width=2)
        self.draw.text((10,20),  period, font=self.font_period, fill=DrawChart.COLOR_PRICES)
        self.draw.text((100,20), symbol,font=self.font_period,fill=DrawChart.COLOR_PRICES)
        self.draw.text((500,20), str(barcount)+" bars",font=self.font_period,fill=DrawChart.COLOR_PRICES)


    def draw_volume(self, idx, volume, color):
        posx = DrawChart.SPACE_BETWEEN_BARS + (self.bar_width + DrawChart.SPACE_BETWEEN_BARS)*(idx)
        self.draw.rectangle([posx,volume,posx+self.bar_width,DrawChart.CHART_SIZEY],fill=color,outline=None,width=1)


    def draw_candle(self, idx, close, open, high,low, color):
        posx = DrawChart.SPACE_BETWEEN_BARS + (self.bar_width + DrawChart.SPACE_BETWEEN_BARS)*(idx)
        self.draw.rectangle([posx, close, posx + self.bar_width,open], fill=color, outline=None,width=1)
        self.draw.line([(posx+self.bar_width/2, high), (posx+self.bar_width/2, low)], fill=color)


    def calculate_candle_y_coordinate(self, posy):
        mappedy = DrawChart.CHART_SIZEY-((posy*self.candle_scale)+DrawChart.CHART_OFFSET_BOTTOM)
        return mappedy

    def calculate_volume_y_coordinate(self, posy):
        mappedy = DrawChart.CHART_SIZEY-((posy*self.volume_scale))
        return mappedy

    def generate_chart(self, position):
        chartname = "%s.png"%position.get_id()
        rates, period = position.get_rates()
        sl, tp = position.get_limits()
        symbol = position.get_symbol_name()
        deals = position.get_deals()

        # Find highest and lowest
        candle_max_value = 0
        candle_min_value = 0xFFFFFFFF
        volume_max_value = 0
        volume_min_value = 0xFFFFFFFF

        # time-0 open-1 high-2 low-3 close-4 tickvolume-5 spread-6 realvolume-7
        for rate in rates:
            if rate[2]>candle_max_value:
                candle_max_value = rate[2]

            if rate[3]<candle_min_value:
                candle_min_value = rate[3]

            if rate[5]>volume_max_value:
                volume_max_value = rate[5]

            if rate[5]<volume_min_value:
                volume_min_value = rate[5]


        candle_count = len(rates)
        self.bar_width = (DrawChart.CHART_AREA_X - DrawChart.SPACE_BETWEEN_BARS*candle_count)/(candle_count+0)
        self.candle_scale = (DrawChart.CHART_AREA_Y)/(candle_max_value-candle_min_value)
        self.volume_scale = (DrawChart.CHART_OFFSET_BOTTOMY)/(volume_max_value)


        log("%s [%s]"%(symbol, chartname))
        if self.bar_width<DrawChart.SPACE_BETWEEN_BARS:
            log("log:Error: Timeframe is too big for the PERIOD[%s] SYMBOL[%s] BARS[%d]. Try selecting another period or a smaller timeframe"%(period, symbol, candle_count))

        log("log:Candles:: Low: %f High: %f Scale: %f Max:%f Count:%d"%(candle_min_value,candle_max_value,self.candle_scale,(candle_max_value-candle_min_value)*self.candle_scale+DrawChart.CHART_OFFSET_BOTTOMY,candle_count))
        log("log:Volumes:: Low: %f High: %f Candle Scale: %f Max:%f "%(volume_min_value,volume_max_value,self.volume_scale,(volume_max_value-volume_min_value)*self.volume_scale))
        separator = DrawChart.TIMEFRAME_SEPARATORS[period]


        # Draw candles and Volume
        baridx = 0
        idx = 0
        offsetx = DrawChart.SPACE_BETWEEN_BARS
        for rate in rates:
            open = self.calculate_candle_y_coordinate(rate[1]-candle_min_value)
            close = self.calculate_candle_y_coordinate(rate[4]-candle_min_value)
            high = self.calculate_candle_y_coordinate(rate[2]-candle_min_value)
            low = self.calculate_candle_y_coordinate(rate[3]-candle_min_value)
            volume = self.calculate_volume_y_coordinate(rate[5])
            timestamp = pd.to_datetime(rate[0], unit='s')


            # Draw separators and dates
            if baridx == 0:
                offsetx = DrawChart.SPACE_BETWEEN_BARS + (self.bar_width + DrawChart.SPACE_BETWEEN_BARS)*(idx)
                self.draw.text((offsetx+5,3),str(timestamp),font=self.font_date,fill=DrawChart.COLOR_PRICES)
                self.draw.line([(offsetx, 0), (offsetx, DrawChart.CHART_SIZEY)], fill=DrawChart.COLOR_VOLUME)

            baridx = (baridx +1)%separator

            # Bull candle
            if close < open:
               self.draw_candle(idx, open, close, high, low, DrawChart.COLOR_BAR_UP)
            # Bear candle
            else:
               self.draw_candle(idx, open, close, high, low, DrawChart.COLOR_BAR_DOWN)

            # Draw Volume
            self.draw_volume(idx, volume, DrawChart.COLOR_VOLUME)
            idx = idx + 1

        # Draw Stop Loss and Take Profit
        self.draw_trade(sl, tp, rates, deals, candle_max_value, candle_min_value)

        # Draw other data
        self.draw_prices(candle_max_value, candle_min_value)

        # Draw frame
        self.draw_frame(symbol, candle_count, period)
        self.image.save(os.path.join(self.chartdir, chartname))

        return chartname
