from datetime import datetime
import matplotlib.pyplot as plt
import pandas as pd
from pandas.plotting import register_matplotlib_converters

register_matplotlib_converters()
import MetaTrader5 as mt5


# Function to retrieve and plot tick data for a given currency pair
def plot_currency_pair(symbol, start_date, end_date, ax):
    # Retrieve tick data
    ticks = mt5.copy_ticks_range(symbol, start_date, end_date, mt5.COPY_TICKS_ALL)

    # Extract timestamps and prices from the tick data
    timestamps = [tick[0] for tick in ticks]
    prices = [tick[1] for tick in ticks]

    # Plot the currency pair on the specified axis
    ax.plot(timestamps, prices, label=f"{symbol} Ticks", linewidth=1)
    ax.set_title(f"{symbol} Tick Data")
    ax.set_xlabel("Timestamp")
    ax.set_ylabel("Price")
    ax.legend()
    ax.grid(True)

# mit MetaTrader 5 verbinden
if not mt5.initialize():
    print("initialize() failed")
    mt5.shutdown()

# Abfrage des Status und der Parameter der Verbindung
print(mt5.terminal_info())
# Abrufen der Version des MetaTrader 5
print(mt5.version())

# Retrieve all symbols
symbols = mt5.symbols_get()
print('Total Symbols:', len(symbols))

# Abruf aller Symbole mit RU im Namen
ru_symbols = mt5.symbols_get("*GOLD*")
print('len(*RU*): ', len(ru_symbols))
for s in ru_symbols:
    print(s.name)
print()




# Define the currency pairs and date ranges you want to plot
currency_pairs = [
    ("EURAUD", datetime(2020, 1, 28, 13), datetime(2020, 1, 28, 15)),
    ("AUDUSD", datetime(2023, 1, 27, 13), datetime(2023, 1, 27, 15)),
    ("GOLD", datetime(2023, 9, 26, 15), datetime(2023, 9, 26, 16))
]

# Create a single plot with multiple subplots
fig, axes = plt.subplots(len(currency_pairs), 1, figsize=(12, 8), sharex=False, sharey=False)

# Plot tick data for each currency pair on separate subplots
for i, pair in enumerate(currency_pairs):
    symbol, start_date, end_date = pair
    plot_currency_pair(symbol, start_date, end_date, axes[i])

# Set common x-axis label and title
plt.xlabel("Timestamp")
plt.suptitle("Combined Tick Data", y=1.02)  # Adjust the title position

# Show the combined plot
plt.tight_layout()
plt.show()