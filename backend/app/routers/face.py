import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.auth import CurrentUser, get_current_user
from app.core.image_utils import load_image_as_array
from app.core.supabase_client import get_service_client
from app.core.uploads import MAX_IMAGE_BYTES, read_upload
from app.pipelines.face_pipeline import get_face_embeddings, predict_attendance, train_classifier

router = APIRouter(prefix="/api/face", tags=["face"])

MAX_PHOTOS_PER_REQUEST = 10
SIGNED_URL_TTL_SECONDS = 3600


def _require_student(user: CurrentUser) -> None:
    if user.role != "student":
        raise HTTPException(403, "This is only available to students")


@router.get("/photos")
def list_photos(user: CurrentUser = Depends(get_current_user)):
    _require_student(user)
    client = get_service_client()

    rows = (
        client.table("student_faces")
        .select("id, image_path, created_at")
        .eq("student_id", user.id)
        .order("created_at")
        .execute()
        .data
    )

    photos = []
    for row in rows:
        url = None
        if row.get("image_path"):
            signed = client.storage.from_("student-photos").create_signed_url(
                row["image_path"], SIGNED_URL_TTL_SECONDS
            )
            url = signed.get("signedURL") or signed.get("signedUrl")
        photos.append({"id": row["id"], "url": url, "created_at": row["created_at"]})

    return {"photos": photos}


@router.post("/enroll")
async def enroll_face(
    files: list[UploadFile] = File(...),
    user: CurrentUser = Depends(get_current_user),
):
    _require_student(user)

    if not files:
        raise HTTPException(400, "Upload at least one photo")
    if len(files) > MAX_PHOTOS_PER_REQUEST:
        raise HTTPException(400, f"Upload at most {MAX_PHOTOS_PER_REQUEST} photos at a time")

    client = get_service_client()
    enrolled = 0
    skipped: list[dict] = []

    for upload in files:
        data = await read_upload(upload, MAX_IMAGE_BYTES)
        image_np = load_image_as_array(data)
        encodings = get_face_embeddings(image_np)

        if len(encodings) == 0:
            skipped.append({"filename": upload.filename, "reason": "No face detected"})
            continue
        if len(encodings) > 1:
            skipped.append(
                {"filename": upload.filename, "reason": "More than one face detected"}
            )
            continue

        path = f"{user.id}/{uuid.uuid4()}.jpg"
        client.storage.from_("student-photos").upload(
            path, data, {"content-type": upload.content_type or "image/jpeg"}
        )
        client.table("student_faces").insert(
            {
                "student_id": user.id,
                "embedding": encodings[0].tolist(),
                "image_path": path,
            }
        ).execute()
        enrolled += 1

    if enrolled > 0:
        train_classifier()

    return {"enrolled": enrolled, "skipped": skipped}


@router.delete("/photos/{photo_id}")
def delete_photo(photo_id: str, user: CurrentUser = Depends(get_current_user)):
    _require_student(user)
    client = get_service_client()

    row = (
        client.table("student_faces")
        .select("id, student_id, image_path")
        .eq("id", photo_id)
        .single()
        .execute()
        .data
    )

    if not row or row["student_id"] != user.id:
        raise HTTPException(404, "Photo not found")

    if row.get("image_path"):
        client.storage.from_("student-photos").remove([row["image_path"]])

    client.table("student_faces").delete().eq("id", photo_id).execute()
    train_classifier()

    return {"deleted": True}


@router.post("/identify")
async def identify_face(file: UploadFile = File(...)):
    """Public on purpose — this endpoint *is* the login mechanism, the same
    way a password login form doesn't require you to already be logged in.
    On a match it mints a Supabase magic-link token server-side (never
    emailed) so the frontend can exchange it for a real session via
    supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })."""
    data = await read_upload(file, MAX_IMAGE_BYTES)
    image_np = load_image_as_array(data)

    detected, _all_students, num_faces = predict_attendance(image_np)

    if num_faces == 0:
        raise HTTPException(422, "No face detected — center your face in the frame")
    if num_faces > 1:
        raise HTTPException(422, "More than one face detected")
    if not detected:
        raise HTTPException(404, "Face not recognized")

    student_id = next(iter(detected.keys()))

    client = get_service_client()
    profile = (
        client.table("profiles")
        .select("email, full_name")
        .eq("id", student_id)
        .single()
        .execute()
        .data
    )
    if not profile:
        raise HTTPException(404, "Face not recognized")

    link = client.auth.admin.generate_link(
        {"type": "magiclink", "email": profile["email"]}
    )

    return {
        "token_hash": link.properties.hashed_token,
        "full_name": profile["full_name"],
    }
