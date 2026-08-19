import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers


class TransformerBlock(layers.Layer):
    def __init__(self, embed_dim, num_heads, mlp_dim, dropout_rate=0.3, **kwargs):
        super().__init__(**kwargs)
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.mlp_dim = mlp_dim
        self.dropout_rate = dropout_rate

        self.att = layers.MultiHeadAttention(
            num_heads=num_heads,
            key_dim=embed_dim,
            dropout=dropout_rate,
            name="multi_head_attention",
        )

        self.mlp = keras.Sequential(
            [
                layers.Dense(mlp_dim, activation="gelu"),
                layers.Dropout(dropout_rate),
                layers.Dense(embed_dim),
                layers.Dropout(dropout_rate),
            ],
            name="mlp_block",
        )

        self.layernorm1 = layers.LayerNormalization(epsilon=1e-6, name="layernorm_1")
        self.layernorm2 = layers.LayerNormalization(epsilon=1e-6, name="layernorm_2")

    def build(self, input_shape):
        self.layernorm1.build(input_shape)
        self.att.build(
            query_shape=input_shape,
            value_shape=input_shape,
            key_shape=input_shape,
        )
        self.layernorm2.build(input_shape)
        self.mlp.build(input_shape)
        super().build(input_shape)

    def call(self, inputs, training=False):
        inputs_norm = self.layernorm1(inputs)
        attn_output = self.att(
            query=inputs_norm,
            value=inputs_norm,
            key=inputs_norm,
            training=training,
        )
        x = inputs + attn_output
        x_norm = self.layernorm2(x)
        mlp_output = self.mlp(x_norm, training=training)
        return x + mlp_output

    def get_config(self):
        config = super().get_config()
        config.update(
            {
                "embed_dim": self.embed_dim,
                "num_heads": self.num_heads,
                "mlp_dim": self.mlp_dim,
                "dropout_rate": self.dropout_rate,
            }
        )
        return config


class ClassTokenLayer(layers.Layer):
    def __init__(self, projection_dim, **kwargs):
        super().__init__(**kwargs)
        self.projection_dim = projection_dim

    def build(self, input_shape):
        self.class_token = self.add_weight(
            name="class_token",
            shape=(1, 1, self.projection_dim),
            initializer="random_normal",
            trainable=True,
        )
        super().build(input_shape)

    def call(self, inputs):
        batch_size = tf.shape(inputs)[0]
        class_tokens = tf.broadcast_to(
            self.class_token, [batch_size, 1, self.projection_dim]
        )
        return tf.concat([class_tokens, inputs], axis=1)

    def get_config(self):
        config = super().get_config()
        config.update({"projection_dim": self.projection_dim})
        return config


class PositionalEmbedding(layers.Layer):
    def __init__(self, num_positions, projection_dim, **kwargs):
        super().__init__(**kwargs)
        self.num_positions = num_positions
        self.projection_dim = projection_dim
        self.position_embedding = layers.Embedding(
            input_dim=num_positions, output_dim=projection_dim
        )

    def build(self, input_shape):
        self.position_embedding.build((self.num_positions,))
        super().build(input_shape)

    def call(self, inputs):
        positions = tf.range(start=0, limit=self.num_positions, delta=1)
        position_embeddings = self.position_embedding(positions)
        return inputs + position_embeddings

    def get_config(self):
        config = super().get_config()
        config.update(
            {
                "num_positions": self.num_positions,
                "projection_dim": self.projection_dim,
            }
        )
        return config
