from __future__ import annotations

from collections.abc import Callable

import tensorflow as tf


BackboneBuilder = Callable[..., tf.keras.Model]


BACKBONES: dict[str, dict[str, object]] = {
    "mobilenetv2": {
        "builder": tf.keras.applications.MobileNetV2,
        "preprocess": tf.keras.applications.mobilenet_v2.preprocess_input,
        "input_size": 224,
    },
    "resnet50": {
        "builder": tf.keras.applications.ResNet50,
        "preprocess": tf.keras.applications.resnet.preprocess_input,
        "input_size": 224,
    },
    "vgg16": {
        "builder": tf.keras.applications.VGG16,
        "preprocess": tf.keras.applications.vgg16.preprocess_input,
        "input_size": 224,
    },
    "inceptionv3": {
        "builder": tf.keras.applications.InceptionV3,
        "preprocess": tf.keras.applications.inception_v3.preprocess_input,
        "input_size": 299,
    },
}


def available_backbones() -> list[str]:
    return sorted(BACKBONES)


def backbone_config(name: str) -> dict[str, object]:
    normalized = name.lower()
    if normalized not in BACKBONES:
        raise ValueError(f"Unsupported backbone '{name}'. Choose from: {', '.join(available_backbones())}")
    return BACKBONES[normalized]


def build_transfer_model(name: str, num_classes: int, dropout_rate: float = 0.3) -> tf.keras.Model:
    config = backbone_config(name)
    input_size = int(config["input_size"])
    builder = config["builder"]
    preprocess = config["preprocess"]

    inputs = tf.keras.Input(shape=(input_size, input_size, 3), name="image")
    x = tf.keras.layers.Lambda(preprocess, name="preprocess")(inputs)
    base_model = builder(include_top=False, weights="imagenet", input_tensor=x, pooling="avg")
    base_model.trainable = False

    head = tf.keras.layers.Dense(256, activation="relu", name="projection")(base_model.output)
    head = tf.keras.layers.Dropout(dropout_rate, name="dropout")(head)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="classifier")(head)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name=f"signsync_{name.lower()}")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model
