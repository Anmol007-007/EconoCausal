from __future__ import annotations

import time
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from api.dependencies import get_admin_user
from api.models.user import UserInDB
from database.cache import cache_info, flush_pattern, cache_get, cache_set
from database.cache_keys import NAMESPACE

router = APIRouter(prefix="/admin/cache", tags=["Cache Admin"])


@router.get("/stats")
async def get_cache_stats(
    current_user: UserInDB = Depends(get_admin_user),
) -> Dict[str, Any]:
    info = await cache_info()
    if info is None:
        return {
            "status": "unavailable",
            "message": "Redis is not connected or caching is disabled.",
            "timestamp": time.time(),
        }
    hit_rate: Optional[float] = None
    hits = info.get("keyspace_hits") or 0
    misses = info.get("keyspace_misses") or 0
    total = hits + misses
    if total > 0:
        hit_rate = round(hits / total * 100, 2)
    return {
        "status": "connected",
        "redis_version": info.get("redis_version"),
        "used_memory_human": info.get("used_memory_human"),
        "connected_clients": info.get("connected_clients"),
        "keyspace_hits": hits,
        "keyspace_misses": misses,
        "hit_rate_percent": hit_rate,
        "total_commands_processed": info.get("total_commands_processed"),
        "uptime_in_seconds": info.get("uptime_in_seconds"),
        "maxmemory_policy": info.get("maxmemory_policy"),
        "timestamp": time.time(),
    }


@router.delete("/flush")
async def flush_cache(
    pattern: str = f"{NAMESPACE}:*",
    current_user: UserInDB = Depends(get_admin_user),
) -> Dict[str, Any]:
    deleted = await flush_pattern(pattern)
    return {
        "status": "ok",
        "deleted_keys": deleted,
        "pattern": pattern,
        "timestamp": time.time(),
    }


@router.get("/ping")
async def ping_cache(
    current_user: UserInDB = Depends(get_admin_user),
) -> Dict[str, Any]:
    test_key = f"{NAMESPACE}:health_check"
    write_ok = await cache_set(test_key, "pong", ttl=10)
    value = await cache_get(test_key)
    return {
        "status": "ok" if value == "pong" else "degraded",
        "write_ok": write_ok,
        "read_value": value,
        "timestamp": time.time(),
    }
