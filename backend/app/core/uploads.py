from fastapi import HTTPException, UploadFile

# Generous enough for a phone photo or a few minutes of roll-call audio,
# small enough that one request can't eat the instance's memory. The audio
# cap is the larger of the two because the browser sends uncompressed WAV
# (see frontend/src/lib/audio.ts) — roughly 10 MB per minute of stereo.
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_AUDIO_BYTES = 30 * 1024 * 1024


async def read_upload(upload: UploadFile, max_bytes: int) -> bytes:
    """Read an upload into memory, refusing anything over the cap.

    Reads one byte past the limit rather than trusting a client-supplied
    Content-Length, so an oversized body is rejected having buffered only
    max_bytes + 1. This matters most for /api/face/identify, which is
    unauthenticated by design — without a cap, anyone could post an
    arbitrarily large body and exhaust memory for free.
    """
    data = await upload.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(
            413,
            f"{upload.filename or 'That file'} is too large — "
            f"{max_bytes // (1024 * 1024)} MB is the limit",
        )
    return data
