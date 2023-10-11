import tensorflow as tf

print("Num GPUs Available: ", len(tf.config.list_physical_devices('GPU')))

# Set GPU device
physical_devices = tf.config.experimental.list_physical_devices('GPU')
if len(physical_devices) > 0:
    tf.config.experimental.set_memory_growth(physical_devices[0], True)

# Check if TensorFlow is using the CPU
if 'GPU' in tf.config.experimental.list_physical_devices():
    print("GPU is available.")
else:
    print("Running on CPU.")
