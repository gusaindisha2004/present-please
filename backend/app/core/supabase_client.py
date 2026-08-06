from functools import lru_cache

import httpx
from supabase import create_client, Client
from supabase.lib.client_options import SyncClientOptions

from app.core.config import settings


@lru_cache
def get_service_client() -> Client:
    """Service-role client. Bypasses RLS — only used server-side for
    biometric tables (student_faces / student_voices) and storage.

    This is a process-lifetime singleton (cheaper than the ~60ms it costs
    to construct), which means its underlying HTTP connection pool can sit
    idle between requests — realistic for a low-traffic deployment. Without
    a short keepalive_expiry, httpx will try to reuse a pooled connection
    that Supabase's edge has already silently closed, surfacing as
    `httpx.RemoteProtocolError: Server disconnected` on the first request
    after any idle gap. A short expiry makes httpx recycle idle connections
    proactively instead of waiting to discover they're dead.
    """
    httpx_client = httpx.Client(
        limits=httpx.Limits(max_keepalive_connections=10, keepalive_expiry=15.0),
        timeout=30,
    )
    options = SyncClientOptions(httpx_client=httpx_client)
    return create_client(
        settings.supabase_url, settings.supabase_secret_key, options=options
    )
