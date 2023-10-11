import numpy as np
import matplotlib.pyplot as plt
from keras.callbacks import EarlyStopping


def split_data_into_sequences(data, timesteps, sequence_length, split_ratio, num_features):
    X, y = [], []

    for i in range(len(timesteps) - sequence_length):
        X.append(data[i:i + sequence_length])
        y.append(data[i + sequence_length])

    X = np.array(X)
    y = np.array(y)

    split_index = int(split_ratio * len(X))
    split_timestamp = timesteps[split_index]
    split_index = np.searchsorted(timesteps, split_timestamp)

    X_train, X_test = X[:split_index], X[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]

    X_train = X_train.reshape(X_train.shape[0], sequence_length, num_features)
    X_test = X_test.reshape(X_test.shape[0], sequence_length, num_features)

    return X_train, X_test, y_train, y_test


def train_model(feedback_model, X_train, y_train, X_test, y_test, epochs=100):
    # Define the early stopping callback
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    )

    # Train the model
    history = feedback_model.fit(X_train, y_train, epochs=epochs, batch_size=32, validation_data=(X_test, y_test), callbacks=[early_stopping])

    # Save the trained model weights
    feedback_model.save_weights('model_weights.h5')

    # Visualize the loss
    visualize_loss(history, "Training and Validation Loss")


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


def post_process_predictions(feedback_model, X_train, y_train, X_test, y_test,
                             timesteps, sequence_length, num_features, prediction_horizon):
    # Make predictions for the next prediction_horizon time steps
    input_sequence = X_train[-1].reshape(1, sequence_length, num_features)
    predictions = feedback_model.predict(input_sequence).reshape(-1)

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