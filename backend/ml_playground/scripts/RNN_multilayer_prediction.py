import os
from datetime import datetime, timedelta

import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import tensorflow as tf
from keras.callbacks import EarlyStopping
import MetaTrader5 as mt5
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import RobustScaler


num_features = 1
sequence_length = 5
split_ratio = 0.8
epochs = 200
prediction_horizon = 200
lstm_units = 200

do_smoothing = True
window_size = 20  # Adjust the window size as needed
scaler_model = MinMaxScaler()

do_show_original_plot = True
do_overwrite_weight = True


# Define the time range for gold tick data
start_time = datetime(2023, 10, 6, 15, 0, 0)
# end_time = start_time + timedelta(hours=1)  # Extend to 2 hours for prediction
end_time = datetime(2023, 10, 6, 15, 0, 50)
down_sample_unit = 's'  # Use 's' for seconds, 'h' for hours, etc.

symbol = "GOLD"
#symbol = "BITCOIN"



def downsample_time_series(timestamps, data, target_frequency):
    """
    Downsample a time series to a lower target frequency.

    Parameters:
    - timestamps: List of timestamps for the original data.
    - data: List of data values associated with timestamps.
    - target_frequency: Target frequency (e.g., 1 data point per second).

    Returns:
    - downsampled_timestamps: List of downsampled timestamps.
    - downsampled_data: List of downsampled data values.
    """
    # Convert timestamps to NumPy array
    timestamps = np.array(timestamps)

    # Calculate the time difference between consecutive timestamps
    time_diff = np.diff(timestamps)

    # Find indices where the time difference is greater than or equal to the target frequency
    target_indices = np.where(time_diff >= target_frequency)[0] + 1

    # Include the first data point
    target_indices = np.insert(target_indices, 0, 0)

    # Extract the downsampled timestamps and data
    downsampled_timestamps = timestamps[target_indices]
    downsampled_data = data[target_indices]

    return downsampled_timestamps, downsampled_data

def simple_moving_average(data, window_size):
    """
    Perform Simple Moving Average (SMA) smoothing on the input data.

    Parameters:
    - data: NumPy array of the time series data.
    - window_size: Size of the moving average window.

    Returns:
    - smoothed_data: NumPy array of the smoothed data.
    """
    cumsum = np.cumsum(data, dtype=float)
    cumsum[window_size:] = cumsum[window_size:] - cumsum[:-window_size]
    smoothed_data = cumsum[window_size - 1:] / window_size
    return smoothed_data

def visualize_loss(history, title):
    loss = history.history["loss"]
    val_loss = history.history["val_loss"]
    epochs = range(len(loss))
    plt.figure()
    plt.plot(epochs, loss, "b", label="Training loss")
    plt.plot(epochs, val_loss, "r", label="Validation loss")
    plt.title(title)
    plt.xlabel("Epochs")
    plt.ylabel("Loss")
    plt.legend()
    plt.show()

def initialize_mt5():
    # Connect to MetaTrader 5
    if not mt5.initialize():
        print("MetaTrader 5 initialization failed")
        return False
    return True
def disconnect_mt5():
    # Disconnect from MetaTrader 5
    mt5.shutdown()


def fetch_ticks(symbol, start_date, end_date):
    if not initialize_mt5():
        return None

    # Retrieve symbol tick data for the specified time range
    ticks = mt5.copy_ticks_range(symbol, start_date, end_date, mt5.COPY_TICKS_ALL)

    disconnect_mt5()

    return ticks


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

class FeedBack(tf.keras.Model):
  def __init__(self, units, out_steps):
    super().__init__()
    self.out_steps = out_steps
    self.units = units
    self.lstm_cell = tf.keras.layers.LSTMCell(units)
    # Also wrap the LSTMCell in an RNN to simplify the `warmup` method.
    self.lstm_rnn = tf.keras.layers.RNN(self.lstm_cell, return_state=True)
    self.dense1 = tf.keras.layers.Dense(num_features, activation='relu')  # Extra dense layer
    self.dense2 = tf.keras.layers.Dense(num_features)
    self.dropout = tf.keras.layers.Dropout(rate=0.5)  # Add dropout layer

  def warmup(self, inputs):
    # inputs.shape => (batch, time, features)
    # x.shape => (batch, lstm_units)
    x, *state = self.lstm_rnn(inputs)

    # predictions.shape => (batch, features)
    prediction = self.dense1(x)  # Pass through the extra dense layer
    return prediction, state

  def call(self, inputs, training=None):
    # Use a TensorArray to capture dynamically unrolled outputs.
    predictions = []
    # Initialize the LSTM state.
    prediction, state = self.warmup(inputs)

    # Insert the first prediction.
    predictions.append(prediction)

    # Run the rest of the prediction steps.
    for n in range(1, self.out_steps):
      # Use the last prediction as input.
      x = prediction
      # Execute one lstm step.
      x, state = self.lstm_cell(x, states=state,
                                training=training)
      # x = self.dropout(x)
      # Pass through the extra dense layer.
      x = self.dense1(x)
      # Convert the lstm output to a prediction.
      prediction = self.dense2(x)
      # Add the prediction to the output.
      predictions.append(prediction)

    # predictions.shape => (time, batch, features)
    predictions = tf.stack(predictions)
    # predictions.shape => (batch, time, features)
    predictions = tf.transpose(predictions, [1, 0, 2])
    return predictions


feedback_model = FeedBack(units=lstm_units, out_steps=prediction_horizon)  # You can adjust units as needed
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

# Split the time series into input and target sequences
X, y = [], []
for i in range(len(timesteps) - sequence_length):
    X.append(data[i:i+sequence_length])
    y.append(data[i+sequence_length])

X = np.array(X)
y = np.array(y)

# Split the data into training and testing sets
split_index = int(split_ratio * len(X))
# Calculate the split index based on a specific timestamp
split_timestamp = timesteps[split_index]  # Use your desired split point
split_index = np.searchsorted(timesteps, split_timestamp)

X_train, X_test = X[:split_index], X[split_index:]
y_train, y_test = y[:split_index], y[split_index:]

# Reshape input data for the model
X_train = X_train.reshape(X_train.shape[0], sequence_length, num_features)
X_test = X_test.reshape(X_test.shape[0], sequence_length, num_features)

# Train the model
# Create an EarlyStopping callback
if do_overwrite_weight or not os.path.exists('lstm_model_weights.h5'):
    early_stopping = EarlyStopping(monitor='val_loss',  # Monitor the validation loss
                                   patience=10,
                                   # Number of epochs with no improvement after which training will be stopped
                                   restore_best_weights=True)  # Restore the best weights when stopped
    history = feedback_model.fit(X_train, y_train,
                       epochs=epochs, batch_size=32,
                       validation_data=(X_test, y_test),
                        callbacks=[early_stopping])
    # Save the trained model weights
    feedback_model.save_weights('lstm_model_weights.h5')
    visualize_loss(history, "Training and Validation Loss")
else:
    # Load the pre-trained weights
    feedback_model.load_weights('lstm_model_weights.h5')
    print("Loaded pre-trained weights.")

# Make predictions for the next 10 time steps
input_sequence = X_train[-1].reshape(1, sequence_length, num_features)
predictions = feedback_model.predict(input_sequence).reshape(-1)  # Reshape predictions to 1D array

# Plot training data, testing data (last elements), and predictions together
# Plot training data, testing data (last elements), and predictions together
plt.figure(figsize=(12, 6))
plt.plot(timesteps[:len(y_train)], y_train, 'b-', label='Training Data')
plt.plot(timesteps[len(y_train):len(y_train) + len(y_test)], y_test, 'r-', label='Testing Data')
# Calculate the last timestamp in the original data
last_timestamp = timesteps[len(y_train)]
# Calculate the time interval (time_step) between data points
time_step = timesteps[1] - timesteps[0]
# Calculate the extended timesteps based on prediction_horizon
extended_timesteps = np.arange(last_timestamp, last_timestamp + (prediction_horizon) * time_step, time_step)
# Plot the extended predictions
plt.plot(extended_timesteps, predictions, 'g-', label='Predictions')

plt.xlabel('Time')
plt.ylabel('Value')
plt.legend()
plt.title('Training Data, Testing Data, and Predictions')
plt.grid(True)
plt.xticks(rotation=45)  # Rotate x-axis labels for better readability
plt.tight_layout()
plt.show()

plt.show()

