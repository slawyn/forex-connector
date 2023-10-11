import numpy as np
import matplotlib.pyplot as plt
from keras.models import Sequential
from keras.layers import LSTM, Dense

# Generate a simple time series
np.random.seed(0)
timesteps = np.arange(0, 200, 0.1)
data = np.sin(timesteps) + np.random.normal(0, 0.1, len(timesteps))

# Split the time series into input and target sequences
sequence_length = 10
X, y = [], []
for i in range(len(timesteps) - sequence_length):
    X.append(data[i:i+sequence_length])
    y.append(data[i+sequence_length])

X = np.array(X)
y = np.array(y)

# Split the data into training and testing sets
split_ratio = 0.8
split_index = int(split_ratio * len(X))
X_train, X_test = X[:split_index], X[split_index:]
y_train, y_test = y[:split_index], y[split_index:]

# Build an LSTM model
model = Sequential()
model.add(LSTM(50, activation='relu', input_shape=(sequence_length, 1)))
model.add(Dense(1))
model.compile(optimizer='adam', loss='mse')

# Reshape input data for LSTM
X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)
X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

# Train the model
model.fit(X_train, y_train, epochs=50, batch_size=32)

# Initialize the input sequence with the last 10 values from the test set
input_sequence = X_test[-1].reshape(1, sequence_length, 1)

# Make predictions for the next 10 time steps
predictions = []

for _ in range(10):
    predicted_value = model.predict(input_sequence)
    predictions.append(predicted_value[0][0])
    input_sequence = np.roll(input_sequence, shift=-1, axis=1)
    input_sequence[0, -1, 0] = predicted_value[0][0]

# Plot the actual vs. predicted values for the next 10 time steps
plt.plot(np.arange(sequence_length, sequence_length + 10), y_test[-10:], 'ro-', label='Actual Values')
plt.plot(np.arange(sequence_length, sequence_length + 10), predictions, 'go-', label='Predicted Values')
plt.legend()
plt.show()
