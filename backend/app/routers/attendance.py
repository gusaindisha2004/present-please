from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.auth import CurrentUser, get_current_user
from app.core.config import settings
from app.core.image_utils import load_image_as_array
from app.core.supabase_client import get_service_client
from app.core.uploads import MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, read_upload
from app.pipelines.face_pipeline import get_face_embeddings, get_trained_model_for_students, match_encodings
from app.pipelines.voice_pipeline import VoicePipelineError, process_bulk_audio

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

MAX_PHOTOS_PER_SCAN = 10


def _owned_subject_roster(client, subject_id: str, user: CurrentUser) -> dict[str, str]:
    """Verifies the subject exists and belongs to this teacher, then returns
    its enrolled students as {student_id: full_name}. Raises 404 otherwise —
    shared by every attendance scan endpoint."""
    subject_response = (
        client.table("subjects")
        .select("id, teacher_id")
        .eq("id", subject_id)
        .maybe_single()
        .execute()
    )
    subject = subject_response.data if subject_response else None
    if not subject or subject["teacher_id"] != user.id:
        raise HTTPException(404, "Subject not found")

    enrollments = (
        client.table("enrollments")
        .select("student_id")
        .eq("subject_id", subject_id)
        .execute()
        .data
    )
    student_ids = [row["student_id"] for row in enrollments]
    if not student_ids:
        return {}

    profiles = (
        client.table("profiles")
        .select("id, full_name")
        .in_("id", student_ids)
        .execute()
        .data
    )
    return {p["id"]: p["full_name"] for p in profiles}


@router.post("/face/scan")
async def scan_face_attendance(
    subject_id: str = Form(...),
    files: list[UploadFile] = File(...),
    user: CurrentUser = Depends(get_current_user),
):
    """Runs face matching against one subject's enrolled students and
    returns a draft roster. Saves nothing — the teacher reviews and
    confirms before anything is written to attendance_sessions/records."""
    if user.role != "teacher":
        raise HTTPException(403, "This is only available to teachers")

    if not files:
        raise HTTPException(400, "Upload at least one photo")
    if len(files) > MAX_PHOTOS_PER_SCAN:
        raise HTTPException(400, f"Upload at most {MAX_PHOTOS_PER_SCAN} photos at a time")

    client = get_service_client()
    roster = _owned_subject_roster(client, subject_id, user)
    student_ids = list(roster.keys())

    model_data = get_trained_model_for_students(student_ids)

    best_matches: dict[str, dict] = {}
    unmatched_faces = 0

    for photo_index, upload in enumerate(files):
        data = await read_upload(upload, MAX_IMAGE_BYTES)
        image_np = load_image_as_array(data)
        encodings = get_face_embeddings(image_np)
        matches = match_encodings(encodings, model_data, settings.face_match_threshold)

        for match in matches:
            if match is None:
                unmatched_faces += 1
                continue

            student_id, distance = match
            confidence = round(max(0.0, 1 - distance / settings.face_match_threshold), 3)

            existing = best_matches.get(student_id)
            if existing is None or confidence > existing["confidence"]:
                best_matches[student_id] = {
                    "student_id": student_id,
                    "full_name": roster.get(student_id, "Unknown"),
                    "confidence": confidence,
                    "photo_index": photo_index,
                }

    present = list(best_matches.values())
    absent = [
        {"student_id": sid, "full_name": name}
        for sid, name in roster.items()
        if sid not in best_matches
    ]

    return {"present": present, "absent": absent, "unmatched_faces": unmatched_faces}


@router.post("/voice/scan")
async def scan_voice_attendance(
    subject_id: str = Form(...),
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
):
    """Runs voice roll-call matching against one subject's enrolled students
    and returns a draft roster. Saves nothing — same review-before-save
    contract as the face scan endpoint."""
    if user.role != "teacher":
        raise HTTPException(403, "This is only available to teachers")

    client = get_service_client()
    roster = _owned_subject_roster(client, subject_id, user)
    student_ids = list(roster.keys())

    candidates: dict[str, list[float]] = {}
    if student_ids:
        voice_rows = (
            client.table("student_voices")
            .select("student_id, embedding")
            .in_("student_id", student_ids)
            .execute()
            .data
        )
        candidates = {row["student_id"]: row["embedding"] for row in voice_rows}

    data = await read_upload(file, MAX_AUDIO_BYTES)
    try:
        identified, unmatched_segments = process_bulk_audio(
            data, candidates, settings.voice_match_threshold
        )
    except VoicePipelineError as e:
        raise HTTPException(422, str(e)) from e

    present = [
        {
            "student_id": student_id,
            "full_name": roster.get(student_id, "Unknown"),
            "confidence": round(score, 3),
        }
        for student_id, score in identified.items()
    ]
    absent = [
        {"student_id": sid, "full_name": name}
        for sid, name in roster.items()
        if sid not in identified
    ]

    return {"present": present, "absent": absent, "unmatched_segments": unmatched_segments}
