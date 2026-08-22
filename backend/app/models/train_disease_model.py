import os
import sys
import logging
from app.models.evaluate_dataset4_model import train_and_evaluate_dataset4, CLASSES, CropDiseaseClassifier

logger = logging.getLogger(__name__)


def train_and_save_model(epochs=8):
    """
    Trains PyTorch MobileNetV2 on Dataset 4 images, evaluates on unseen test set,
    and returns true empirical evaluation metrics.
    """
    return train_and_evaluate_dataset4(epochs=epochs)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = train_and_save_model(epochs=8)
    print("\n--- MODEL EVALUATION METRICS REPORT ---")
    for k, v in results.items():
        print(f"{k}: {v}")
