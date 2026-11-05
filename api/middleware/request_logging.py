from __future__ import annotations
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from api.logging_config import request_id_ctx, user_id_ctx, get_logger
from api.monitoring.metrics import HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION_SECONDS

logger = get_logger("api.access")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()

        req_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID")
        if req_id:
            request_id_ctx.set(req_id)

        method = request.method
        path = request.url.path

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            duration = time.perf_counter() - start_time
            HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=path, status_code="500").inc()
            HTTP_REQUEST_DURATION_SECONDS.labels(method=method, endpoint=path).observe(duration)
            logger.error(
                "request_failed",
                method=method,
                path=path,
                status_code=500,
                duration_ms=round(duration * 1000, 2),
                error=str(exc),
            )
            raise exc

        duration = time.perf_counter() - start_time
        status_str = str(status_code)

        normalized_path = path
        if path.startswith("/api/experiments/") and len(path.split("/")) > 3:
            normalized_path = "/api/experiments/{id}"

        HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=normalized_path, status_code=status_str).inc()
        HTTP_REQUEST_DURATION_SECONDS.labels(method=method, endpoint=normalized_path).observe(duration)

        if not path.endswith(("/metrics", "/health")):
            logger.info(
                "http_request",
                method=method,
                path=path,
                status_code=status_code,
                duration_ms=round(duration * 1000, 2),
                client_ip=request.client.host if request.client else "unknown",
            )

        return response
