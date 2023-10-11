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

        # LSTM layers
        self.lstm1 = tf.keras.layers.LSTM(units, return_sequences=True, return_state=True)
        self.lstm2 = tf.keras.layers.LSTM(units, return_sequences=True, return_state=True)

        # Output layer
        self.dense_output = tf.keras.layers.Dense(1)  # Output layer with 1 unit for regression

    def warmup(self, inputs):
        # LSTM layers with return_state=True
        x, *states = self.lstm1(inputs)
        x, *states = self.lstm2(x)

        # Output layer
        prediction = self.dense_output(x)
        return prediction, states

    def call(self, inputs, training=None):
        predictions = []
        prediction, states = self.warmup(inputs)
        predictions.append(prediction)

        for n in range(1, self.out_steps):
            x, *states = self.lstm1((prediction), initial_state=states)
            x, *states = self.lstm2(x, initial_state=states)

            prediction = self.dense_output(x)
            predictions.append(prediction)

        predictions = tf.concat(predictions, axis=1)
        return predictions


feedback_model = FeedBack(units=100, out_steps=10)  # You can adjust units as needed
# Compile the model
feedback_model.compile(optimizer='adam', loss='mse')



# Generate a simple time series
np.random.seed(0)
timesteps = np.arange(0, 100, 0.1)
data = np.sin(timesteps) + np.random.normal(0, 0.1, len(timesteps))

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