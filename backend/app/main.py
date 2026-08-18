from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ShipsEar DWSTr API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-frontend-domain.vercel.app",
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

_service = None


def get_service():
    global _service
    if _service is None:
        from app.model.infer import service

        _service = service
    return _service


@app.get("/health")
def health():
    svc = get_service()
    return {"status": "ok", "classes": svc.class_names}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):  # noqa: B008
    if not file.filename.lower().endswith((".wav", ".mp3", ".flac", ".ogg")):
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    # Set a 10 MB hard limit (plenty of space for a 30s audio clip)
    MAX_BYTES = 10 * 1024 * 1024

    # 1. Fail fast if the stated size from the request headers is already too large
    if file.size is not None and file.size > MAX_BYTES:
        raise HTTPException(
            status_code=413, detail="File too large. Maximum allowed size is 10MB."
        )

    # 2. Read safely in chunks to prevent memory explosion if the Content-Length was spoofed
    audio_bytes = bytearray()
    while chunk := await file.read(1024 * 1024):  # Read in 1MB chunks
        audio_bytes.extend(chunk)
        if len(audio_bytes) > MAX_BYTES:
            raise HTTPException(
                status_code=413, detail="File too large. Maximum allowed size is 10MB."
            )

    try:
        return get_service().predict(bytes(audio_bytes))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError:
        raise HTTPException(
            status_code=422, detail="Invalid, corrupted, or unreadable audio file"
        )
