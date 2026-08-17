import librosa
import numpy as np


class DWSTrPreprocessor:
    """Exact port of the notebook's DWSTrPreprocessor (Cell 2)."""

    # Hard ceiling on accepted clip length. librosa's mel-spectrogram extraction
    # is CPU-bound and runs synchronously inside the request handler - an
    # unbounded upload can block the event loop for other requests and blow up
    # memory (a 60s clip already produces ~800 (128,4,1) segments; there's no
    # reason a product demo needs more than this). Enforced in process_bytes()
    # BEFORE segmentation/feature extraction, not after.
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

    def process_bytes(self, audio_bytes: bytes) -> tuple[np.ndarray, float]:
        """Returns (segments array shaped (N,128,4,1), clip duration in seconds)."""
        import io

        # Stop decoding exactly 0.1s past the limit. This prevents massive memory
        # allocation and event loop blocking if a highly compressed file is uploaded.
        audio, _ = librosa.load(
            io.BytesIO(audio_bytes),
            sr=self.sr,
            mono=True,
            duration=self.MAX_DURATION_S + 0.1,
        )
        duration = len(audio) / self.sr

        # Reject oversized clips cheaply
        if duration > self.MAX_DURATION_S:
            raise ValueError(
                f"Clip exceeds the maximum supported length of "
                f"{self.MAX_DURATION_S:.0f}s. Trim the file and try again."
            )

        segments = self.segment_audio(audio)
        if not segments:
            raise ValueError("Clip too short - needs at least one 75ms segment")
        specs = np.array([self.extract_mel_spectrogram(s) for s in segments])
        return np.expand_dims(specs, -1), duration
