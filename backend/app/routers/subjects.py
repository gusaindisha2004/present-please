from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import CurrentUser, get_current_user
from app.core.supabase_client import get_service_client

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


@router.get("/lookup/{join_code}")
def lookup_subject_by_join_code(
    join_code: str, _user: CurrentUser = Depends(get_current_user)
):
    """Resolve a join code to a subject's public info.

    Students can't SELECT a subject via RLS until they're enrolled in it —
    correctly, since subjects belong to their teacher otherwise. But
    resolving "I have this code, what class is it?" has to happen before
    that enrollment exists. That's the one legitimate reason this uses the
    service-role client instead of a client-side Supabase query.
    """
    client = get_service_client()
    response = (
        client.table("subjects")
        .select("id, name, code, section")
        .eq("join_code", join_code.strip().upper())
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(404, "No subject found for that code")

    return response.data[0]
