import socket
from helpers import loge, logi
import time


class Commander():
    HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
    PORT = 23456  # Port to listen on (non-privileged ports are > 1023)

    def __init__(self):
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.instrument = ""

    def connect(self):
        error = False
        try:
            self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server.connect((Commander.HOST, Commander.PORT))
            logi("Cmmander: connected")
            time.sleep(0.2)
        except Exception as e:
            error = True
            loge("Commander: failed connect")
        return error

    def disconnect(self):
        return self.server.close()

    def send_receive(self, string):
        error = False
        rdata = []
        data = bytes(string, 'ascii')
        try:
            self.server.sendall(data)
            logi(f"Commander: {string}")
        except Exception as e:
            print(e)
            error = True
            loge(f"Commander: {string}")

        return rdata, error

    def ping(self):
        rdata, error = self.send_receive("\r\n")
        if error:
            error = self.connect()
        return error

    def send_drawlines(self, prices):
        rdata = []

        command_separated = ",".join(prices)
        if not self.ping():
            rdata, error = self.send_receive(f"DRAW:{command_separated}\r\n")
        return rdata

    def send_instrument(self, instrument):
        rdata = []
        if not self.ping():
            rdata, error = self.send_receive(f"INSTRUMENT:{instrument}\r\n")
            if not error:
                self.instrument = instrument
        return rdata
    
    def get_selected_instrument(self):
        return self.instrument

    def send_test(self):
        self.send_instrument("#Euro50")
        self.send_instrument("#ChinaA50")
        self.send_instrument("#Euro50")


if __name__ == "__main__":
    Commander().send_test()
