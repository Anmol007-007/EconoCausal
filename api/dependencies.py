from __future__ import annotations
from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from api.auth import verify_token, get_user_by_id, get_user_by_api_key
from api.models.user import UserInDB
from api.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> UserInDB:
    if x_api_key:
        user = get_user_by_api_key(x_api_key)
        if user and user.is_active:
            return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired API Key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    if auth and auth.credentials:
        token_data = verify_token(auth.credentials, expected_type="access")
        if token_data and token_data.user_id:
            user = get_user_by_id(token_data.user_id)
            if user and user.is_active:
                return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

def get_optional_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> Optional[UserInDB]:
    if x_api_key:
        user = get_user_by_api_key(x_api_key)
        if user and user.is_active:
            return user

    if auth and auth.credentials:
        token_data = verify_token(auth.credentials, expected_type="access")
        if token_data and token_data.user_id:
            user = get_user_by_id(token_data.user_id)
            if user and user.is_active:
                return user

    return None

def get_admin_user(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if not (current_user.is_admin or current_user.role == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient administrative privileges",
        )
    return current_user

