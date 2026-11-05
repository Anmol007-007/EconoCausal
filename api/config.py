import os
from typing import List, Optional

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "econocausal_super_secure_secret_key_change_in_production_2026!")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    API_KEY_HEADER: str = os.getenv("API_KEY_HEADER", "X-API-Key")
    MASTER_API_KEY: str = os.getenv("MASTER_API_KEY", "ec_live_k8s_cluster_key_007a")

    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes")
    MAX_REQUESTS_PER_MINUTE: int = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "120"))
    MAX_HEAVY_REQUESTS_PER_MINUTE: int = int(os.getenv("MAX_HEAVY_REQUESTS_PER_MINUTE", "15"))
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", "10485760"))

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./econocausal.db")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))

    PROMETHEUS_METRICS_ENABLED: bool = os.getenv("PROMETHEUS_METRICS_ENABLED", "true").lower() in ("true", "1", "yes")
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN", None)

    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "*")
        if raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def ALLOWED_HOSTS(self) -> List[str]:
        raw = os.getenv("ALLOWED_HOSTS", "*")
        if raw == "*":
            return ["*"]
        return [h.strip() for h in raw.split(",") if h.strip()]

settings = Settings()

def get_settings() -> Settings:
    return settings
