import socket
from helpers import log
import time


class Commander():
    HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
    PORT = 23456  # Port to listen on (non-privileged ports are > 1023)

    def __init__(self):
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    def connect(self):
        error = False
        try:
            self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server.connect((Commander.HOST, Commander.PORT))
            log("STATUS: Commander connected")
            time.sleep(0.2)
        except Exception as e:
            error = True
            log("ERROR: Commander failed connect")
        return error

    def disconnect(self):
        return self.server.close()

    def send_receive(self, string):
        error = False
        rdata = []
        data = bytes(string, 'ascii')
        try:
            self.server.sendall(data)
            log(f"STATUS: Commander sent {string}")
        except Exception as e:
            print(e)
            error = True
            log(f"ERROR: Commander failed {string}")

        return rdata, error

    def ping(self):
        rdata, error = self.send_receive("\r\n")
        if error:
            error = self.connect()
        return error

    def send_instrument(self, instrument):
        rdata = []
        if not self.ping():
            rdata, error = self.send_receive(f"INSTRUMENT:{instrument}\r\n")
        return rdata

    def send_test(self):
        self.send_instrument("#Euro50")
        self.send_instrument("#ChinaA50")
        self.send_instrument("#Euro50")


if __name__ == "__main__":
    Commander().send_test()
