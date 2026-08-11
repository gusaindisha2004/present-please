from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.pipelines.face_pipeline import get_trained_model, load_dlib_models
from app.pipelines.voice_pipeline import load_voice_encoder
from app.routers import attendance, face, health, subjects, voice


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Warm up the heavy ML models at startup rather than on the first
    # request — dlib's shape predictor and the voice encoder are slow to
    # load from disk.
    load_dlib_models()
    load_voice_encoder()
    get_trained_model()
    yield


app = FastAPI(title="Present Please! API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(subjects.router)
app.include_router(face.router)
app.include_router(voice.router)
app.include_router(attendance.router)
