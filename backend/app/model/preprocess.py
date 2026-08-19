import io

import librosa
import numpy as np


class DWSTrPreprocessor:
    """Exact port of the notebook's DWSTrPreprocessor (Cell 2)."""

    MAX_DURATION_S = 30.0

    def __init__(self, config: dict):
        self.sr = config["sr"]
        self.segment_samples = config["segment_samples"]
        self.n_fft = config["n_fft"]
        self.hop_length = config["hop_length"]
        self.n_mels = config["n_mels"]
        self.expected_frames = config["expected_frames"]
        self.preemphasis_coef = config["preemphasis_coef"]

    def preemphasis(self, audio: np.ndarray) -> np.ndarray:
        return np.append(audio[0], audio[1:] - self.preemphasis_coef * audio[:-1])

    def segment_audio(self, audio: np.ndarray) -> list[np.ndarray]:
        segments = []
        for start in range(
            0, len(audio) - self.segment_samples + 1, self.segment_samples
        ):
            seg = audio[start : start + self.segment_samples]
            if len(seg) == self.segment_samples:
                segments.append(seg)

        return segments

    def extract_mel_spectrogram(self, segment: np.ndarray) -> np.ndarray:
        emphasized = self.preemphasis(segment)
        mel = librosa.feature.melspectrogram(
            y=emphasized,
            sr=self.sr,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            n_mels=self.n_mels,
            power=2.0,
            window="hann",
        )
        mel_db = librosa.power_to_db(mel, ref=np.max)
        if mel_db.shape[1] != self.expected_frames:
            if mel_db.shape[1] < self.expected_frames:
                pad = self.expected_frames - mel_db.shape[-1]
                mel_db = np.pad(mel_db, ((0, 0), (0, pad)), mode="edge")
            else:
                mel_db = mel_db[:, : self.expected_frames]

        return mel_db

    def process_bytes(self, audio_bytes: bytes) -> tuple[np.ndarray, float, np.ndarray]:
        """Returns (segments array shaped (N,128,4,1), clip duration in seconds, decoded audio vector)."""
        audio, _ = librosa.load(
            io.BytesIO(audio_bytes),
            sr=self.sr,
            mono=True,
            duration=self.MAX_DURATION_S + 0.1,
        )
        duration = len(audio) / self.sr

        if duration > self.MAX_DURATION_S:
            raise ValueError(
                f"Clip exceeds maximum supported length of "
                f"{self.MAX_DURATION_S:.0f}s. Trim the file and try again."
            )

        segments = self.segment_audio(audio)
        if not segments:
            raise ValueError("Clip too short - needs at least one 75ms segment")
        specs = np.array([self.extract_mel_spectrogram(s) for s in segments])
        return np.expand_dims(specs, -1), duration, audio
