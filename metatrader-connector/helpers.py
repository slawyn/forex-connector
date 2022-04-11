import datetime
import os

import pandas as pd
from pandas.plotting import register_matplotlib_converters


import json

'''
Log function
'''
def log(s):
    print("%s ## %s"%(datetime.datetime.now().time(),s))


'''
Load Json config
'''
def loadConfig(filename):
    f = open(filename, "r")
    config = json.load(f)
    f.close()
    return config
