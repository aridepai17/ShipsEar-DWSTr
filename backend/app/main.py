from app.model.infer import service
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ShipsEar DWSTr API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.vercel.app"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "classes": service.class_names}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):  # noqa: B008
    if not file.filename.lower().endswith((".wav", ".mp3", ".flac", ".ogg")):
        raise HTTPException(status_code=400, detail="Unsupported file type.")
    audio_bytes = await file.read()
    try:
        # DWSTrPreprocessor.process_bytes() enforces MAX_DURATION_S (30s)
        # before any spectrogram extraction runs — an oversized clip raises
        # ValueError here and never reaches the CPU-bound librosa calls.
        return service.predict(audio_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
