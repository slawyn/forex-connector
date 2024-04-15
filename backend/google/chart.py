
from PIL import Image, ImageDraw, ImageFont
from trader.rate import Rate
from helpers import *

# Draw Chart

def create_point(basex, basey, offsetx, offsety, percentage=1.0):
    return (basex+offsetx*percentage, basey+offsety*percentage)

class Chart():
    CHART_SIZEY = 1080
    CHART_SIZEX = 1920

    # Offset for chart
    CHART_OFFSET_EXTRA = 30
    CHART_OFFSET_PRICESX = CHART_SIZEX-100
    CHART_OFFSET_TOPY = 20
    CHART_OFFSET_BOTTOMY = 100
    CHART_OFFSET_BOTTOM = CHART_OFFSET_BOTTOMY + CHART_OFFSET_EXTRA

    CHART_AREA_X = CHART_OFFSET_PRICESX
    CHART_AREA_Y = CHART_SIZEY - CHART_OFFSET_TOPY - CHART_OFFSET_BOTTOM - CHART_OFFSET_EXTRA

    SPACE_BETWEEN_BARS = 8

    COLOR_STOP_LOSS = (255, 200, 0)
    COLOR_TAKE_PROFIT = (0, 200, 255)
    COLOR_ARROW_SELL = (255, 100, 255)
    COLOR_ARROW_BUY = (0, 200, 255)
    COLOR_BACKGROUND = (0, 10, 30)
    COLOR_BAR_UP = (0, 200, 0)
    COLOR_BAR_DOWN = (255, 0, 0)
    COLOR_VOLUME = (100, 100, 100)
    COLOR_PRICES = (255, 255, 255)

    TIMEFRAME_SEPARATORS = {"M1": 60, "M2": 30, "M3": 20, "M4": 15, "M5": 12, "M6": 10, "M10": 6, "M12": 5,
                            "M15": 94, "M20": 9, "M30": 48, "H1": 24, "H2": 12, "H3": 8, "H4": 6, "H6": 7, "H8": 9, "H12": 6, "D1": 7, "W1": 4}

    def __init__(self):
        # Handles
        self.image = Image.new("RGB", (Chart.CHART_SIZEX, Chart.CHART_SIZEY), color=Chart.COLOR_BACKGROUND)
        self.draw = ImageDraw.Draw(self.image)

        # Font
        self.font_date = ImageFont.truetype('arial.ttf', 8)
        self.font_prices = ImageFont.truetype('arial.ttf', 12)
        self.font_period = ImageFont.truetype('arial.ttf', 40)

        # Variables
        self.bar_width = 1
        self.bar_scale = 1
        self.volume_scale = 1

    def draw_prices(self, maxprice, minprice):
        self.draw.rectangle([(Chart.CHART_OFFSET_PRICESX+10, Chart.CHART_OFFSET_TOPY), (Chart.CHART_SIZEX, Chart.CHART_SIZEY -
                            Chart.CHART_OFFSET_BOTTOMY + Chart.CHART_OFFSET_TOPY)], fill=None, outline=Chart.COLOR_PRICES, width=2)
        precision = 20

        # 10 steps
        step = (maxprice-minprice)/precision
        offsetstep = (Chart.CHART_AREA_Y)/precision
        for i in range(precision+1):
            price = "%2.5f" % (maxprice-i*step)
            self.draw.text((Chart.CHART_OFFSET_PRICESX + 20, (Chart.CHART_OFFSET_TOPY+Chart.CHART_OFFSET_EXTRA)+i*offsetstep), price, font=self.font_prices, fill=Chart.COLOR_PRICES)


    def draw_arrow_up(self, posx, posy):
        point0 = (posx+self.bar_width/2,    posy+0)                 # Center
        point1 = (posx-self.bar_width/2,    posy+self.bar_width)    # Left
        point2 = (posx+self.bar_width*3/2,  posy+self.bar_width)    # Right

        self.draw.polygon([point0, point1, point2], fill=Chart.COLOR_ARROW_BUY)
        self.draw.rectangle([posx+self.bar_width/4, posy+self.bar_width, posx+self.bar_width*3/4, posy+self.bar_width*2], fill=Chart.COLOR_ARROW_BUY)

    def draw_arrow_down(self, posx, posy):

        # Center, Left, Right
        point0 = create_point(posx, posy, self.bar_width/2, 0)
        point1 = create_point(posx, posy, -self.bar_width/2, -self.bar_width)
        point2 = create_point(posx, posy, self.bar_width*3/2, -self.bar_width)
        self.draw.polygon([point0, point1, point2], fill=Chart.COLOR_ARROW_SELL)
        self.draw.rectangle([posx+self.bar_width/4, posy-self.bar_width, posx+self.bar_width*3/4, posy-self.bar_width*2], fill=Chart.COLOR_ARROW_SELL)

    def draw_trade(self, sl, tp, rates, deals, maxprice, minprice):

        # find deals on chart
        maxlength = len(rates)
        for deal in deals:
            date = deal[1]
            idx = 0

            # find the date
            while idx < maxlength and date >= rates[idx].time:
                idx = idx + 1

            posx = Chart.SPACE_BETWEEN_BARS + (self.bar_width + Chart.SPACE_BETWEEN_BARS)*(idx-1)
            posy = self.calculate_bar_y_coordinate(deal[2] - minprice)

            # Draw arrows
            if deal[0] == 'BUY':  # BUY
                self.draw_arrow_up(posx, posy)
            elif deal[0] == 'SELL':  # SELL
                self.draw_arrow_down(posx, posy)
            else:
                raise ValueError("Unknown type of deal %d" % deal[0])

        # Check if sl on chart
        if sl > 0.0 and maxprice >= sl and sl >= minprice:
            sl_pos = self.calculate_bar_y_coordinate(sl - minprice)
            self.draw.line([(0, sl_pos), (Chart.CHART_OFFSET_PRICESX, sl_pos)], fill=Chart.COLOR_STOP_LOSS)
        self.draw.text((10, 60), "Stop-Loss: %f" % sl, font=self.font_prices, fill=Chart.COLOR_STOP_LOSS)

        # Check if tp is on chart
        if tp > 0.0 and maxprice >= tp and tp >= minprice:
            tp_pos = self.calculate_bar_y_coordinate(tp - minprice)
            self.draw.line([(0, tp_pos), (Chart.CHART_OFFSET_PRICESX, tp_pos)], fill=Chart.COLOR_TAKE_PROFIT)
        self.draw.text((10, 80), "Take-Profit: %f" % tp, font=self.font_prices, fill=Chart.COLOR_TAKE_PROFIT)

    def draw_frame(self, symbol, barcount, period):

        # draw.rectangle([(0,CHART_SIZEY-offsetYbottom),(CHART_SIZEX,CHART_SIZEY)], fill=entryColor, outline=None,width=1) # debug rectangles
        self.draw.rectangle([(0, 0), (Chart.CHART_SIZEX, Chart.CHART_OFFSET_TOPY)], fill=None, outline=Chart.COLOR_PRICES, width=2)
        self.draw.text((10, 20),  period, font=self.font_period, fill=Chart.COLOR_PRICES)
        self.draw.text((100, 20), symbol, font=self.font_period, fill=Chart.COLOR_PRICES)
        self.draw.text((500, 20), "%d Bars" % barcount, font=self.font_period, fill=Chart.COLOR_PRICES)

    def draw_volume(self, idx, volume, color):
        posx = Chart.SPACE_BETWEEN_BARS + (self.bar_width + Chart.SPACE_BETWEEN_BARS)*(idx)
        self.draw.rectangle([posx, volume, posx+self.bar_width, Chart.CHART_SIZEY], fill=color, outline=None, width=1)

    def draw_bar(self, idx, close, open, high, low, color):
        posx = Chart.SPACE_BETWEEN_BARS + (self.bar_width + Chart.SPACE_BETWEEN_BARS)*(idx)
        self.draw.rectangle([posx, close, posx + self.bar_width, open], fill=color, outline=None, width=1)
        self.draw.line([(posx+self.bar_width/2, high), (posx+self.bar_width/2, low)], fill=color)

    def calculate_bar_y_coordinate(self, posy):
        mappedy = Chart.CHART_SIZEY-((posy*self.bar_scale)+Chart.CHART_OFFSET_BOTTOM)
        return mappedy

    def calculate_volume_y_coordinate(self, posy):
        mappedy = Chart.CHART_SIZEY-((posy*self.volume_scale))
        return mappedy

    def get_name(id):
        return "%s.png" % id
    
    def generate_chart(self, chartpath, id, data, limits, symbol, deals):
        chartname = Chart.get_name(id)

        rates, period = data[0], data[1]
        sl, tp = limits[0], limits[1]
        bar_count = len(rates)
        if bar_count > 0:
            price_max, price_min, volume_max, volume_min = Rate.get_min_max(rates)

            self.bar_width = (Chart.CHART_AREA_X - Chart.SPACE_BETWEEN_BARS*bar_count)/(bar_count)
            self.bar_scale = (Chart.CHART_AREA_Y)/(price_max-price_min)
            self.volume_scale = (Chart.CHART_OFFSET_BOTTOMY)/(volume_max)

            log("%s [%s]" % (symbol, chartname))
            if self.bar_width < Chart.SPACE_BETWEEN_BARS:
                log("log:Error: Timeframe is too big for the PERIOD[%s] SYMBOL[%s] BARS[%d]. Try selecting another period or a bigger timeframe" % (period, symbol, bar_count))

            log("bars:: Low: %f High: %f Scale: %f Max:%f Count:%d" % (price_min, price_max, self.bar_scale, (price_max-price_min)*self.bar_scale+Chart.CHART_OFFSET_BOTTOMY, bar_count))
            log("Volumes:: Low: %f High: %f bar Scale: %f Max:%f " % (volume_min, volume_max, self.volume_scale, (volume_max-volume_min)*self.volume_scale))
            separator = Chart.TIMEFRAME_SEPARATORS[period]

            # Draw bars and Volume
            baridx = 0
            idx = 0
            offsetx = Chart.SPACE_BETWEEN_BARS
            for rate in rates:
                open = self.calculate_bar_y_coordinate(rate.open-price_min)
                close = self.calculate_bar_y_coordinate(rate.close-price_min)
                high = self.calculate_bar_y_coordinate(rate.high-price_min)
                low = self.calculate_bar_y_coordinate(rate.low-price_min)
                volume = self.calculate_volume_y_coordinate(rate.volume)
                timestamp = pd.to_datetime(rate.time, unit='s')

                # Draw separators and dates
                if baridx == 0:
                    offsetx = Chart.SPACE_BETWEEN_BARS + (self.bar_width + Chart.SPACE_BETWEEN_BARS)*(idx)
                    self.draw.text((offsetx+5, 3), str(timestamp), font=self.font_date, fill=Chart.COLOR_PRICES)
                    self.draw.line([(offsetx, 0), (offsetx, Chart.CHART_SIZEY)], fill=Chart.COLOR_VOLUME)

                baridx = (baridx + 1) % separator

                # Bull bar
                if close < open:
                    self.draw_bar(idx, open, close, high, low, Chart.COLOR_BAR_UP)
                # Bear bar
                else:
                    self.draw_bar(idx, open, close, high, low, Chart.COLOR_BAR_DOWN)

                # Draw Volume
                self.draw_volume(idx, volume, Chart.COLOR_VOLUME)
                idx = idx + 1

            # Draw Stop Loss and Take Profit
            self.draw_trade(sl, tp, rates, deals, price_max, price_min)

            # Draw other data
            self.draw_prices(price_max, price_min)

            # Draw frame
            self.draw_frame(symbol, bar_count, period)

        # Save
        self.image.save(chartpath)
