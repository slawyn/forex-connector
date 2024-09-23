import MetaTrader5 as mt5
import time


from components.account import Account
from components.position import ClosedPosition, OpenPosition
from components.rate import Rate
from components.symbol import Symbol
from helpers import *
from trader.request import TradeRequest
from trader.mt5api import MetatraderApi


class Trader:
    TIMEFRAMES = ["M1", "M2", "M3", "M4", "M5", "M6", "M10", "M12", "M20", "M30", "H1", "H2", "H3", "H4", "H6", "H8", "H12", "D1", "W1", "MN1"]
    """
        description: Used for communicating over the connector with mt5
    """

    def __init__(self, mt_config, mt_process, is_trading_enabled=False):
        self.is_trading_enabled = is_trading_enabled
        self.mt5api = MetatraderApi(mt_process, mt_config)
        self.symbols = {}
        self.open_positions = {}

        # 1. Establish connection to the MetaTrader 5 terminal
        if self.mt5api.is_connection_present():
            self.account = Account(self.mt5api.get_account())

    def get_account_info(self):
        self.account.update(self.mt5api.get_account())
        return self.account

    def set_filter(self, filter):
        if filter == "currency":
            self.filter_function = lambda sym: sym.currency_base == self.account.currency or sym.currency_profit == self.account.currency
        else:
            self.filter_function = lambda sym: True

    def get_timeframes(self):
        return Trader.TIMEFRAMES

    def get_atr(self, sym):
        if self.mt5api.is_connection_present():
            info = mt5.symbol_info_tick(sym.name)
            stop_msc = info.time_msc
            start_msc = time_go_back_n_weeks(stop_msc, 2)
            rates = mt5.copy_rates_range(sym.name, mt5.TIMEFRAME_D1, start_msc/1000, stop_msc/1000)
            return Rate.calculate_average_true_range(rates)
        return -1

    def get_open_positions(self):
        """Get Open Positions"""
        tickets = []
        for pos in self.mt5api.get_open_positions():
            tickets.append(pos.ticket)
            try:
                open_position = self.open_positions[pos.ticket]
                open_position.update(pos)
            except:
                self.open_positions[pos.ticket] = OpenPosition(pos,  self.mt5api.resolve_type_mt5_to_api(pos.type))

        # Remove positions which are not open anymore
        for k in list(self.open_positions.keys()):
            if k not in tickets:
                del self.open_positions[k]

        return self.open_positions

    def get_closed_positions(self, start_date, barcount):
        """ Return the current positions. Position=0 --> Buy """
        positions = self.get_history_positions(start_date)

        # prepare positions for drawing
        for pid in positions:
            pd = positions[pid]
            start_msc = pd.get_start_msc()
            end_msc = pd.get_end_msc()
            time_difference = (end_msc - start_msc)

            start_msc = time_go_back_n_weeks(start_msc, 1)
            # start_msc -= (time_difference*4)
            end_msc += (time_difference/2)

            if end_msc > int(round(time.time() * 1000)):
                end_msc = int(round(time.time() * 1000))

            time_start = convert_timestamp_to_date(start_msc/1000.0)
            time_stop = convert_timestamp_to_date(end_msc/1000.0)

            for tf in reversed(Trader.TIMEFRAMES):
                rates = mt5.copy_rates_range(pd.get_symbol_name(),
                                             self.mt5api.get_mt5_timeframe(tf),
                                             time_start,
                                             time_stop)

                # Too big
                length = len(rates)
                if length > barcount or tf == "M1":
                    pd.add_rates(rates[length-barcount:], tf)
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
        if self.mt5api.is_connection_present():
            return mt5.symbols_get()
        return []

    def get_symbol(self, sym_name):
        return self.symbols.get(sym_name, None)

    def get_rates(self, symbol: Symbol, time_frame, start_ms, end_ms, json=False):
        """Add difference of rates to the symbol"""
        rates = []
        timeframe = self.mt5api.get_mt5_timeframe(time_frame)
        if start_ms != end_ms and timeframe >= 0:
            start_s = start_ms/1000
            end_s = end_ms/1000
            current_s = symbol.time

            timestamp_start = convert_timestamp_to_date(start_s)
            timestamp_end = convert_timestamp_to_date(end_s)
            timestamp_current = convert_timestamp_to_date(current_s)

            # Update initial
            if symbol.get_timestamp_first(timeframe) == 0:
                symbol.update_rates(self.mt5api.get_rates(symbol.name,
                                                          utc_from=timestamp_start,
                                                          utc_to=timestamp_end,
                                                          frame=timeframe),
                                    timeframe=timeframe)
            # Update recent
            symbol.update_rates(self.mt5api.get_rates(symbol.name,
                                                      utc_from=timestamp_end,
                                                      utc_to=timestamp_current,
                                                      frame=timeframe),
                                timeframe=timeframe)

            # Update before current start
            timestamp_initial = convert_timestamp_to_date(symbol.get_timestamp_first(timeframe))
            if timestamp_start < timestamp_initial:
                symbol.update_rates(self.mt5api.get_rates(symbol.name,
                                                          utc_from=timestamp_start,
                                                          utc_to=timestamp_initial,
                                                          frame=timeframe),
                                    timeframe=timeframe)

            for timestamp, rate in symbol.get_rates(timeframe=timeframe).items():
                if start_s <= timestamp <= current_s:
                    r = rate.to_json()
                    r["time"] = r.get("time")*1000
                    rates.append(r)

        return rates

    def get_symbols(self, sorted=True):
        syms = []
        for sym in self._get_symbols():
            if not (sym.name in self.symbols):
                self.symbols[sym.name] = Symbol(sym, conversion=(sym.currency_profit != self.account.currency))

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

    def trade(self, symbol, lot, type, price, stoplimit, stoploss, takeprofit, comment, pending=False, position=0):
        if not self.is_trading_enabled:
            return {0, ""}

        mt5_type = self.mt5api.resolve_type_api_to_mt5(type)
        trade_request = TradeRequest(symbol, lot, mt5_type, price, stoplimit, stoploss, takeprofit, position, pending, comment)
        return_info = self.mt5api.trade(trade_request.get_request())
        return return_info
