from __future__ import annotations

import argparse
import json
from pathlib import Path

import tensorflow as tf

from model_factory import available_backbones, backbone_config, build_transfer_model


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train an ASL classifier with transfer learning.")
    parser.add_argument("--data-dir", required=True, help="Directory containing 'train' and 'val' subdirectories.")
    parser.add_argument("--output-dir", default="backend/model/exports", help="Directory to write trained artifacts.")
    parser.add_argument("--backbone", default="resnet50", choices=available_backbones())
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--dropout", type=float, default=0.3)
    return parser.parse_args()


def dataset_from_directory(directory: Path, image_size: tuple[int, int], batch_size: int, shuffle: bool) -> tf.data.Dataset:
    return tf.keras.utils.image_dataset_from_directory(
        directory,
        label_mode="categorical",
        batch_size=batch_size,
        image_size=image_size,
        shuffle=shuffle,
    )


def main() -> None:
    args = parse_args()
    data_dir = Path(args.data_dir)
    train_dir = data_dir / "train"
    val_dir = data_dir / "val"
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    config = backbone_config(args.backbone)
    input_size = int(config["input_size"])
    image_size = (input_size, input_size)

    train_ds = dataset_from_directory(train_dir, image_size=image_size, batch_size=args.batch_size, shuffle=True)
    val_ds = dataset_from_directory(val_dir, image_size=image_size, batch_size=args.batch_size, shuffle=False)

    class_names = train_ds.class_names
    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(autotune)
    val_ds = val_ds.prefetch(autotune)

    model = build_transfer_model(args.backbone, num_classes=len(class_names), dropout_rate=args.dropout)

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(output_dir / f"{args.backbone}_best.keras"),
            monitor="val_accuracy",
            save_best_only=True,
        ),
    ]

    history = model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, callbacks=callbacks)

    model.save(output_dir / f"{args.backbone}_final.keras")
    with (output_dir / "labels.json").open("w", encoding="utf-8") as handle:
        json.dump(class_names, handle, indent=2)
    with (output_dir / "history.json").open("w", encoding="utf-8") as handle:
        json.dump(history.history, handle, indent=2)


if __name__ == "__main__":
    main()
