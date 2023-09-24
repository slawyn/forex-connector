class AccountInfo:
    def __init__(self, acc):
        self.set_data(acc)

    def set_data(self, acc):
        self.balance = acc.balance
        self.currency = acc.currency
        self.profit = acc.profit
        self.leverage = acc.leverage
        self.company = acc.company
        self.server = acc.server
        self.login = acc.login
