import tensorflow as tf

class RNN_warmup_multilayer(tf.keras.Model):

    def __init__(self, prediction_horizon, num_features):
        lstm_units = 200

        super().__init__()
        self.out_steps = prediction_horizon
        self.units = lstm_units
        self.lstm_cell = tf.keras.layers.LSTMCell(lstm_units)
        self.lstm_rnn = tf.keras.layers.RNN(self.lstm_cell, return_state=True)
        self.dense1 = tf.keras.layers.Dense(num_features, activation='relu')
        self.dense2 = tf.keras.layers.Dense(num_features)
        self.dropout = tf.keras.layers.Dropout(rate=0.5)

    def warmup(self, inputs):
        x, *state = self.lstm_rnn(inputs)
        prediction = self.dense1(x)
        return prediction, state

    def call(self, inputs, training=None):
        predictions = []
        prediction, state = self.warmup(inputs)
        predictions.append(prediction)

        for n in range(1, self.out_steps):
            x = prediction
            x, state = self.lstm_cell(x, states=state, training=training)
            x = self.dense1(x)
            prediction = self.dense2(x)
            predictions.append(prediction)

        predictions = tf.stack(predictions)
        predictions = tf.transpose(predictions, [1, 0, 2])
        return predictions


class RNN_warmup_singlelayer(tf.keras.Model):

    def __init__(self, prediction_horizon, num_features):
        lstm_units = 200

        super().__init__()
        self.out_steps = prediction_horizon
        self.units = lstm_units
        self.lstm_cell = tf.keras.layers.LSTMCell(lstm_units)
        self.lstm_rnn = tf.keras.layers.RNN(self.lstm_cell, return_state=True)
        self.dense = tf.keras.layers.Dense(num_features, activation='relu')

    def warmup(self, inputs):
        x, *state = self.lstm_rnn(inputs)
        prediction = self.dense(x)
        return prediction, state

    def call(self, inputs, training=None):
        # Use a TensorArray to capture dynamically unrolled outputs.
        predictions = []
        # Initialize the LSTM state.
        prediction, state = self.warmup(inputs)
        # Insert the first prediction.
        predictions.append(prediction)

        for n in range(1, self.out_steps):
            # Use the last prediction as input.
            x = prediction
            # Execute one lstm step.
            x, state = self.lstm_cell(x, states=state, training=training)
            # Convert the lstm output to a prediction.
            prediction = self.dense(x)
            # Add the prediction to the output.
            predictions.append(prediction)

        # predictions.shape => (time, batch, features)
        predictions = tf.stack(predictions)
        # predictions.shape => (batch, time, features)
        predictions = tf.transpose(predictions, [1, 0, 2])
        return predictions