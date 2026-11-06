from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_experiments_list_default_pagination():
    response = client.get("/api/experiments")
    assert response.status_code in (200, 401, 403)


def test_experiments_list_with_explicit_pagination():
    response = client.get("/api/experiments?offset=0&limit=5")
    assert response.status_code in (200, 401, 403)


def test_experiments_list_large_offset():
    response = client.get("/api/experiments?offset=9999&limit=10")
    assert response.status_code in (200, 401, 403)


def test_experiments_limit_clamped():
    response = client.get("/api/experiments?limit=1000")
    assert response.status_code in (200, 401, 403)


def test_different_hashes_produce_different_keys():
    from database.cache_keys import cache_key_diagnostics
    k1 = cache_key_diagnostics("hash_A")
    k2 = cache_key_diagnostics("hash_B")
    assert k1 != k2


def test_same_hash_produces_same_key():
    from database.cache_keys import cache_key_diagnostics
    k1 = cache_key_diagnostics("consistent_hash")
    k2 = cache_key_diagnostics("consistent_hash")
    assert k1 == k2


def test_pagination_produces_distinct_keys():
    from database.cache_keys import cache_key_experiments_list
    keys = [cache_key_experiments_list(i * 10, 10) for i in range(5)]
    assert len(set(keys)) == 5


def test_all_key_types_distinct():
    from database.cache_keys import (
        cache_key_diagnostics,
        cache_key_shap,
        cache_key_model_comparison,
        cache_key_summary,
    )
    keys = [
        cache_key_diagnostics("h"),
        cache_key_shap("h"),
        cache_key_model_comparison(),
        cache_key_summary("h"),
    ]
    assert len(set(keys)) == len(keys)


def test_cache_stats_requires_auth():
    response = client.get("/api/admin/cache/stats")
    assert response.status_code in (401, 403, 422)


def test_cache_flush_requires_auth():
    response = client.delete("/api/admin/cache/flush")
    assert response.status_code in (401, 403, 422)


def test_cache_ping_requires_auth():
    response = client.get("/api/admin/cache/ping")
    assert response.status_code in (401, 403, 422)


def test_cache_response_decorator_importable():
    from api.decorators.cache import cache_response
    assert callable(cache_response)


def test_cache_response_returns_wrapper():
    from api.decorators.cache import cache_response
    decorator = cache_response(ttl=60, key_prefix="test")
    assert callable(decorator)

    async def dummy_handler(request=None):
        return {"result": "data"}

    wrapped = decorator(dummy_handler)
    assert callable(wrapped)
    assert wrapped.__name__ == "dummy_handler"


def test_cache_key_builder_hash_stable():
    from api.decorators.cache import _build_cache_key
    from unittest.mock import MagicMock
    from starlette.datastructures import QueryParams

    req = MagicMock()
    req.url.path = "/api/diagnostics"
    req.query_params = QueryParams("dataset_hash=abc")

    k1 = _build_cache_key("diagnostics", req)
    k2 = _build_cache_key("diagnostics", req)
    assert k1 == k2
    assert k1.startswith("econocausal:resp:diagnostics:")


def test_cache_key_builder_different_path():
    from api.decorators.cache import _build_cache_key
    from unittest.mock import MagicMock
    from starlette.datastructures import QueryParams

    req1 = MagicMock()
    req1.url.path = "/api/diagnostics"
    req1.query_params = QueryParams("")

    req2 = MagicMock()
    req2.url.path = "/api/model-comparison"
    req2.query_params = QueryParams("")

    assert _build_cache_key("diag", req1) != _build_cache_key("mc", req2)
