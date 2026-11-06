from __future__ import annotations

import functools
import hashlib
import json
import logging
from typing import Any, Callable, Optional

from fastapi import Request, Response
from fastapi.responses import JSONResponse

from database.cache import cache_get, cache_set

_logger = logging.getLogger("econocausal.cache.decorator")


def _build_cache_key(prefix: str, request: Request) -> str:
    path = request.url.path
    query = str(sorted(request.query_params.items()))
    raw = f"{prefix}:{path}:{query}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"econocausal:resp:{prefix}:{digest}"


def cache_response(ttl: int = 300, key_prefix: str = ""):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            request: Optional[Request] = kwargs.get("request") or next(
                (a for a in args if isinstance(a, Request)), None
            )

            if request is None:
                return await func(*args, **kwargs)

            prefix = key_prefix or func.__name__
            cache_key = _build_cache_key(prefix, request)

            cached = await cache_get(cache_key)
            if cached is not None:
                try:
                    data = json.loads(cached)
                    response = JSONResponse(content=data)
                    response.headers["X-Cache"] = "HIT"
                    response.headers["X-Cache-Key"] = cache_key
                    return response
                except (json.JSONDecodeError, Exception) as exc:
                    _logger.warning("cache_deserialize_error key=%s: %s", cache_key, exc)

            result = await func(*args, **kwargs)

            if isinstance(result, (dict, list)):
                try:
                    serialized = json.dumps(result, default=str)
                    await cache_set(cache_key, serialized, ttl=ttl)
                    response = JSONResponse(content=result)
                    response.headers["X-Cache"] = "MISS"
                    response.headers["X-Cache-Key"] = cache_key
                    return response
                except (TypeError, Exception) as exc:
                    _logger.warning("cache_serialize_error key=%s: %s", cache_key, exc)
                    return result

            if isinstance(result, JSONResponse):
                try:
                    body = result.body
                    parsed = json.loads(body)
                    serialized = json.dumps(parsed, default=str)
                    await cache_set(cache_key, serialized, ttl=ttl)
                    result.headers["X-Cache"] = "MISS"
                    result.headers["X-Cache-Key"] = cache_key
                except Exception as exc:
                    _logger.warning("cache_jsonresponse_error key=%s: %s", cache_key, exc)

            return result

        return wrapper
    return decorator

