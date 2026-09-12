import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.pipelines.face_pipeline import get_trained_model, load_dlib_models
from app.pipelines.voice_pipeline import load_voice_encoder
from app.routers import attendance, face, health, subjects, voice

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Warm up the heavy ML models at startup rather than on the first
    # request — dlib's shape predictor and the voice encoder are slow to
    # load from disk.
    #
    # None of this is allowed to stop the app from starting. Warm-up is
    # only an optimization: every step here is also done lazily on first
    # use, and get_trained_model() in particular needs Supabase — so an
    # unreachable database at boot (a network blip, or a paused project)
    # would otherwise kill the process instead of letting it serve
    # /health and recover by itself. Whatever fails here is logged, and
    # /health reports what actually loaded.
    for warm_up in (load_dlib_models, load_voice_encoder, get_trained_model):
        try:
            warm_up()
        except Exception:
            logger.exception("Model warm-up step '%s' failed", warm_up.__name__)
    yield


app = FastAPI(title="Present Please! API", lifespan=lifespan)

# A whole face scan is up to MAX_PHOTOS_PER_SCAN images, so this has to be
# roomy enough for that; the per-file caps in core/uploads.py are what
# actually keep a single upload honest. This is the outer sanity bound:
# multipart parsing spools the entire body to disk *before* a handler runs,
# so without it a 2 GB POST would be written out before anything could
# object. A reverse proxy or platform body limit is the real backstop.
MAX_REQUEST_BYTES = 128 * 1024 * 1024


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_REQUEST_BYTES:
        return JSONResponse(
            {"detail": "That upload is too large"},
            status_code=413,
        )
    return await call_next(request)

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
