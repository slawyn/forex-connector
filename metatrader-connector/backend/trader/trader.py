import datetime
import MetaTrader5 as mt5
import time


from chart import Chart
from trader.accountinfo import AccountInfo
from trader.position import Position
from trader.symbol import Symbol
from trader.request import TradeRequest
from helpers import *


class Trader:
    TIMEFRAMES = ["M2", "M3", "M4", "M5", "M6", "M10", "M12", "M20", "M30", "H1", "H2", "H3", "H4", "H6", "H8", "H12", "D1", "W1", "MN1"]
    MT_TIMEFRAMES = [mt5.TIMEFRAME_M2, mt5.TIMEFRAME_M3, mt5.TIMEFRAME_M4, mt5.TIMEFRAME_M5, mt5.TIMEFRAME_M6, mt5.TIMEFRAME_M10, mt5.TIMEFRAME_M12, mt5.TIMEFRAME_M20, mt5.TIMEFRAME_M30,
                     mt5.TIMEFRAME_H1, mt5.TIMEFRAME_H2, mt5.TIMEFRAME_H3, mt5.TIMEFRAME_H4, mt5.TIMEFRAME_H6, mt5.TIMEFRAME_H8, mt5.TIMEFRAME_H12, mt5.TIMEFRAME_D1, mt5.TIMEFRAME_W1, mt5.TIMEFRAME_MN1]

    '''
        description: Used for communicating over the connector with mt5
    '''

    def __init__(self, config):
        # 1. Establish connection to the MetaTrader 5 terminal
        if self.reinit():
            self.config = config
            self.ratio = 1
            self.risk = 2
            self.symbols = None
            self.symbols = {}
            self.account_info = AccountInfo(mt5.account_info())
            self.update_account_info()

    def reinit(self):
        if not mt5.initialize():
            raise ValueError("initialize() failed, error code =" + str(mt5.last_error()))
        else:
            return True

    def needs_reconnect(self):
        return mt5.account_info() != None

    def update_account_info(self):
        ''' Collect Essential Account Information '''
        acc_info = mt5.account_info()
        self.account_info.set_data(mt5.account_info())

    def get_account_info(self):
        return self.account_info

    def send_order(self, symbol, type, volume, price, sl, tp, stoplimit, comment=""):
        try:
            result = mt5.order_send(action=action, magic=magic, order=order, symbol=symbol,  volume=volume, price=price, stoplimit=stoplimit, sl=sl, tp=tp, deviation=deviation,
                                    type=type, type_filling=type_filling, type_time=type_time, expiration=expiration, comment=comment, position=position, position_by=position_by)
        except Exception as e:
            log(e)
        pass

    def _filter_currency(self, sym):
        return sym.currency_base == self.account_info.currency or sym.currency_profit == self.account_info.currency

    def set_filter(self, filter):
        if filter == "currency":
            self.filter_function = self._filter_currency
        else:
            self.filter_function = lambda self, sym: True

    def get_orders(self):
        ''' Get Orders '''
        if self.needs_reconnect():
            self.reinit()
        return mt5.orders_get()

    def get_atr(self, sym):
        if self.needs_reconnect():
            self.reinit()

        info = mt5.symbol_info_tick(sym.name)
        stop_msc = info.time_msc
        start_msc = time_go_back_n_weeks(stop_msc, 2)
        rates = mt5.copy_rates_range(sym.name, mt5.TIMEFRAME_D1, start_msc/1000, stop_msc/1000)
        atr = calculate_average_true_range(rates)

        return atr

    def get_closed_positions(self, start_date):
        positions = self.get_history_positions(start_date)

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

            for period in reversed(range(len(Trader.TIMEFRAMES))):
                time_frame = Trader.MT_TIMEFRAMES[period]
                rates = mt5.copy_rates_range(pd.get_symbol_name(), time_frame, time_start, time_stop)
                if len(rates) > 80 or time_frame == Trader.MT_TIMEFRAMES[0]:
                    pd.add_rates(rates, Trader.TIMEFRAMES[period])
                    break

            # start, end, period = calculate_plot_range(pd.get_start_msc(), pd.get_end_msc())
            # rates = mt5.copy_rates_range(pd.get_symbol_name(), Trader.TIMEFRAMES[period], start, end)

        return positions

    def get_tick(self, sym):
        if sym != None:
            tick = mt5.symbol_info_tick(sym.name)
            return tick
        else:
            raise ValueError("ERROR: Symbol cannot be None")

    def get_symbols(self):
        ''' Collect Symbols '''
        symbols = mt5.symbols_get()
        if symbols == None or len(symbols) == 0:
            mt5.initialize()
            symbols = []

        return symbols

    def get_symbol(self, sym_name):
        exported_symbol = self.symbols[sym_name]
        return exported_symbol

    def get_updated_symbols_sorted(self):
        syms = []
        for sym in self.get_symbols():
            exported_symbol = None

            # check if symbol is none
            try:
                exported_symbol = self.symbols[sym.name]
                exported_symbol.update(sym)
            except:
                pass
            finally:
                if exported_symbol == None:
                    exported_symbol = Symbol(sym)
                    self.symbols[sym.name] = exported_symbol

            if self.get_tick(sym) != None and self.filter_function(sym):
                syms.append(exported_symbol)

        syms.sort(key=lambda x: x.name)
        return syms

    def get_symbols_by_wildcard(self, wildcard):
        syms = []
        for s in self.get_symbols():
            if wildcard in s:
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

    def get_history_positions(self, start_date, onlyfinished=True):

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
        if onlyfinished:
            return pos_finished
        else:
            return pos_temporary

    def trade(self, tradeRequest):
        request = tradeRequest.get_request()
        result = mt5.order_send(request)
        log(result.retcode)
