import os

# Prevent TensorFlow oneDNN/multi-threading SIGSEGV (Exit 139) crashes on CPU
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

import base64
import io
import json
import logging
from pathlib import Path
from threading import Lock
from typing import Any

import keras
import librosa
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.figure import Figure

from .layers import ClassTokenLayer, PositionalEmbedding, TransformerBlock
from .preprocess import DWSTrPreprocessor

logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path(__file__).resolve().parents[2] / "model_artifacts"

SONAR_CMAP = LinearSegmentedColormap.from_list(
    "sonarclass_deepwater", ["#070B10", "#134752", "#33D6C4"]
)


def render_spectrogram_b64(audio_bytes: bytes, config: dict[str, Any]) -> str | None:
    """Generates a log-mel spectrogram PNG encoded in base64.

    Guarantees strict figure and memory cleanup to avoid leaks under heavy traffic.
    """
    fig = None
    buf = None
    try:
        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=config["sr"], mono=True)
        mel = librosa.feature.melspectrogram(
            y=audio,
            sr=sr,
            n_fft=config["n_fft"],
            hop_length=config["hop_length"],
            n_mels=config["n_mels"],
            power=2.0,
            window="hann",
        )
        mel_db = librosa.power_to_db(mel, ref=np.max)

        fig = Figure(figsize=(10, 2.4), dpi=100)
        _ = FigureCanvasAgg(fig)
        ax = fig.add_axes([0, 0, 1, 1])
        ax.imshow(mel_db, aspect="auto", origin="lower", cmap=SONAR_CMAP)
        ax.axis("off")

        buf = io.BytesIO()
        fig.savefig(
            buf, format="png", facecolor="#070B10", bbox_inches="tight", pad_inches=0
        )
        buf.seek(0)
        return base64.b64encode(buf.read()).decode("ascii")
    except (
        librosa.util.exceptions.ParameterError,
        ValueError,
        OSError,
        RuntimeError,
    ) as err:
        logger.warning("Spectrogram rendering failed: %s", err)
        return None
    finally:
        if buf:
            buf.close()
        if fig:
            fig.clear()
            plt.close(fig)


class DWSTrService:
    """Production inference engine for the DWSTr model."""

    def __init__(self, artifact_dir: Path = ARTIFACT_DIR) -> None:
        self.artifact_dir = artifact_dir
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Loads preprocess config, class map, compiled Keras model, and performs warmup."""
        config_path = self.artifact_dir / "preprocess_config.json"
        class_path = self.artifact_dir / "class_names.json"
        model_path = self.artifact_dir / "dwstr_best_model.keras"

        if not (config_path.exists() and class_path.exists() and model_path.exists()):
            raise FileNotFoundError(
                f"Required model artifacts are missing from {self.artifact_dir}"
            )

        with open(config_path, "r", encoding="utf-8") as f:
            self.config: dict[str, Any] = json.load(f)

        with open(class_path, "r", encoding="utf-8") as f:
            self.class_names: list[str] = json.load(f)

        self.model = keras.models.load_model(
            model_path,
            custom_objects={
                "TransformerBlock": TransformerBlock,
                "ClassTokenLayer": ClassTokenLayer,
                "PositionalEmbedding": PositionalEmbedding,
            },
            safe_mode=False,
        )
        self.preprocessor = DWSTrPreprocessor(self.config)

        # Warm up graph execution and custom layers at startup to prevent dynamic building segfaults
        try:
            raw_shape = self.model.input_shape
            dummy_shape = (1,) + tuple(dim for dim in raw_shape[1:] if dim is not None)
            dummy_tensor = tf.zeros(dummy_shape, dtype=tf.float32)
            with tf.device("/CPU:0"):
                _ = self.model(dummy_tensor, training=False)
            logger.info("Model warmup pass completed successfully.")
        except Exception as err:
            logger.warning("Model warmup pass failed: %s", err)

        logger.info("DWSTrService model and preprocessor loaded successfully.")

    def predict(self, audio_bytes: bytes) -> dict[str, Any]:
        """Runs preprocessing, tensor evaluation, and timeline formatting."""
        segments, duration = self.preprocessor.process_bytes(audio_bytes)

        # Direct functional forward pass avoids Keras predict thread-pool overhead/SIGSEGV
        with tf.device("/CPU:0"):
            segments_tensor = tf.convert_to_tensor(segments, dtype=tf.float32)
            probs_tensor = self.model(segments_tensor, training=False)
            probs = (
                probs_tensor.numpy()
                if hasattr(probs_tensor, "numpy")
                else np.asarray(probs_tensor)
            )

        mean_probs = probs.mean(axis=0)
        top_idx = int(np.argmax(mean_probs))
        top_confidence = float(mean_probs[top_idx])
        segment_labels = probs.argmax(axis=1)

        segment_duration = self.config.get("segment_duration_s", 1.0)
        timeline = [
            {
                "start_s": round(i * segment_duration, 3),
                "class": self.class_names[int(segment_labels[i])],
                "confidence": float(probs[i][segment_labels[i]]),
            }
            for i in range(len(segments))
        ]

        class_probabilities = {
            cls_name: float(mean_probs[idx])
            for idx, cls_name in enumerate(self.class_names)
        }

        spectrogram_b64 = render_spectrogram_b64(audio_bytes, self.config)

        return {
            "predicted_class": self.class_names[top_idx],
            "confidence": top_confidence,
            "duration_s": round(duration, 2),
            "num_segments": len(segments),
            "class_probabilities": class_probabilities,
            "timeline": timeline,
            "spectrogram_b64": spectrogram_b64,
        }


# Double-checked locking thread-safe singleton
_instance: DWSTrService | None = None
_lock: Lock = Lock()


def get_infer_service() -> DWSTrService:
    """Thread-safe initializer for the singleton instance."""
    global _instance
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = DWSTrService()
    return _instance
