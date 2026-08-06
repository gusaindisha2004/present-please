from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.auth import CurrentUser, get_current_user
from app.core.supabase_client import get_service_client
from app.pipelines.voice_pipeline import VoicePipelineError, get_voice_embedding

router = APIRouter(prefix="/api/voice", tags=["voice"])


def _require_student(user: CurrentUser) -> None:
    if user.role != "student":
        raise HTTPException(403, "This is only available to students")


@router.get("/status")
def voice_status(user: CurrentUser = Depends(get_current_user)):
    _require_student(user)
    client = get_service_client()

    rows = (
        client.table("student_voices")
        .select("id, created_at")
        .eq("student_id", user.id)
        .execute()
        .data
    )

    return {"enrolled": len(rows) > 0, "created_at": rows[0]["created_at"] if rows else None}


@router.post("/enroll")
async def enroll_voice(
    file: UploadFile = File(...), user: CurrentUser = Depends(get_current_user)
):
    _require_student(user)

    data = await file.read()
    try:
        embedding = get_voice_embedding(data)
    except VoicePipelineError as e:
        raise HTTPException(422, str(e)) from e

    client = get_service_client()

    # One active voice profile per student — same semantics as the
    # original app's single voice_embedding column, just in its own table.
    client.table("student_voices").delete().eq("student_id", user.id).execute()
    client.table("student_voices").insert(
        {"student_id": user.id, "embedding": embedding}
    ).execute()

    return {"enrolled": True}


@router.delete("")
def delete_voice(user: CurrentUser = Depends(get_current_user)):
    _require_student(user)
    client = get_service_client()
    client.table("student_voices").delete().eq("student_id", user.id).execute()
    return {"deleted": True}
