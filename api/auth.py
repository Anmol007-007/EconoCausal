from __future__ import annotations
import time
import secrets
from typing import Optional, Dict, Any
import jwt
import bcrypt
from api.config import settings
from api.models.user import UserInDB, UserCreate, TokenData

_USERS_DB: Dict[str, UserInDB] = {}

_FAILED_LOGINS: Dict[str, Dict[str, Any]] = {}
MAX_FAILED_ATTEMPTS: int = 5
LOCKOUT_DURATION_SECONDS: int = 900

def validate_password_complexity(password: str) -> bool:
    if len(password) < 8:
        return False
    if not any(c.isupper() for c in password):
        return False
    if not any(c.islower() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    if not any(c in "@$!%*?&_\\-#^~+=<>()[]{}|" for c in password):
        return False
    return True

def is_account_locked(email: str) -> bool:
    normalized = email.lower().strip()
    record = _FAILED_LOGINS.get(normalized)
    if not record:
        return False
    if record.get("locked_until", 0) > time.time():
        return True
    if record.get("locked_until", 0) <= time.time() and record.get("locked_until", 0) > 0:
        _FAILED_LOGINS.pop(normalized, None)
        return False
    return False

def record_failed_login(email: str) -> None:
    normalized = email.lower().strip()
    now = time.time()
    record = _FAILED_LOGINS.setdefault(normalized, {"count": 0, "first_failed": now, "locked_until": 0})
    if now - record.get("first_failed", now) > LOCKOUT_DURATION_SECONDS:
        record["count"] = 1
        record["first_failed"] = now
        record["locked_until"] = 0
    else:
        record["count"] += 1
    if record["count"] >= MAX_FAILED_ATTEMPTS:
        record["locked_until"] = now + LOCKOUT_DURATION_SECONDS

def reset_failed_logins(email: str) -> None:
    _FAILED_LOGINS.pop(email.lower().strip(), None)

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")

hash_password = get_password_hash

def hash_api_key(key: str) -> str:
    import hashlib
    return hashlib.sha256(key.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False

def generate_api_key() -> str:
    return f"ec_live_{secrets.token_urlsafe(24)}"

def seed_default_users() -> None:
    if "admin@econocausal.ai" not in _USERS_DB:
        admin_user = UserInDB(
            id="usr_admin_001",
            email="admin@econocausal.ai",
            full_name="EconoCausal Administrator",
            role="admin",
            is_active=True,
            is_admin=True,
            hashed_password=get_password_hash("AdminPass123!"),
            api_key=settings.MASTER_API_KEY,
            created_at=time.time(),
        )
        _USERS_DB[admin_user.email] = admin_user

    if "quant@econocausal.ai" not in _USERS_DB:
        quant_user = UserInDB(
            id="usr_quant_002",
            email="quant@econocausal.ai",
            full_name="Lead Quantitative Researcher",
            role="quant",
            is_active=True,
            is_admin=False,
            hashed_password=get_password_hash("QuantPass123!"),
            api_key=generate_api_key(),
            created_at=time.time(),
        )
        _USERS_DB[quant_user.email] = quant_user

seed_default_users()

def get_user_by_email(email: str) -> Optional[UserInDB]:
    return _USERS_DB.get(email.lower().strip())

def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    for user in _USERS_DB.values():
        if user.id == user_id:
            return user
    return None

def get_user_by_api_key(api_key: str) -> Optional[UserInDB]:
    if not api_key:
        return None
    if secrets.compare_digest(settings.MASTER_API_KEY, api_key):
        return get_user_by_email("admin@econocausal.ai")
    for user in _USERS_DB.values():
        if secrets.compare_digest(user.api_key, api_key):
            return user
    return None

def create_user(user_in: UserCreate) -> UserInDB:
    email = user_in.email.lower().strip()
    if email in _USERS_DB:
        raise ValueError("User with this email already exists")

    if not validate_password_complexity(user_in.password):
        raise ValueError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")

    new_user = UserInDB(
        id=f"usr_{secrets.token_hex(6)}",
        email=email,
        full_name=user_in.full_name,
        role=user_in.role or "analyst",
        is_active=True,
        is_admin=False,
        hashed_password=get_password_hash(user_in.password),
        api_key=generate_api_key(),
        created_at=time.time(),
    )
    _USERS_DB[email] = new_user
    return new_user

def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    if is_account_locked(email):
        raise ValueError("Account temporarily locked due to excessive failed login attempts. Please try again in 15 minutes.")
    user = get_user_by_email(email)
    if not user:
        record_failed_login(email)
        return None
    if not verify_password(password, user.hashed_password):
        record_failed_login(email)
        return None
    reset_failed_logins(email)
    return user

def create_access_token(data: Dict[str, Any], expires_delta_seconds: Optional[int] = None) -> str:
    to_encode = data.copy()
    now = int(time.time())
    if expires_delta_seconds is not None:
        expire = now + expires_delta_seconds
    else:
        expire = now + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    to_encode.update({"iat": now, "exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    now = int(time.time())
    expire = now + (settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    to_encode.update({"iat": now, "exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str, expected_type: str = "access") -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != expected_type:
            return None
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        if user_id is None or email is None:
            return None
        return TokenData(user_id=user_id, email=email, role=role)
    except jwt.PyJWTError:
        return None
