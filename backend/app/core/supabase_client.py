from functools import lru_cache

from supabase import create_client, Client

from app.core.config import settings


@lru_cache
def get_service_client() -> Client:
    """Service-role client. Bypasses RLS — only used server-side for
    biometric tables (student_faces / student_voices) and storage."""
    return create_client(settings.supabase_url, settings.supabase_secret_key)
