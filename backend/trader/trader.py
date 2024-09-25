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
            self.time_offset_s = self.mt5api.calculate_broke_time_difference_seconds()

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
            end_ms = info.time_msc
            start_ms = time_go_back_n_weeks(end_ms, 2)
            rates = mt5.copy_rates_range(sym.name, mt5.TIMEFRAME_D1, convert_timestamp_ms_to_date(start_ms), convert_timestamp_ms_to_date(end_ms))
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
        for pid in positions:
            pd = positions[pid]
            start_ms = pd.get_start_ms()
            end_ms = pd.get_end_ms()
            time_difference_ms = (end_ms - start_ms)

            start_ms = time_go_back_n_weeks(start_ms, 1)
            # start_ms -= (time_difference_ms*4)
            end_ms += (time_difference_ms/2)

            if end_ms > int(round(time.time() * 1000)):
                end_ms = int(round(time.time() * 1000))

            for tf in reversed(Trader.TIMEFRAMES):
                rates = self.mt5api.get_rates(pd.get_symbol_name(),
                                              utc_from=convert_timestamp_ms_to_date(start_ms),
                                              utc_to=convert_timestamp_ms_to_date(end_ms),
                                              frame=self.mt5api.get_mt5_timeframe(tf))


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

    def get_rates(self, symbol: Symbol, timeframe, start_ms, end_ms, json=False):
        """Add difference of rates to the symbol"""
        rates = []
        tf = self.mt5api.get_mt5_timeframe(timeframe)
        if start_ms != end_ms and tf >= 0:
            timestamp_start = convert_timestamp_ms_to_date(start_ms)
            timestamp_end = convert_timestamp_ms_to_date(end_ms)
            for rate in self.mt5api.get_rates(symbol.name,utc_from=timestamp_start, utc_to=timestamp_end, frame=tf):
                rates.append(Rate(rate).to_json(1000))

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

    def get_history_positions(self, start_date, only_finished=True):
        pos_temporary = {}
        pos_finished = {}
        end_date = convert_timestamp_to_date(local_timestamp(), self.time_offset_s)

        history_deals = mt5.history_deals_get(start_date, end_date)
        for deal in history_deals:
            pos_id = str(deal.position_id)

            # Add deal to the corresponding position
            if pos_id not in pos_temporary:
                pos_temporary[pos_id] = ClosedPosition(pos_id)
            
            pos_temporary[pos_id].add_deal(deal)

            # If position is fully closed, move to finished
            if pos_temporary[pos_id].is_fully_closed():
                pos_finished[pos_id] = pos_temporary[pos_id]

        # Process finished positions
        for pos_id, closed_pos in pos_finished.items():
            # Handle potential symbol name change (e.g. for futures)
            symbol_info = mt5.symbol_info(closed_pos.get_symbol_name())
            closed_pos.set_symbol_info(symbol_info)

            # Retrieve and add associated orders
            orders = mt5.history_orders_get(position=int(pos_id))
            closed_pos.add_orders(orders)

            # Finalize calculations and print position data
            closed_pos.calculate()
            closed_pos.print_data()

        log(f"INFO: Finished Count: {len(pos_finished)} | Total Count: {len(pos_temporary)}")
        return pos_finished if only_finished else pos_temporary

    def trade(self, symbol, lot, type, price, stoplimit, stoploss, takeprofit, comment, pending=False, position=0):
        if not self.is_trading_enabled:
            return {0, ""}

        mt5_type = self.mt5api.resolve_type_api_to_mt5(type)
        trade_request = TradeRequest(symbol, lot, mt5_type, price, stoplimit, stoploss, takeprofit, position, pending, comment)
        return_info = self.mt5api.trade(trade_request.get_request())
        return return_info
