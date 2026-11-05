from __future__ import annotations
import time
from typing import Callable
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    CollectorRegistry,
    generate_latest,
    CONTENT_TYPE_LATEST,
    REGISTRY,
)

HTTP_REQUESTS_TOTAL = Counter(
    "econocausal_http_requests_total",
    "Total count of HTTP requests",
    ["method", "endpoint", "status_code"],
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "econocausal_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

ML_TRAINING_DURATION_SECONDS = Histogram(
    "econocausal_ml_training_duration_seconds",
    "Double ML model training duration in seconds",
    ["model_type"],
    buckets=(0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0),
)

ACTIVE_WEBSOCKET_CONNECTIONS = Gauge(
    "econocausal_active_websocket_connections",
    "Current active WebSocket client connections",
)

MODEL_DRIFT_ALERTS_TOTAL = Counter(
    "econocausal_model_drift_alerts_total",
    "Total count of detected feature drift anomalies",
    ["feature", "severity"],
)

DB_QUERY_DURATION_SECONDS = Histogram(
    "econocausal_db_query_duration_seconds",
    "Database query execution latency in seconds",
    ["operation"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1.0),
)

def export_metrics() -> tuple[bytes, str]:
    return generate_latest(REGISTRY), CONTENT_TYPE_LATEST
