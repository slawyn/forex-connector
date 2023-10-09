import numpy as np
import matplotlib.pyplot as plt

# Generate a simple time series with random fluctuations
np.random.seed(0)
timesteps = np.arange(0, 100, 1)
data = np.random.normal(0, 0.1, len(timesteps))  # Gaussian noise

# Plot the time series
plt.figure(figsize=(10, 6))
plt.plot(timesteps, data, 'b-', label='Time Series')
plt.xlabel('Time')
plt.ylabel('Value')
plt.legend()
plt.title('Simple Time Series with Random Fluctuations')
plt.grid(True)
plt.show()





# Generate a simple time series with a trend and seasonality
np.random.seed(0)
timesteps = np.arange(0, 200, 1)
trend = 0.02 * timesteps  # Linear trend
seasonality = 0.5 * np.sin(0.2 * timesteps)  # Seasonal component
noise = np.random.normal(0, 0.1, len(timesteps))  # Gaussian noise

# Combine trend, seasonality, and noise to create the time series
data = trend + seasonality + noise
data = seasonality
# Plot the time series
plt.figure(figsize=(10, 6))
plt.plot(timesteps, data, 'b-', label='Time Series')
plt.xlabel('Time')
plt.ylabel('Value')
plt.legend()
plt.title('Simple Time Series with Trend and Seasonality')
plt.grid(True)
plt.show()


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


# Example usage:
# Assuming 'prices' is your input time series data
window_size = 5  # Adjust the window size as needed
smoothed_prices = simple_moving_average(data, window_size)