import base64
import io
import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image, ImageOps

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("SIGNSYNC_MODEL_PATH", BASE_DIR / "model" / "asl_model.h5"))
LABELS_PATH = Path(os.getenv("SIGNSYNC_LABELS_PATH", BASE_DIR / "model" / "labels.json"))
DEFAULT_LABELS = [chr(code) for code in range(ord("A"), ord("Z") + 1)]
TARGET_SIZE = (224, 224)


@dataclass(frozen=True)
class Prediction:
    label: str
    confidence: float
    top_predictions: list[dict[str, float | str]]


def _load_labels() -> list[str]:
    if LABELS_PATH.exists():
        with LABELS_PATH.open("r", encoding="utf-8") as handle:
            labels = json.load(handle)
        if isinstance(labels, list) and labels:
            return [str(label) for label in labels]
    return DEFAULT_LABELS


@lru_cache(maxsize=1)
def get_labels() -> list[str]:
    return _load_labels()


@lru_cache(maxsize=1)
def get_model() -> tf.keras.Model:
    return tf.keras.models.load_model(MODEL_PATH, compile=False)


def _decode_data_url(image_data: str) -> bytes:
    if "," in image_data:
        _, image_data = image_data.split(",", 1)
    return base64.b64decode(image_data)


def _center_crop(image: Image.Image) -> Image.Image:
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return image.crop((left, top, left + side, top + side))


def preprocess_image(image_data: str) -> np.ndarray:
    image_bytes = _decode_data_url(image_data)
    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image).convert("RGB")
    image = _center_crop(image)
    image = ImageOps.fit(image, TARGET_SIZE, method=Image.Resampling.LANCZOS)
    image_array = np.asarray(image, dtype=np.float32) / 255.0
    return np.expand_dims(image_array, axis=0)


def predict_from_data_url(image_data: str, top_k: int = 3) -> Prediction:
    batch = preprocess_image(image_data)
    probabilities = get_model().predict(batch, verbose=0)[0]
    labels = get_labels()
    indices = np.argsort(probabilities)[::-1][:top_k]
    top_predictions = [
        {
            "label": labels[int(index)],
            "confidence": round(float(probabilities[int(index)]), 4),
        }
        for index in indices
    ]
    best_index = int(indices[0])
    return Prediction(
        label=labels[best_index],
        confidence=round(float(probabilities[best_index]), 4),
        top_predictions=top_predictions,
    )


def get_model_summary() -> dict[str, object]:
    model = get_model()
    return {
        "model_path": str(MODEL_PATH),
        "input_shape": list(model.input_shape),
        "output_shape": list(model.output_shape),
        "class_count": len(get_labels()),
        "labels": get_labels(),
    }
