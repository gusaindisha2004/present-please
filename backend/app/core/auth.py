import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.core.supabase_client import get_service_client

_bearer = HTTPBearer(auto_error=False)
_jwks_client = jwt.PyJWKClient(settings.supabase_jwks_url)


class CurrentUser:
    def __init__(self, id: str, role: str, email: str | None):
        self.id = id
        self.role = role
        self.email = email


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")

    token = credentials.credentials
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject")

    # The token also carries a role, but it comes from user_metadata, which
    # the account holder can rewrite at will via supabase.auth.updateUser().
    # profiles.role is written once by the handle_new_user trigger and RLS
    # forbids changing it afterwards, so that is the copy worth trusting.
    # It costs one lookup per request; the alternative is an authorization
    # input the caller controls.
    client = get_service_client()
    response = (
        client.table("profiles")
        .select("role")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    # This supabase-py returns None outright when nothing matches, so the
    # response itself has to be checked before .data.
    profile = response.data if response else None
    if not profile:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "No profile for this account"
        )

    return CurrentUser(
        id=user_id, role=profile["role"], email=payload.get("email")
    )
