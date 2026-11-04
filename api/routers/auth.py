from __future__ import annotations
import time
from fastapi import APIRouter, HTTPException, status, Depends
from api.models.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    RefreshTokenRequest,
    ApiKeyResponse,
)
from api.auth import (
    authenticate_user,
    create_user,
    create_access_token,
    create_refresh_token,
    verify_token,
    get_user_by_id,
    generate_api_key,
)
from api.dependencies import get_current_user
from api.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate):
    try:
        new_user = create_user(user_in)
        return UserResponse(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role,
            is_active=new_user.is_active,
            is_admin=new_user.is_admin,
            api_key=new_user.api_key,
            created_at=new_user.created_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=Token)
def login(credentials: UserLogin):
    user = authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id, "email": user.email, "role": user.role})

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

@router.post("/refresh", response_model=Token)
def refresh_token(payload: RefreshTokenRequest):
    token_data = verify_token(payload.refresh_token, expected_type="refresh")
    if not token_data or not token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(token_data.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer active",
        )

    access_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    new_refresh_token = create_refresh_token({"sub": user.id, "email": user.email, "role": user.role})

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        api_key=current_user.api_key,
        created_at=current_user.created_at,
    )

@router.post("/api-keys", response_model=ApiKeyResponse)
def rotate_api_key(current_user=Depends(get_current_user)):
    new_key = generate_api_key()
    current_user.api_key = new_key
    return ApiKeyResponse(
        api_key=new_key,
        created_at=time.time(),
        description=f"Generated for {current_user.email}",
    )

