import socket


class Commander():
    HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
    PORT = 23456  # Port to listen on (non-privileged ports are > 1023)

    def __init__(self):
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM, protocol=0)
        self.server.connect((Commander.HOST, Commander.PORT))

    def send_receive(self, data):
        self.server.sendall(data)
        data = self.server.recv(1024)
        return data
