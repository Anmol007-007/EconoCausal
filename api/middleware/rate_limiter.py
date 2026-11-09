from __future__ import annotations
import time
from collections import defaultdict
from typing import Dict, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from api.config import settings

class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.heavy_requests: Dict[str, List[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        path = request.url.path
        if path in ("/", "/health", "/api/health", "/docs", "/openapi.json"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        window_start = now - 60.0

        client_history = [t for t in self.requests[client_ip] if t > window_start]
        self.requests[client_ip] = client_history

        if len(client_history) >= settings.MAX_REQUESTS_PER_MINUTE:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Rate limit exceeded (120 req/min)."},
                headers={"Retry-After": "60"},
            )

        if path in ("/uplift", "/api/uplift", "/api/v2/uplift"):
            heavy_history = [t for t in self.heavy_requests[client_ip] if t > window_start]
            self.heavy_requests[client_ip] = heavy_history

            if len(heavy_history) >= settings.MAX_HEAVY_REQUESTS_PER_MINUTE:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many model training requests. Rate limit is 15 req/min."},
                    headers={"Retry-After": "60"},
                )
            self.heavy_requests[client_ip].append(now)

        self.requests[client_ip].append(now)
        return await call_next(request)

