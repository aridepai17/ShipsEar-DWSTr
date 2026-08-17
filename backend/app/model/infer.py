import os

os.environ["TF_USE_LEGACY_KERAS"] = "1"

import json
from pathlib import Path

import numpy as np
from tensorflow import keras

from .layers import ClassTokenLayer, PositionalEmbedding, TransformerBlock
from .preprocess import DWSTrPreprocessor

ARTIFACT_DIR = Path(__file__).resolve().parents[2] / "model_artifacts"


class DWSTrService:
    """Loads once at process start; reused across requests."""

    def __init__(self):
        with open(ARTIFACT_DIR / "preprocess_config.json") as f:
            self.config = json.load(f)
        with open(ARTIFACT_DIR / "class_names.json", "r") as f:
            self.class_names: list[str] = json.load(f)

        self.model = keras.models.load_model(
            ARTIFACT_DIR / "dwstr_best_model.keras",
            custom_objects={
                "TransformerBlock": TransformerBlock,
                "ClassTokenLayer": ClassTokenLayer,
                "PositionalEmbedding": PositionalEmbedding,
            },
            safe_mode=False,
        )
        self.preprocessor = DWSTrPreprocessor(self.config)

    def predict(self, audio_bytes: bytes) -> dict:
        segments, duration = self.preprocessor.process_bytes(audio_bytes)
        probs = self.model.predict(segments, batch_size=64, verbose=0)  # (N, 12)

        mean_probs = probs.mean(axis=0)
        top_idx = int(np.argmax(mean_probs))
        segment_labels = probs.argmax(axis=1)

        timeline = [
            {
                "start_s": round(i * self.config["segment_duration_s"], 3),
                "class": self.class_names[int(segment_labels[i])],
                "confidence": float(probs[i][segment_labels[i]]),
            }
            for i in range(len(segments))
        ]

        return {
            "predicted_class": self.class_names[top_idx],
            "confidence": float(mean_probs[top_idx]),
            "duration_s": round(duration, 2),
            "num_segments": len(segments),
            "class_probabilities": {
                self.class_names[i]: float(mean_probs[i])
                for i in range(len(self.class_names))
            },
            "timeline": timeline,
        }


service = DWSTrService()
