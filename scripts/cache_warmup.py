from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
_logger = logging.getLogger("cache_warmup")

BASE_URL = "http://localhost:8000"

WARM_ENDPOINTS = [
    "/api/diagnostics",
    "/api/model-comparison",
    "/api/summary",
]


async def warmup() -> None:
    _logger.info("Starting cache warmup against %s", BASE_URL)
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        for endpoint in WARM_ENDPOINTS:
            url = f"{BASE_URL}{endpoint}"
            try:
                response = await client.get(url)
                cache_header = response.headers.get("X-Cache", "N/A")
                _logger.info(
                    "Warmed %s — status=%s X-Cache=%s",
                    endpoint,
                    response.status_code,
                    cache_header,
                )
            except httpx.RequestError as exc:
                _logger.warning("Failed to warm %s: %s", endpoint, exc)


if __name__ == "__main__":
    asyncio.run(warmup())

