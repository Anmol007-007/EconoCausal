from __future__ import annotations

NAMESPACE = "econocausal"

CACHE_TTL_DIAGNOSTICS: int = 3600
CACHE_TTL_SHAP: int = 1800
CACHE_TTL_MODEL_COMPARISON: int = 1800
CACHE_TTL_SUMMARY: int = 900
CACHE_TTL_EXPERIMENTS: int = 300
CACHE_TTL_LIVE_METRICS: int = 30
CACHE_TTL_DEFAULT: int = 300


def _ns(*parts: str) -> str:
    return f"{NAMESPACE}:" + ":".join(parts)


def cache_key_diagnostics(dataset_hash: str) -> str:
    return _ns("diagnostics", dataset_hash)


def cache_key_shap(dataset_hash: str) -> str:
    return _ns("shap", dataset_hash)


def cache_key_model_comparison() -> str:
    return _ns("model_comparison")


def cache_key_summary(dataset_hash: str) -> str:
    return _ns("summary", dataset_hash)


def cache_key_experiments_list(offset: int, limit: int) -> str:
    return _ns("experiments", f"off{offset}", f"lim{limit}")


def cache_key_live_metrics() -> str:
    return _ns("live_metrics")


def cache_key_uplift(dataset_hash: str) -> str:
    return _ns("uplift", dataset_hash)


def cache_key_sensitivity(dataset_hash: str) -> str:
    return _ns("sensitivity", dataset_hash)


def all_data_keys_pattern() -> str:
    return f"{NAMESPACE}:*"

