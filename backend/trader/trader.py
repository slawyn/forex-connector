import datetime
import MetaTrader5 as mt5
import time
import subprocess

from components.accountinfo import AccountInfo
from components.position import ClosedPosition, OpenPosition
from components.rate import Rate
from components.symbol import Symbol
from trader.codes import ERROR_CODES
from helpers import *

class Trader:
    TIMEFRAMES = ["M1", "M2", "M3", "M4", "M5", "M6", "M10", "M12", "M20", "M30", "H1", "H2", "H3", "H4", "H6", "H8", "H12", "D1", "W1", "MN1"]
    MT_TIMEFRAMES = [mt5.TIMEFRAME_M1, mt5.TIMEFRAME_M2, mt5.TIMEFRAME_M3, mt5.TIMEFRAME_M4, mt5.TIMEFRAME_M5, mt5.TIMEFRAME_M6, mt5.TIMEFRAME_M10, mt5.TIMEFRAME_M12, mt5.TIMEFRAME_M20, mt5.TIMEFRAME_M30,
                     mt5.TIMEFRAME_H1, mt5.TIMEFRAME_H2, mt5.TIMEFRAME_H3, mt5.TIMEFRAME_H4, mt5.TIMEFRAME_H6, mt5.TIMEFRAME_H8, mt5.TIMEFRAME_H12, mt5.TIMEFRAME_D1, mt5.TIMEFRAME_W1, mt5.TIMEFRAME_MN1]

    MAX_BARS_COUNT = 110
    OPTIMAL_BAR_COUNT = 70
    """
        description: Used for communicating over the connector with mt5
    """

    def __init__(self, mt_config, mt_process):
        cmd = [mt_process, f"/config:{mt_config}"]
        p = subprocess.Popen(cmd, start_new_session=True)
        log("INFO", cmd)

        # 1. Establish connection to the MetaTrader 5 terminal
        if self._initialize():
            self.symbols = {}
            self.open_positions = {}
            self.account_info = AccountInfo(mt5.account_info())
            self._update_account_info()

    def _initialize(self):
        if mt5.account_info() is None and not mt5.initialize():
            raise ValueError("ERROR: initialize() failed, error code =" + str(mt5.last_error()))
        else:
            return True

    def _update_account_info(self):
        """ Collect Essential Account Information """
        self.account_info.set_data(mt5.account_info())

    def get_account_info(self):
        self._update_account_info()
        return self.account_info

    def set_filter(self, filter):
        if filter == "currency":
            self.filter_function = lambda sym: sym.currency_base == self.account_info.currency or sym.currency_profit == self.account_info.currency
        else:
            self.filter_function = lambda sym: True

    def get_timeframes(self):
        return Trader.TIMEFRAMES

    def get_orders(self):
        """ Get Orders """
        self._initialize()
        return mt5.orders_get()

    def get_atr(self, sym):
        self._initialize()

        info = mt5.symbol_info_tick(sym.name)
        stop_msc = info.time_msc
        start_msc = time_go_back_n_weeks(stop_msc, 2)
        rates = mt5.copy_rates_range(sym.name, mt5.TIMEFRAME_D1, start_msc/1000, stop_msc/1000)
        atr = Rate.calculate_average_true_range(rates)

        return atr

    def get_open_positions(self):
        """Get Open Positions"""
        all_available = []
        for pos in mt5.positions_get():
            all_available.append(pos.ticket)
            try:
                open_position = self.open_positions[pos.ticket]
                open_position.update(pos)
            except:
                self.open_positions[pos.ticket] = OpenPosition(pos)

        # Remove positions which are not open anymore
        for k in list(self.open_positions.keys()):
            if k not in all_available:
                del self.open_positions[k]

        return self.open_positions

    def get_closed_positions(self, start_date):
        """ Return the current positions. Position=0 --> Buy """
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

                # Too big
                if len(rates) > Trader.MAX_BARS_COUNT:
                    period += 1
                    if period > len(Trader.MT_TIMEFRAMES):
                        log("ERROR: Plotting not possible, no bigger time frame available")
                    else:
                        rates = mt5.copy_rates_range(pd.get_symbol_name(), Trader.MT_TIMEFRAMES[period], time_start, time_stop)
                        pd.add_rates(rates, Trader.TIMEFRAMES[period])
                    break

                # Optimal
                elif len(rates) > Trader.OPTIMAL_BAR_COUNT or time_frame == Trader.MT_TIMEFRAMES[0]:
                    pd.add_rates(rates, Trader.TIMEFRAMES[period])
                    break

        return positions

    def get_tick(self, sym: Symbol):
        """ Gets tick for the symbol"""
        if sym == None:
            raise ValueError("ERROR: Symbol cannot be None")
        else:
            return mt5.symbol_info_tick(sym.name)

    def _get_symbols(self):
        """ Collect Symbols """
        if self._initialize():
            return mt5.symbols_get()
        return []

    def get_symbol(self, sym_name):
        return self.symbols.get(sym_name, None)

    def get_rates(self, symbol: Symbol, time_frame, start_ms, end_ms, json=False):
        """Add difference of rates to the symbol"""
        rates = {}
        period = Trader.TIMEFRAMES.index(time_frame)
        if start_ms != end_ms and period >=0:
            TIME_FRAME = Trader.MT_TIMEFRAMES[period]
            start_s = start_ms / 1000
            end_s = end_ms/1000

            timestamp_start = datetime.datetime.fromtimestamp(start_s)
            timestamp_end = datetime.datetime.fromtimestamp(end_s)
            current_s = symbol.time

            # Update initial
            if symbol.get_timestamp_first(TIME_FRAME) == 0:
                symbol.update_rates(self.get_mt5_rates(symbol.name,
                                                              utc_from=timestamp_start,
                                                              utc_to=timestamp_end,
                                                              frame=TIME_FRAME),
                                                              timeframe=TIME_FRAME)
            # Update recent
            symbol.update_rates(self.get_mt5_rates(symbol.name, 
                                                          utc_from=timestamp_end, 
                                                          utc_to=datetime.datetime.fromtimestamp(current_s),
                                                          frame=TIME_FRAME),
                                                          timeframe=TIME_FRAME)

            
            # Update before current start
            initial_timestamp = datetime.datetime.fromtimestamp(symbol.get_timestamp_first(TIME_FRAME))
            if timestamp_start < initial_timestamp:
                symbol.update_rates(self.get_mt5_rates(symbol.name, utc_from=timestamp_start, utc_to=initial_timestamp, frame=TIME_FRAME), timeframe=TIME_FRAME) 


            _rates = symbol.get_rates(timeframe=TIME_FRAME)
            for timestamp_s in sorted(list(_rates.keys())):
                if start_s <= timestamp_s <= current_s:
                    timestamp_ms = timestamp_s*1000
                    if json:
                        rates[timestamp_ms] = _rates[timestamp_s].to_json()
                    else:
                        rates[timestamp_ms] = _rates[timestamp_s]

        return rates

    def get_symbols(self, sorted=True):
        syms = []
        for sym in self._get_symbols():
            if not (sym.name in self.symbols):
                self.symbols[sym.name] = Symbol(sym, conversion=(sym.currency_profit != self.account_info.currency))

            exported_symbol = self.symbols[sym.name]
            exported_symbol.update(sym)

            if self.get_tick(sym) != None and self.filter_function(sym):
                syms.append(exported_symbol)

        if sorted:
            syms.sort(key=lambda x: x.name)
        return syms

    def get_symbols_by_wildcard(self, wildcard):
        syms = []
        for _sym in self._get_symbols():
            if wildcard in _sym:
                syms.append(_sym)
        return syms

    def get_mt5_rates(self, symbol_name, utc_from, utc_to, frame=mt5.TIMEFRAME_H1):
        data = []
        try:
            data = mt5.copy_rates_range(symbol_name, frame, utc_from, utc_to)
            code = mt5.last_error()[0]
            if code != 1:
                data = []
                raise Exception(f"ERROR: During fetching of rates {symbol_name} {mt5.last_error()}")
        except Exception as e:
            log(e)
        return data

    def get_ticks_for_symbol(self, symbol_name, utc_from, utc_to):
        data = []
        try:
            data = mt5.copy_ticks_range(symbol_name, utc_from, utc_to, mt5.COPY_TICKS_ALL)
            code = mt5.last_error()[0]
            if code != 1:
                data = []
                raise Exception(f"ERROR: During fetching of ticks {symbol_name} {mt5.last_error()}")
        except Exception as e:
            log(e)

        return data

    def get_history_positions(self, start_date, onlyfinished=True):
        pos_temporary = {}
        pos_finished = {}
        history_deals = mt5.history_deals_get(start_date, datetime.datetime.now())
        for deal in history_deals:
            mt5.history_deals_get(start_date, datetime.datetime.now())

            # add deals to position
            pos_id = str(deal.position_id)
            if pos_id not in pos_temporary:
                pos_temporary[pos_id] = ClosedPosition(pos_id)
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

        log("INFO: Entry Count:%d" % len(pos_finished))
        if onlyfinished:
            return pos_finished
        else:
            return pos_temporary

    def trade(self, tradeRequest, trade=False):
        if not trade:
            id, text = {0, ""}
        else:
            request = tradeRequest
            log(request)
            result = mt5.order_send(request)
            if result != None:
                id, text = {result.retcode, ERROR_CODES[result.retcode]}
            else:
                retcode = mt5.last_error()
                id, text = {retcode[0], retcode[1]}

        return id, text
