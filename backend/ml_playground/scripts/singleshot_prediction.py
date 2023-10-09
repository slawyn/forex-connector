import numpy as np
import matplotlib.pyplot as plt
from keras.models import Sequential
from keras.layers import LSTM, Dense

# Generate a simple time series
np.random.seed(0)
timesteps = np.arange(0, 100, 0.1)
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

# Evaluate the model
loss = model.evaluate(X_test, y_test)
print(f'Test Loss: {loss}')

# Make a single-shot prediction
input_sequence = X_test[0].reshape(1, sequence_length, 1)
predicted_value = model.predict(input_sequence)
print(f'Predicted Value: {predicted_value[0][0]}')
print(f'Actual Value: {y_test[0]}')

# Plot the actual vs. predicted values
plt.plot(np.arange(0, sequence_length), input_sequence[0], label='Input Sequence')
plt.plot(sequence_length, y_test[0], 'ro', label='Actual Value')
plt.plot(sequence_length, predicted_value[0][0], 'go', label='Predicted Value')
plt.legend()
plt.show()
