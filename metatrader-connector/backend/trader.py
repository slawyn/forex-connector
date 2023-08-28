from helpers import *
from driver import DriveFileController
from chart import Chart

import MetaTrader5 as mt5

import time
import sys
import datetime


class Position:
    DEAL_TYPES = {0: "BUY", 1: "SELL"}

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

        self.timestart = 0
        self.timestop = 0
        self.period = ""
        self.rates = []

    '''
    Rates and period
    '''

    def add_rates(self, rates, period):
        self.period = period
        self.rates = rates

    '''
    Add deal to position
    '''

    def add_deal(self, deal):
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

    '''
    Add orders to position
    '''

    def add_orders(self, orders):
        # Check if stop loss has been set, if not set it to a value by parsing other orders regarding this position
        # Problem some data doesn't have stop loss or take profit data in the database, although it is set in metatrader. Don't know why
        if orders != None:
            for order in orders:
                if order.sl > 0.0:
                    self.price_sl = order.sl

                if order.tp > 0.0:
                    self.price_tp = order.tp
    '''
    Add symbol info to position
    '''

    def set_symbol_info(self, sym):
        self.symbol_info = sym

    '''
    Gets
    '''

    def get_symbol_name(self):
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

    '''
    Calculate
    '''

    def calculate(self):

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

    '''
    Create Data Set for Excel
    '''

    def get_data_for_excel(self):
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
        data.append(self.opening_deals[0].symbol)

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

    '''
    Print data
    '''

    def print_data(self):
        log("## %s[%s] {%s} ###################" % (self.id, self.opening_deals[0].symbol, self.sell_or_buy))
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


class Trader:
    TIMEFRAMES = ["M2", "M3", "M4", "M5", "M6", "M10", "M12", "M20", "M30", "H1", "H2", "H3", "H4", "H6", "H8", "H12", "D1", "W1", "MN1"]
    MT_TIMEFRAMES = [mt5.TIMEFRAME_M2, mt5.TIMEFRAME_M3, mt5.TIMEFRAME_M4, mt5.TIMEFRAME_M5, mt5.TIMEFRAME_M6, mt5.TIMEFRAME_M10, mt5.TIMEFRAME_M12, mt5.TIMEFRAME_M20, mt5.TIMEFRAME_M30,
                     mt5.TIMEFRAME_H1, mt5.TIMEFRAME_H2, mt5.TIMEFRAME_H3, mt5.TIMEFRAME_H4, mt5.TIMEFRAME_H6, mt5.TIMEFRAME_H8, mt5.TIMEFRAME_H12, mt5.TIMEFRAME_D1, mt5.TIMEFRAME_W1, mt5.TIMEFRAME_MN1]

    '''
        description: Used for communicating over the connector with mt5
    '''

    def __init__(self, configname):
        # 1. Establish connection to the MetaTrader 5 terminal
        if self.reinit():
            self.config = load_config(configname)
            self.ratio = 1
            self.risk = 2
            self.symbols = None
            self.update_account_info()

    def reinit(self):
        if not mt5.initialize():
            raise ValueError("initialize() failed, error code =" + str(mt5.last_error()))
        else:
            return True

    def is_connected(self):
        return mt5.account_info() != None

    def update_account_info(self):
        ''' Collect Account Information '''
        acc_info = mt5.account_info()
        self.balance = acc_info.balance
        self.currency = acc_info.currency

    def update_history_info(self):
        ''' Collect Information '''
        # Get Positions of closed deals and add them to excel sheet
        self.drive_handle = DriveFileController(self.config["secretsfile"], self.config["folderid"], self.config["spreadsheet"], self.config["worksheet"], self.config["dir"])
        positions = self.get_history_positions(self.config["date"])

        # prepare positions for drawing
        for pid in positions:
            pd = positions[pid]
            start_msc = pd.get_start_msc()
            end_msc = pd.get_end_msc()
            time_difference = (end_msc - start_msc)

            start_msc -= (time_difference*4)
            end_msc += (time_difference/2)

            if end_msc > int(round(time.time() * 1000)):
                end_msc = int(round(time.time() * 1000))

            time_start = datetime.datetime.fromtimestamp(start_msc/1000.0)
            time_stop = datetime.datetime.fromtimestamp(end_msc/1000.0)

            rates_prev = None
            for period in reversed(range(len(Trader.TIMEFRAMES))):
                time_frame = Trader.MT_TIMEFRAMES[period]
                rates = mt5.copy_rates_range(pd.get_symbol_name(), time_frame, time_start, time_stop)
                if len(rates) > 80 or time_frame == Trader.MT_TIMEFRAMES[0]:
                    pd.add_rates(rates, Trader.TIMEFRAMES[period])
                    break

            # start, end, period = calculate_plot_range(pd.get_start_msc(), pd.get_end_msc())
            # rates = mt5.copy_rates_range(pd.get_symbol_name(), Trader.TIMEFRAMES[period], start, end)

        self.drive_handle.update_google_sheet(positions)

    def update_symbols(self):
        ''' Collect Symbols '''
        self.symbols = mt5.symbols_get()

    def get_orders(self):
        ''' Get Orders '''
        return mt5.orders_get()

    def get_atr(self, sym):
        info = mt5.symbol_info_tick(sym.name)
        #
        stop_msc = info.time_msc
        start_msc = time_go_back_n_weeks(stop_msc, 2)
        rates = mt5.copy_rates_range(sym.name, mt5.TIMEFRAME_D1, start_msc/1000, stop_msc/1000)
        atr = calculate_average_true_range(rates)

        return atr

    def get_tick(self, sym):
        if sym != None:
            tick = mt5.symbol_info_tick(sym.name)
            return tick
        else:
            raise ValueError("Symbol cannot be None")

    def send_order(self, symbol, type, volume, price, sl, tp, stoplimit, comment=""):
        try:
            result = mt5.order_send(action=action, magic=magic, order=order, symbol=symbol,  volume=volume, price=price, stoplimit=stoplimit, sl=sl, tp=tp, deviation=deviation,
                                    type=type, type_filling=type_filling, type_time=type_time, expiration=expiration, comment=comment, position=position, position_by=position_by)
        except Exception as e:
            log(e)
        pass

    def get_symbols(self):
        if self.symbols is None:
            self.update_symbols()

        return self.symbols

    def get_symbols_sorted(self):
        syms = []
        for s in self.get_symbols():
            if s != None:
                syms.append(s)
        syms.sort(key=lambda x: x.name)
        return syms

    def get_symbols_by_wildcard(self, wildcard):
        syms = []
        for s in self.get_symbols():
            if wilcard in s:
                syms.append(s)
        return syms

    def calculate_stoploss(self,  sym):
        loss_profit = self.balance*(self.risk/100)
        lot_min = sym.volume_min
        lot_step = sym.volume_step
        contractsforlot = sym.trade_contract_size
        lots = lot_min
        # lots * contracts per lot * pricediff = loss_profit

        value_per_point = sym.trade_tick_value * sym.point/sym.trade_tick_size

        if sym.digits == 3:
            value_per_point /= 100.0

        points = loss_profit/(contractsforlot * lots * value_per_point)

        buy_stoploss = sym.bid - points
        buy_takeprofit = sym.bid + self.ratio * points
        sell_stoploss = sym.ask + points
        sell_takeprofit = sym.ask - self.ratio * points

        log("%s:[A:%f B:%f] %s %s %s %s" % (s.name, sym.ask, sym.bid, str(buy_stoploss), str(buy_takeprofit), str(sell_stoploss), str(sell_takeprofit)))
        log("\tRisk: %f Diff: %f tickval=%f point=%f ticksize=%f" % (loss_profit, points, sym.trade_tick_value, sym.point, sym.trade_tick_size))
        return [buy_stoploss, buy_takeprofit, sell_stoploss, sell_takeprofit]

    def get_history_positions(self, date):
        start_date = convert_string_to_date(date)

        # get history_deals for symbols whose names contain "GBP" within a specified interval
        history_deals = mt5.history_deals_get(start_date, datetime.datetime.now())

        pos_temporary = {}
        pos_finished = {}
        for deal in history_deals:
            mt5.history_deals_get(start_date, datetime.datetime.now())

            # add deals to position
            pos_id = str(deal.position_id)
            if pos_id not in pos_temporary:
                pos_temporary[pos_id] = Position(pos_id)
                pos_temporary[pos_id].add_deal(deal)
            else:
                pos_temporary[pos_id].add_deal(deal)

            # if closed add it to finished
            pd = pos_temporary[pos_id]
            if pd.is_fully_closed():
                pos_finished[pos_id] = pd

        for pid in pos_finished.keys():
            pd = pos_finished[pid]

            # Caution, futures change names
            symbol_info_ = mt5.symbol_info(pd.get_symbol_name())
            pd.set_symbol_info(symbol_info_)

            #
            orders = mt5.history_orders_get(position=int(pid))
            pd.add_orders(orders)

            #
            pd.calculate()
            pd.print_data()

        log("Entry Count:%d" % len(pos_finished))
        return pos_finished


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
# mt5.shutdown()
