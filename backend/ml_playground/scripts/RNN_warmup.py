import os
import datetime

import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import tensorflow as tf

num_features = 1
sequence_length = 10
split_ratio = 0.8


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


feedback_model = FeedBack(units=100, out_steps=10)  # You can adjust units as needed
# Compile the model
feedback_model.compile(optimizer='adam', loss='mse')



# Generate a simple time series
np.random.seed(0)
timesteps = np.arange(0, 400, 0.05)
data = np.sin(timesteps) + np.random.normal(0, 0.05, len(timesteps))

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
feedback_model.fit(X_train, y_train, epochs=50, batch_size=32)

# Make predictions for the next 10 time steps
input_sequence = X_test[0].reshape(1, sequence_length, num_features)
predictions = feedback_model.predict(input_sequence).reshape(-1)  # Reshape predictions to 1D array

# Extract the true values for the next 10 time steps
true_values = y_test[0:10]

# Create a time axis for the next 10 time steps
time_axis = np.arange(sequence_length, sequence_length + 10)

# Plot the actual vs. predicted values
plt.figure(figsize=(10, 6))
plt.plot(time_axis, true_values, 'ro-', label='True Values')
plt.plot(time_axis, predictions, 'go-', label='Predictions')
plt.xlabel('Time Step')
plt.ylabel('Value')
plt.legend()
plt.title('Actual vs. Predicted Values for Next 10 Time Steps')
plt.grid(True)
plt.show()