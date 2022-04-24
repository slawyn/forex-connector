import datetime
import time
import os
import json

import pandas as pd
from pandas.plotting import register_matplotlib_converters

DAY_MSC = 86400000
WEEK = DAY_MSC * 7
MONTH = WEEK * 4
HOURS4 = DAY_MSC/6
HOURS1 = DAY_MSC/24
MINUTES30 = DAY_MSC/48
MINUTES15 = DAY_MSC/96
MINUTES3 = HOURS1/20

'''
Date conversion function
'''
def convert_string_to_date(date):
    return datetime.datetime.fromisoformat(date)

'''
Log function
'''
def log(s):
    print("%s ## %s"%(datetime.datetime.now().time(),s))

'''
Load Json config
'''
def load_config(filename):
    f = open(filename, "r")
    config = json.load(f)
    f.close()
    return config

def time_go_back_n_weeks(date_msc, n):
    return date_msc - (n*WEEK)

def calculate_average_true_range(rates):
    atr = 0
    try:
        count = len(rates)
        c_min = rates[count-1][2]
        c_max = rates[count-1][3]
        c_close =  rates[count-1][4]
        tr = []
        for idx in range(count-2):
            max_l = rates[idx][3]
            min_l = rates[idx][3]
            abs_max = max([abs(max_l-min_l),abs(max_l-c_close),abs(min_l-c_close)])
            tr.append(abs_max)

        atr = sum(tr)/count-1
        #print(atr)
    except Exception as e:
        log(e)
    return atr



'''
Works for instruments that trade on weekdays. Not used
'''
def calculate_plot_range(start_msc, end_msc):
    TIME_FRAMES = [ ["W1",WEEK], ["MN1",MONTH], ["D1",DAY_MSC], ["H4",HOURS4], ["H1",HOURS1], ["M30",MINUTES30], ["M15",MINUTES15], ["M3",MINUTES3]]
    barcount = 110

    # Get the right amount of candles
    weekends = [5,6]
    def daterange(date1, date2):
        for n in range(int ((date2 - date1).days)+1):
            yield date1 + datetime.timedelta(n)

    # Count weekends
    weekends_inbetween = 0
    for dt in daterange(datetime.datetime.fromtimestamp ((start_msc/1000.0)), datetime.datetime.fromtimestamp ((end_msc/1000.0))):
        if dt.weekday() in weekends:
            weekends_inbetween += 1

    # Extend space by weekends
    start_msc = start_msc - (weekends_inbetween / 2.0) * DAY_MSC
    end_msc = end_msc + (weekends_inbetween / 2.0) * DAY_MSC

    difference =  end_msc - start_msc

    #orientation point: about 100 bars altogether per chart
    time_period = ""
    period_extension = 0
    for period, span in TIME_FRAMES:
        time_period = period
        approx_bar_count = (difference/span)
        if approx_bar_count > barcount/3:
            period_extension = (barcount- approx_bar_count)*span
            break

   # update new starting and ending dates
    start_date = datetime.datetime.fromtimestamp ((start_msc/1000.0))
    end_date = datetime.datetime.fromtimestamp ((end_msc/1000.0))

    somedate = start_date - datetime.timedelta(days=start_date.weekday())
    somedate = somedate.replace( hour=0, minute=0, second=0, microsecond=0)

    # Go back in time and add weekends
    restperiod_extension = period_extension*0.9-(start_date.timestamp()-somedate.timestamp())*1000
    additional_weekends = 0
    while (restperiod_extension>0):
       log("log: Backward weekends expansion starting from %s"%(str(somedate)))
       additional_weekends = additional_weekends + 1
       restperiod_extension  = restperiod_extension - DAY_MSC * 7


    # if it further back than first monday
    start_msc = start_msc - (period_extension*0.9 + additional_weekends * 2 * DAY_MSC)

    # Go forward in time and add weekends
    somedate = end_date + datetime.timedelta(4-end_date.weekday())
    somedate = somedate.replace( hour=23, minute=59, second=59, microsecond=999)

    restperiod_extension = period_extension*0.1-(somedate.timestamp()-end_date.timestamp())*1000
    additional_weekends = 0
    while (restperiod_extension>0):
       log("log: Forward weekends expansion starting from %s"%(str(somedate)))
       additional_weekends = additional_weekends + 1
       restperiod_extension  = restperiod_extension - DAY_MSC * 7

    # if it further back than first monday
    end_msc = end_msc + (period_extension*0.1 + additional_weekends * 2 * DAY_MSC)

    # if the end_msc is beyond current time, we set it to current time
    if end_msc > int(round(time.time() * 1000)):
       end_msc = int(round(time.time() * 1000))

    # Set dates for the price history
    time_start = datetime.datetime.fromtimestamp (start_msc/1000.0)
    time_stop = datetime.datetime.fromtimestamp(end_msc/1000.0)


    return time_start, time_stop, time_period
