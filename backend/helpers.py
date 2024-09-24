import datetime
import time
import json


DAY_MSC = 86400000
WEEK = DAY_MSC * 7
MONTH = WEEK * 4
HOURS4 = DAY_MSC/6
HOURS1 = DAY_MSC/24
MINUTES30 = DAY_MSC/48
MINUTES15 = DAY_MSC/96
MINUTES3 = HOURS1/20


def log(*s):
    """Log function"""
    out = ""
    for _s in s:
        out += str(_s)
    print("%s ## %s" % (datetime.datetime.now().time(), out))


def load_json(filename):
    """Load Json config"""
    with open(filename, "r") as f:
        config = json.load(f)

    return config


def is_it_true(value):
    return value.lower() == 'true'


def time_go_back_n_weeks(date_msc, n):
    return date_msc - (n*WEEK)


def time_get_n_days_in_seconds(n):
    return DAY_MSC*n/1000


def get_current_date():
    return datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")


def convert_date_to_timestamp_ms(date):
    return datetime.datetime.strptime(date, '%Y-%m-%dT%H:%M:%S.%f%z').timestamp()*1000


def local_now():
    return datetime.datetime.now()


def local_timestamp():
    return datetime.datetime.now().timestamp()


def utc_now():
    return datetime.datetime.utcnow()


def utc_convert_to_utc(timestamp_s):
    return datetime.datetime.utcfromtimestamp(timestamp_s)


def convert_timestamp_to_date(timestamp_s, offset=0):
    return datetime.datetime.fromtimestamp(timestamp_s + offset)


def convert_string_to_date(date):
    return datetime.datetime.fromisoformat(date)
