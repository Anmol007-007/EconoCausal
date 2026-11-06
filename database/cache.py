from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

import redis.asyncio as aioredis
from redis.asyncio import ConnectionPool, Redis
from redis.exceptions import ConnectionError, RedisError, TimeoutError

from api.config import settings

_pool: Optional[ConnectionPool] = None
_logger = logging.getLogger("econocausal.cache")


def _build_pool() -> ConnectionPool:
    return aioredis.ConnectionPool.from_url(
        settings.REDIS_URL,
        max_connections=20,
        socket_timeout=2.0,
        socket_connect_timeout=2.0,
        decode_responses=True,
    )


async def init_cache() -> None:
    global _pool
    if not settings.CACHE_ENABLED:
        return
    _pool = _build_pool()
    try:
        async with get_redis() as r:
            if r is not None:
                await r.ping()
                _logger.info("Redis cache connected at %s", settings.REDIS_URL)
    except (ConnectionError, TimeoutError, RedisError) as exc:
        _logger.warning("Redis unavailable at startup — caching disabled: %s", exc)


async def close_cache() -> None:
    global _pool
    if _pool is not None:
        await _pool.disconnect()
        _pool = None


@asynccontextmanager
async def get_redis() -> AsyncGenerator[Optional[Redis], None]:
    if not settings.CACHE_ENABLED or _pool is None:
        yield None
        return
    client: Redis = aioredis.Redis(connection_pool=_pool)
    try:
        yield client
    except (ConnectionError, TimeoutError, RedisError) as exc:
        _logger.warning("Redis operation failed — skipping cache: %s", exc)
        yield None
    finally:
        await client.aclose()


async def get_redis_client() -> Optional[Redis]:
    if not settings.CACHE_ENABLED or _pool is None:
        return None
    return aioredis.Redis(connection_pool=_pool)


async def flush_pattern(pattern: str) -> int:
    deleted = 0
    async with get_redis() as r:
        if r is None:
            return 0
        cursor = 0
        while True:
            cursor, keys = await r.scan(cursor, match=pattern, count=100)
            if keys:
                deleted += await r.delete(*keys)
            if cursor == 0:
                break
    return deleted


async def cache_get(key: str) -> Optional[str]:
    async with get_redis() as r:
        if r is None:
            return None
        return await r.get(key)


async def cache_set(key: str, value: str, ttl: int = 300) -> bool:
    async with get_redis() as r:
        if r is None:
            return False
        return bool(await r.set(key, value, ex=ttl))


async def cache_delete(key: str) -> int:
    async with get_redis() as r:
        if r is None:
            return 0
        return await r.delete(key)


async def cache_info() -> Optional[dict]:
    async with get_redis() as r:
        if r is None:
            return None
        raw = await r.info("all")
        return {
            "used_memory_human": raw.get("used_memory_human"),
            "connected_clients": raw.get("connected_clients"),
            "keyspace_hits": raw.get("keyspace_hits"),
            "keyspace_misses": raw.get("keyspace_misses"),
            "total_commands_processed": raw.get("total_commands_processed"),
            "uptime_in_seconds": raw.get("uptime_in_seconds"),
            "redis_version": raw.get("redis_version"),
            "maxmemory_policy": raw.get("maxmemory_policy"),
        }

