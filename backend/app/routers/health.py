from fastapi import APIRouter

from app.pipelines.face_pipeline import dlib_models_loaded
from app.pipelines.voice_pipeline import voice_encoder_loaded

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok",
        "models": {
            "face": dlib_models_loaded(),
            "voice": voice_encoder_loaded(),
        },
    }
