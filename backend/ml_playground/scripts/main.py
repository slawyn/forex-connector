# Python Libraries
import os
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import RobustScaler

# Self-written libraries
from helpers import split_data_into_sequences, downsample_time_series, simple_moving_average, train_model, post_process_predictions
from helpers_mt import fetch_ticks
from models import RNN_warmup_multilayer


# Define the time range for gold tick data
start_time = datetime(2023, 10, 6, 15, 0, 0)
# end_time = start_time + timedelta(hours=1)  # Extend to 2 hours for prediction
end_time = datetime(2023, 10, 6, 15, 0, 50)
down_sample_unit = 's'  # Use 's' for seconds, 'h' for hours, etc.

symbol = "GOLD"
# symbol = "BITCOIN"

sequence_length = 5
prediction_horizon = 100
num_features = 1
split_ratio = 0.8
epochs = 200

do_smoothing = True
window_size = 20  # Adjust the window size as needed
scaler_model = MinMaxScaler()

do_show_original_plot = True
do_overwrite_weight = True


def retrieve_data(symbol, start_date, end_date):
    # Fetch tick data
    ticks = fetch_ticks(symbol, start_date, end_date)
    # Extract timestamps and bid prices from the tick data
    timestamps_unix = [tick[0] for tick in ticks]
    # Convert Unix timestamps to datetime objects
    timestamps_datetime = [pd.to_datetime(ts, unit='s') for ts in timestamps_unix]
    timestamps_array = np.array(timestamps_datetime)
    prices = [tick[1] for tick in ticks]
    if do_smoothing:
        smoothed_prices = simple_moving_average(prices, window_size)
        timestamps_array = timestamps_array[window_size - 1:]

    else:
        smoothed_prices = prices

    # Convert the lists to NumPy arrays
    prices_array = np.array(smoothed_prices).reshape(-1, 1)
    # Initialize the StandardScaler
    scaler = scaler_model
    # Fit the scaler on the training data and transform both training and testing data
    prices_scaled = scaler.fit_transform(prices_array)

    return timestamps_array, prices_scaled


feedback_model = RNN_warmup_multilayer(prediction_horizon, num_features)  # You can adjust units as needed
feedback_model.build(input_shape=(None, sequence_length, num_features))  # Build the model with an input shape
# Print the model summary
feedback_model.summary()
# Compile the model
feedback_model.compile(optimizer='adam', loss='mean_squared_error')

timesteps, data = retrieve_data(symbol, start_time, end_time)
target_frequency = np.timedelta64(1, down_sample_unit)  # Use 's' for seconds, 'h' for hours, etc.
timesteps, data = downsample_time_series(timesteps, data, target_frequency)

if do_show_original_plot:
    # Plot the time series
    plt.figure(figsize=(10, 6))
    plt.plot(timesteps, data, 'b-', label='Time Series (Sine Wave)')
    plt.xlabel('Time')
    plt.ylabel('Value')
    plt.legend()
    plt.title('Simple Time Series (Sine Wave)')
    plt.grid(True)
    plt.show()

X_train, X_test, y_train, y_test = split_data_into_sequences(data, timesteps, sequence_length, split_ratio, num_features)
# Train the model
if do_overwrite_weight or not os.path.exists('model_weights.h5'):
    train_model(feedback_model, X_train, y_train, X_test, y_test, epochs=epochs)
else:
    # Load the pre-trained weights
    feedback_model.load_weights('model_weights.h5')
    print("Loaded pre-trained weights.")

# Call the function to visualize predictions
post_process_predictions(feedback_model, X_train, y_train, X_test, y_test,
                         timesteps, sequence_length, num_features, prediction_horizon)
