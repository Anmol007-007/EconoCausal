from __future__ import annotations

import json
import pytest
import pytest_asyncio
import fakeredis.aioredis as fakeredis

from database.cache_keys import (
    cache_key_diagnostics,
    cache_key_shap,
    cache_key_model_comparison,
    cache_key_summary,
    cache_key_experiments_list,
    cache_key_live_metrics,
    cache_key_uplift,
    cache_key_sensitivity,
    all_data_keys_pattern,
    NAMESPACE,
    CACHE_TTL_DIAGNOSTICS,
    CACHE_TTL_SHAP,
    CACHE_TTL_DEFAULT,
)


@pytest_asyncio.fixture
async def fake_redis():
    r = fakeredis.FakeRedis(decode_responses=True)
    yield r
    await r.aclose()


class TestCacheKeyBuilders:
    def test_diagnostics_key_format(self):
        key = cache_key_diagnostics("abc123")
        assert key == f"{NAMESPACE}:diagnostics:abc123"

    def test_shap_key_format(self):
        key = cache_key_shap("xyz789")
        assert key == f"{NAMESPACE}:shap:xyz789"

    def test_model_comparison_key(self):
        key = cache_key_model_comparison()
        assert key == f"{NAMESPACE}:model_comparison"

    def test_summary_key_format(self):
        key = cache_key_summary("hash001")
        assert key == f"{NAMESPACE}:summary:hash001"

    def test_experiments_list_key(self):
        key = cache_key_experiments_list(0, 20)
        assert key == f"{NAMESPACE}:experiments:off0:lim20"

    def test_experiments_list_key_different_pagination(self):
        k1 = cache_key_experiments_list(0, 20)
        k2 = cache_key_experiments_list(20, 20)
        assert k1 != k2

    def test_live_metrics_key(self):
        key = cache_key_live_metrics()
        assert key == f"{NAMESPACE}:live_metrics"

    def test_uplift_key_format(self):
        key = cache_key_uplift("ds_001")
        assert key == f"{NAMESPACE}:uplift:ds_001"

    def test_sensitivity_key_format(self):
        key = cache_key_sensitivity("ds_002")
        assert key == f"{NAMESPACE}:sensitivity:ds_002"

    def test_all_data_keys_pattern(self):
        pattern = all_data_keys_pattern()
        assert pattern == f"{NAMESPACE}:*"

    def test_ttl_values_sane(self):
        assert CACHE_TTL_DIAGNOSTICS > 0
        assert CACHE_TTL_SHAP > 0
        assert CACHE_TTL_DEFAULT > 0
        assert CACHE_TTL_DIAGNOSTICS >= CACHE_TTL_DEFAULT

    def test_namespace_prefix_consistency(self):
        keys = [
            cache_key_diagnostics("h"),
            cache_key_shap("h"),
            cache_key_model_comparison(),
            cache_key_summary("h"),
            cache_key_experiments_list(0, 10),
            cache_key_live_metrics(),
        ]
        for k in keys:
            assert k.startswith(f"{NAMESPACE}:"), f"Key {k!r} missing namespace"


@pytest.mark.asyncio
async def test_fake_redis_set_and_get(fake_redis):
    await fake_redis.set("test:key", json.dumps({"value": 42}))
    raw = await fake_redis.get("test:key")
    assert raw is not None
    data = json.loads(raw)
    assert data["value"] == 42


@pytest.mark.asyncio
async def test_fake_redis_ttl(fake_redis):
    await fake_redis.set("test:ttl", "data", ex=600)
    ttl = await fake_redis.ttl("test:ttl")
    assert ttl > 0
    assert ttl <= 600


@pytest.mark.asyncio
async def test_fake_redis_delete(fake_redis):
    await fake_redis.set("test:del", "value")
    deleted = await fake_redis.delete("test:del")
    assert deleted == 1
    result = await fake_redis.get("test:del")
    assert result is None


@pytest.mark.asyncio
async def test_fake_redis_scan_pattern(fake_redis):
    await fake_redis.set(f"{NAMESPACE}:key1", "v1")
    await fake_redis.set(f"{NAMESPACE}:key2", "v2")
    await fake_redis.set("other:key", "v3")
    cursor, keys = await fake_redis.scan(0, match=f"{NAMESPACE}:*", count=100)
    ns_keys = [k for k in keys if k.startswith(f"{NAMESPACE}:")]
    assert len(ns_keys) == 2


@pytest.mark.asyncio
async def test_cache_invalidation_pattern(fake_redis):
    for i in range(5):
        await fake_redis.set(f"{NAMESPACE}:resp:diag:{i}", f"cached_{i}")
    await fake_redis.set("other_ns:key", "do_not_delete")

    cursor = 0
    deleted_total = 0
    while True:
        cursor, keys = await fake_redis.scan(cursor, match=f"{NAMESPACE}:*", count=100)
        if keys:
            deleted_total += await fake_redis.delete(*keys)
        if cursor == 0:
            break

    assert deleted_total == 5
    surviving = await fake_redis.get("other_ns:key")
    assert surviving == "do_not_delete"


@pytest.mark.asyncio
async def test_fake_redis_ping(fake_redis):
    result = await fake_redis.ping()
    assert result is True


@pytest.mark.asyncio
async def test_cache_get_returns_none_when_disabled():
    from api.config import settings
    original = settings.CACHE_ENABLED
    settings.CACHE_ENABLED = False
    from database.cache import cache_get
    result = await cache_get("any:key")
    assert result is None
    settings.CACHE_ENABLED = original


@pytest.mark.asyncio
async def test_cache_set_returns_false_when_disabled():
    from api.config import settings
    original = settings.CACHE_ENABLED
    settings.CACHE_ENABLED = False
    from database.cache import cache_set
    result = await cache_set("any:key", "value", ttl=60)
    assert result is False
    settings.CACHE_ENABLED = original


@pytest.mark.asyncio
async def test_flush_pattern_returns_zero_when_disabled():
    from api.config import settings
    original = settings.CACHE_ENABLED
    settings.CACHE_ENABLED = False
    from database.cache import flush_pattern
    result = await flush_pattern("econocausal:*")
    assert result == 0
    settings.CACHE_ENABLED = original


@pytest.mark.asyncio
async def test_cache_info_returns_none_when_disabled():
    from api.config import settings
    original = settings.CACHE_ENABLED
    settings.CACHE_ENABLED = False
    from database.cache import cache_info
    result = await cache_info()
    assert result is None
    settings.CACHE_ENABLED = original
