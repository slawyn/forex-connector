import os
import datetime

import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import tensorflow as tf
from keras.callbacks import EarlyStopping


num_features = 1
sequence_length = 10
split_ratio = 0.8
epochs = 500
prediction_horizon = 5
lstm_units = 100

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

class FeedBack(tf.keras.Model):
  def __init__(self, units, out_steps):
    super().__init__()
    self.out_steps = out_steps
    self.units = units
    self.lstm_cell = tf.keras.layers.LSTMCell(units)
    # Also wrap the LSTMCell in an RNN to simplify the `warmup` method.
    self.lstm_rnn = tf.keras.layers.RNN(self.lstm_cell, return_state=True)
    self.dense = tf.keras.layers.Dense(num_features)
  def warmup(self, inputs):
    # inputs.shape => (batch, time, features)
    # x.shape => (batch, lstm_units)
    x, *state = self.lstm_rnn(inputs)

    # predictions.shape => (batch, features)
    prediction = self.dense(x)
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
      # Convert the lstm output to a prediction.
      prediction = self.dense(x)
      # Add the prediction to the output.
      predictions.append(prediction)

    # predictions.shape => (time, batch, features)
    predictions = tf.stack(predictions)
    # predictions.shape => (batch, time, features)
    predictions = tf.transpose(predictions, [1, 0, 2])
    return predictions


feedback_model = FeedBack(units=lstm_units, out_steps=prediction_horizon)  # You can adjust units as needed
# Compile the model
feedback_model.compile(optimizer='adam', loss='mean_squared_error')



# Generate a simple time series represented by a sine wave
timesteps = np.arange(0, 10, 0.1)
data = np.sin(timesteps)

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
X_train, X_test = X[:split_index], X[split_index:]
y_train, y_test = y[:split_index], y[split_index:]

# Reshape input data for the model
X_train = X_train.reshape(X_train.shape[0], sequence_length, num_features)
X_test = X_test.reshape(X_test.shape[0], sequence_length, num_features)

# Train the model
# Create an EarlyStopping callback
early_stopping = EarlyStopping(monitor='val_loss',  # Monitor the validation loss
                               patience=5,
                               # Number of epochs with no improvement after which training will be stopped
                               restore_best_weights=True)  # Restore the best weights when stopped
history = feedback_model.fit(X_train, y_train,
                   epochs=epochs, batch_size=32,
                   validation_data=(X_test, y_test),
                    callbacks=[early_stopping])
visualize_loss(history, "Training and Validation Loss")

# Make predictions for the next 10 time steps
input_sequence = X_test[0].reshape(1, sequence_length, num_features)
predictions = feedback_model.predict(input_sequence).reshape(-1)  # Reshape predictions to 1D array

# Extract the last element of each series in X_train and X_test
last_elements_train = X_train[:, -1, 0]
last_elements_test = X_test[:, -1, 0]

# Create a time axis for the entire plot
time_axis_train = np.arange(len(X_train))
time_axis_test = np.arange(len(X_train), len(X_train) + len(last_elements_test))
time_axis_predictions = np.arange(len(X_train), len(X_train) + prediction_horizon)

# Plot training data, testing data (last elements), and predictions together
plt.figure(figsize=(12, 6))
plt.plot(time_axis_train, last_elements_train, 'b-', label='Training Data')
plt.plot(time_axis_test, last_elements_test, 'r-', label='Testing Data (Last Element)')
plt.plot(time_axis_predictions, predictions, 'g-', label='Predictions')
plt.xlabel('Time Step')
plt.ylabel('Value')
plt.legend()
plt.title('Training Data, Testing Data (Last Element), and Predictions')
plt.grid(True)

plt.show()

