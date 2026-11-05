from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field

class UserBase(BaseModel):
    email: str = Field(..., json_schema_extra={"example": "quant@econocausal.ai"})
    full_name: Optional[str] = Field(default=None, json_schema_extra={"example": "Lead Quantitative Researcher"})
    role: str = Field(default="analyst", json_schema_extra={"example": "quant"})

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, json_schema_extra={"example": "SecretPass123!"})

class UserLogin(BaseModel):
    email: str = Field(..., json_schema_extra={"example": "admin@econocausal.ai"})
    password: str = Field(..., json_schema_extra={"example": "AdminPass123!"})

class UserResponse(UserBase):
    id: str
    is_active: bool = True
    is_admin: bool = False
    api_key: Optional[str] = None
    created_at: float

class UserInDB(UserResponse):
    hashed_password: str

User = UserInDB

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ApiKeyResponse(BaseModel):
    api_key: str
    created_at: float
    description: str
