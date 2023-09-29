import datetime

from helpers import log


class OpenPosition:
    HEADER = ["ID",
              "SYMBOL",
              "TIME",
              "TYPE",
              "MAGIC",
              "IDENTIFIER",
              "REASON",
              "COMMENT",
              "PROFIT",
              "OPEN",
              "SL",
              "TP",
              "PRICE",
              "SWAP",
              "VOLUME"
              ]

    def __init__(self, pos):
        self.id = pos.ticket
        self.time = datetime.datetime.fromtimestamp(pos.time).strftime('%Y-%m-%d %H:%M')
        self.type = pos.type
        self.magic = pos.magic
        self.identifier = pos.identifier
        self.reason = pos.reason
        self.comment = pos.comment
        self.symbol = pos.symbol
        self.profit = pos.profit
        self.volume = pos.volume
        self.update(pos)

        self.updated = True

    def update(self, pos):
        self.updated = pos.profit != self.profit
        self.profit = pos.profit
        self.price_open = pos.price_open
        self.price_sl = pos.sl
        self.price_tp = pos.tp
        self.price_current = pos.price_current
        self.swap = pos.swap

    def get_json(self):
        data = {
            "id": self.id,
            "time": self.time,
            "type": self.type,
            "magic": self.magic,
            "identifier": self.identifier,
            "reason": self.reason,
            "comment": self.comment,
            "symbol": self.symbol,
            "profit": self.profit,
            "price_open": self.price_open,
            "price_sl": self.price_sl,
            "price_tp": self.price_tp,
            "price": self.price_current,
            "swap": self.swap,
            "volume": self.volume
        }
        return data

    def get_info_header():
        return OpenPosition.HEADER

    def get_info(self, types_map={}):
        data = []

        type = self.type
        if type in types_map:
            type = types_map[type]

        data.append(self.id)
        data.append(self.symbol)
        data.append(self.time)
        data.append(type)
        data.append(self.magic)
        data.append(self.identifier)
        data.append(self.reason)
        data.append(self.comment)
        data.append(self.profit)
        data.append(self.price_open)
        data.append(self.price_sl)
        data.append(self.price_tp)
        data.append(self.price_current)
        data.append(self.swap)
        data.append(self.volume)
        return data


class Position:
    DEAL_TYPES = {0: "BUY", 1: "SELL"}
    HEADER = ["ID",
              "SYMBOL",
              "VOLUME",
              "PROFIT",
              "TYPE",
              "COMMENT"
              ]

    def __init__(self, pos_id):
        self.id = pos_id

        # calculated vars
        self.volume_total = 0.0
        self.swap_total = 0.0
        self.profit_total = 0.0

        self.opening_volume = 0.0
        self.closing_volume = 0.0

        self.opening_deals = []
        self.closing_deals = []
        self.price_open_avg = 0.0
        self.price_close_avg = 0.0
        self.price_sl = 0.0
        self.price_tp = 0.0

        self.pips_sl = 0.0
        self.pips_tp = 0.0
        self.pips_movement = 0.0

        self.sell_or_buy = ""

        self.period = ""
        self.rates = []
        self.symbol = ""
        self.comment = ""

    def add_rates(self, rates, period):
        '''Rates and period
        '''
        self.period = period
        self.rates = rates

    def add_deal(self, deal):
        '''Add deal to position
        '''
        self.swap_total = self.swap_total + deal.swap
        self.profit_total = self.profit_total + deal.profit
        self.volume_total += deal.volume
        # IN or OUT

        if deal.entry == 0:
            self.opening_volume += deal.volume
            self.price_open_avg += deal.price * deal.volume
            self.opening_deals.append(deal)

        elif deal.entry == 1:
            self.closing_volume += deal.volume
            self.price_close_avg += deal.price * deal.volume
            self.closing_deals.append(deal)

        diff_volume = self.opening_volume - self.closing_volume

    def add_orders(self, orders):
        '''Add orders to position
        '''
        # Check if stop loss has been set, if not set it to a value by parsing other orders regarding this position
        # Problem some data doesn't have stop loss or take profit data in the database, although it is set in metatrader. Don't know why
        if orders != None:
            for order in orders:
                if order.sl > 0.0:
                    self.price_sl = order.sl

                if order.tp > 0.0:
                    self.price_tp = order.tp

    def set_symbol_info(self, sym):
        '''Add symbol info to position
        '''
        self.symbol_info = sym

    def get_symbol_name(self):
        '''Gets
        '''
        return self.opening_deals[0].symbol

    def get_id(self):
        return self.id

    def get_start_msc(self):
        return self.opening_deals[0].time_msc

    def get_end_msc(self):
        return self.closing_deals[len(self.closing_deals)-1].time_msc

    def get_rates(self):
        return self.rates, self.period

    def is_fully_closed(self):
        diff_volume = self.opening_volume - self.closing_volume
        return abs(diff_volume) < 0.01 and self.closing_volume > 0.0

    def get_limits(self):
        return self.price_sl, self.price_tp

    def get_deals(self):
        def filter(d):
            return [Position.DEAL_TYPES[d.type], d.time, d.price]
        result = map(filter, self.opening_deals + self.closing_deals)
        return result

    def calculate(self):
        '''Calculate
        '''
        # closed only if difference is less than 0.01
        self.price_open_avg = self.price_open_avg/self.opening_volume
        self.price_close_avg = self.price_close_avg/self.closing_volume

        try:
            digits = self.symbol_info.digits
            value_per_point = 1000
            if digits == 3:
                value_per_point /= 100.0

            # Buy
            if self.opening_deals[0].type == 0:
                self.pips_sl = abs((self.price_open_avg)-self.price_sl)*value_per_point
                self.pips_tp = abs(self.price_tp-self.price_open_avg)*value_per_point
            # Sell
            else:
                self.pips_sl = abs(self.price_sl-self.price_open_avg)*value_per_point
                self.pips_tp = abs((self.price_open_avg)-self.price_tp)*value_per_point

            self.pip_movement = abs(self.price_open_avg-self.price_close_avg)*value_per_point
        except Exception as e:
            log("Symbol not found %s" % self.opening_deals[0].symbol)
        #
        if not self.price_sl > 0.0:
            self.pips_sl = 0

        if not self.price_tp > 0.0:
            self.pips_tp = 0

        # Type of order
        self.sell_or_buy = Position.DEAL_TYPES[self.opening_deals[0].type]
        self.symbol = self.opening_deals[0].symbol

    def get_data_for_excel(self):
        '''Create Data Set for Excel
        '''
        data = []

        # 0
        data.append(self.id)

        # 1
        opening_date = self.opening_deals[len(self.opening_deals)-1].time_msc
        data.append(datetime.datetime.fromtimestamp(opening_date/1000.0).strftime('%Y-%m-%d %H:%M'))

        # 2
        closing_date = self.closing_deals[len(self.closing_deals)-1].time_msc
        data.append(datetime.datetime.fromtimestamp(closing_date/1000.0).strftime('%Y-%m-%d %H:%M'))

        # 3
        data.append(self.symbol)

        # 4
        data.append(self.volume_total)

        # 5
        data.append(self.sell_or_buy)

        # 6
        data.append(self.price_open_avg)

        # 7
        data.append(self.price_close_avg)

        # 8
        data.append(self.swap_total)

        data.append(self.pip_movement)

        # 9
        data.append(self.pips_sl)

        # 10
        data.append(self.pips_tp)

        # 11
        data.append(self.profit_total)

        return data

    def print_data(self):
        '''
        Print data
        '''
        log("## %s[%s] {%s} ###################" % (self.id, self.symbol, self.sell_or_buy))
        log("\t%-20s %-2f" % ("{SL}:", self.price_sl))
        log("\t%-20s %-2f" % ("{TP}:", self.price_tp))

        log("\t%-20s %-2f" % ("{SL[pips]}:", self.pips_sl))
        log("\t%-20s %-2f" % ("{TP[pips]}:", self.pips_tp))

        log("\t%-20s %-2f" % ("{Average Open}:", self.price_open_avg))
        log("\t%-20s %-2f" % ("{Average Close}:", self.price_close_avg))

        log("\t%-20s %-2f" % ("{Total Volume}:", self.volume_total))
        log("\t%-20s %-2f" % ("{Total Swap}:", self.swap_total))
        log("\t%-20s %-2f" % ("{Total Profit}:", self.profit_total))

        for d in self.opening_deals:
            log("\t%-20s [%-s]" % ("**Opening Deal:", d.order))
            log("\t%-20s [%-s]" % ("   Time:", datetime.datetime.fromtimestamp(d.time)))
            log("\t%-20s [%-s]" % ("   Price:", d.price))
            log("\t%-20s [%-s]" % ("   Volume:", d.volume))

        for d in self.closing_deals:
            log("\t%-20s [%-s]" % ("**Closing Deal:", d.order))
            log("\t%-20s [%-s]" % ("   Time:", datetime.datetime.fromtimestamp(d.time)))
            log("\t%-20s [%-s]" % ("   Price:", d.price))
            log("\t%-20s [%-s]" % ("   Volume:", d.volume))

    def get_info_header():
        return Position.HEADER

    def get_info(self):
        data = []

        data.append(self.id)
        data.append(self.symbol)
        data.append(self.volume_total)
        data.append(self.profit_total)
        data.append(self.sell_or_buy)
        data.append(self.comment)

        return data

    def get_json(self):
        data = {"id": self.id,
                "symbol": self.opening_deals[0].symbol,
                "price_sl": self.price_sl,
                "price_tp": self.price_tp,
                "price_open_avg": self.price_open_avg,
                "price_close_avg": self.price_close_avg,
                "volume": self.volume_total,
                "swap": self.swap_total,
                "profit": self.profit_total,
                "opened": [],
                "closed": []
                }

        for d in self.opening_deals:
            order = {"order": d.order,
                     "time": datetime.datetime.fromtimestamp(d.time),
                     "price": d.price,
                     "volume": d.volume

                     }
            data["opened"].append(order)

        for d in self.closing_deals:
            order = {"order": d.order,
                     "time": datetime.datetime.fromtimestamp(d.time),
                     "price": d.price,
                     "volume": d.volume

                     }
            data["closed"].append(order)

        return data
