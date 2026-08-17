from pydantic import BaseModel, ConfigDict, Field


class TimelineEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    start_s: float
    predicted_class: str = Field(alias="class")
    confidence: float


class PredictResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    predicted_class: str
    confidence: float
    duration_s: float
    num_segments: int
    class_probabilities: dict[str, float]
    timeline: list[TimelineEntry]
    spectrogram_b64: str | None = None
