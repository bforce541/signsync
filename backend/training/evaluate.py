from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a trained ASL classifier.")
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--data-dir", required=True, help="Validation or test directory arranged by class.")
    parser.add_argument("--labels-path", required=True)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--report-path", default="backend/model/exports/evaluation.json")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    labels = json.loads(Path(args.labels_path).read_text(encoding="utf-8"))
    dataset = tf.keras.utils.image_dataset_from_directory(
        args.data_dir,
        labels="inferred",
        label_mode="int",
        batch_size=args.batch_size,
        image_size=(args.image_size, args.image_size),
        shuffle=False,
    )

    model = tf.keras.models.load_model(args.model_path, compile=False)
    predictions = model.predict(dataset, verbose=0)
    predicted_indices = np.argmax(predictions, axis=1)
    true_indices = np.concatenate([labels_batch.numpy() for _, labels_batch in dataset], axis=0)

    report = classification_report(true_indices, predicted_indices, target_names=labels, output_dict=True, zero_division=0)
    Path(args.report_path).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report_path).write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
