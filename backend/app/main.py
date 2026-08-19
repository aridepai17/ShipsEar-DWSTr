import os

# Prevent C-level thread collisions on ARM CPU
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

import tensorflow as tf

tf.config.threading.set_inter_op_parallelism_threads(1)
tf.config.threading.set_intra_op_parallelism_threads(1)

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ShipsEar DWSTr API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://shipsear-dwstr.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_service():
    from app.model.infer import get_infer_service

    return get_infer_service()


@app.get("/health")
def health():
    svc = get_service()
    return {"status": "ok", "classes": svc.class_names}


@app.post("/predict")
def predict(file: UploadFile = File(...)):  # Synchronous def offloads to threadpool
    if not file.filename.lower().endswith((".wav", ".mp3", ".flac", ".ogg")):
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    MAX_BYTES = 10 * 1024 * 1024

    if file.size is not None and file.size > MAX_BYTES:
        raise HTTPException(
            status_code=413, detail="File too large. Maximum allowed size is 10MB."
        )

    # Synchronous file read inside threadpool
    try:
        audio_bytes = file.file.read(MAX_BYTES + 1)
        if len(audio_bytes) > MAX_BYTES:
            raise HTTPException(
                status_code=413, detail="File too large. Maximum allowed size is 10MB."
            )
        return get_service().predict(audio_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError:
        raise HTTPException(
            status_code=422, detail="Invalid, corrupted, or unreadable audio file"
        )
