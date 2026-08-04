import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

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

    app_meta = payload.get("app_metadata") or {}
    user_meta = payload.get("user_metadata") or {}
    role = app_meta.get("role") or user_meta.get("role") or "student"

    return CurrentUser(id=user_id, role=role, email=payload.get("email"))
