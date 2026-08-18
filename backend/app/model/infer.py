import base64
import io
import json
from pathlib import Path

import keras
import librosa
import matplotlib

matplotlib.use("Agg")
import numpy as np
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.figure import Figure

from .layers import ClassTokenLayer, PositionalEmbedding, TransformerBlock
from .preprocess import DWSTrPreprocessor

ARTIFACT_DIR = Path(__file__).resolve().parents[2] / "model_artifacts"

SONAR_CMAP = LinearSegmentedColormap.from_list(
    "sonarclass_deepwater", ["#070B10", "#134752", "#33D6C4"]
)


def render_spectrogram_b64(audio_bytes: bytes, config: dict) -> str | None:
    """Full-clip log-mel spectrogram as a base64 PNG, styled to match the
    frontend's dark theme. Returns None on any failure - never raises."""
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

        fig = Figure(figsize=(10, 2.4), dpi=150)
        canvas = FigureCanvasAgg(fig)
        ax = fig.add_axes([0, 0, 1, 1])
        ax.imshow(mel_db, aspect="auto", origin="lower", cmap=SONAR_CMAP)
        ax.axis("off")

        buf = io.BytesIO()
        fig.savefig(
            buf, format="png", facecolor="#070B10", bbox_inches="tight", pad_inches=0
        )
        fig.clear()
        del fig, canvas
        buf.seek(0)
        return base64.b64encode(buf.read()).decode("ascii")
    except (OSError, ValueError, RuntimeError):
        return None


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
        probs = self.model.predict(segments, batch_size=32, verbose=0)

        mean_probs = probs.mean(axis=0)
        top_idx = int(np.argmax(mean_probs))
        top_confidence = float(mean_probs[top_idx])
        segment_labels = probs.argmax(axis=1)

        timeline = [
            {
                "start_s": round(i * self.config["segment_duration_s"], 3),
                "class": self.class_names[int(segment_labels[i])],
                "confidence": float(probs[i][segment_labels[i]]),
            }
            for i in range(len(segments))
        ]

        class_probabilities = {
            self.class_names[i]: float(mean_probs[i])
            for i in range(len(self.class_names))
        }

        spectrogram_b64 = render_spectrogram_b64(audio_bytes, self.config)
        num_segments = len(segments)

        del segments, probs, mean_probs, segment_labels

        return {
            "predicted_class": self.class_names[top_idx],
            "confidence": top_confidence,
            "duration_s": round(duration, 2),
            "num_segments": num_segments,
            "class_probabilities": class_probabilities,
            "timeline": timeline,
            "spectrogram_b64": spectrogram_b64,
        }


_instance = None


def get_infer_service():
    global _instance
    if _instance is None:
        _instance = DWSTrService()
    return _instance
