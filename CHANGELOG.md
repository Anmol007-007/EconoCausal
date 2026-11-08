# Changelog

All notable changes to the **EconoCausal** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-08

### Added
- **Production Architecture & Microservices**:
  - Full-stack single page application (SPA) mounted at root `/` with fallback routing to React 18 production bundle.
  - FastAPI asynchronous microservice with versioned `/api/v2/` prefixes.
  - Multi-worker Gunicorn server configuration (`gunicorn.conf.py`) with Uvicorn worker class.
  - Production `docker-compose.yml` orchestrating `econocausal-app`, `postgres:16-alpine`, `redis:7-alpine`, `prometheus:v2.50.1`, and `grafana:10.3.3`.

- **Authentication, Authorization & Security (OWASP Top 10)**:
  - JWT authentication using HMAC-SHA256 (`HS256`) with access tokens (60 min expiry) and refresh tokens (7 days expiry).
  - Password hashing with `bcrypt` (12 rounds) and strict complexity validation (min 8 characters, uppercase, lowercase, number, special character).
  - Brute-force protection: automatic account lockout for 15 minutes after 5 consecutive failed login attempts returning `423 Locked`.
  - Constant-time string comparison via `secrets.compare_digest` for API keys and tokens to mitigate timing attacks.
  - Sliding-window in-memory and Redis-backed rate limiting (120 req/min general, 15 req/min on compute-heavy ML routes).
  - Security headers middleware injecting `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`.
  - CSV formula injection sanitization (CWE-1236) escaping leading `=,+,-,@` symbols.
  - Maximum payload size validation (10MB limit) returning `413 Payload Too Large`.

- **Observability, Monitoring & Telemetry**:
  - Zero-overhead structured JSON logging powered by `structlog` with correlation IDs via Python `contextvars`.
  - Prometheus metrics exporter (`/api/metrics`) tracking HTTP request rates, response times, model inference latencies, optimizer solve times, and active database sessions.
  - Grafana dashboard JSON provisioning with panels for API throughput, p95/p99 latencies, error budgets, and DML memory usage.
  - AlertManager rules (`monitoring/alertmanager_rules.yml`) with automated alerts for high error rates and severe distribution drift.
  - Diagnostic log analyzer utility (`scripts/log_analyzer.py`) for offline log pattern mining.

- **Data Persistence & Database Migrations**:
  - Async SQLAlchemy 2.0 ORM base (`database/base.py`) supporting both `aiosqlite` (development/testing) and `asyncpg` (production).
  - Relational models: `Experiment`, `PipelineRun`, `User`, `AuditLog`, and `DriftEvent`.
  - Clean repository pattern: `ExperimentRepository`, `PipelineRunRepository`, `UserRepository`, `AuditRepository`.
  - Alembic migrations:
    - `001_initial_schema.py`: Base tables, foreign keys, and constraints.
    - `002_add_indexes.py`: Performance indexes including composite index on `pipeline_runs (experiment_id, created_at)`.
  - Seed database script (`scripts/seed_db.py`) for initializing default administrator and quant researcher profiles.

- **Redis Caching & Query Optimization**:
  - Async Redis connection pool (`database/cache.py`) with automatic fallback to uncached execution on connection loss.
  - Typed deterministic cache key builders (`database/cache_keys.py`) for diagnostics, SHAP values, and model benchmarks.
  - Response caching decorator (`@cache_response`) adding `X-Cache: HIT/MISS` headers.
  - Cache invalidation on `/api/upload` clearing stale caches across the `econocausal:*` namespace.
  - Cache management router (`/api/admin/cache/stats`, `/flush`, `/ping`).
  - Cache warmup utility (`scripts/cache_warmup.py`).

- **Frontend Complete UI/UX Overhaul & Progressive Web App (PWA)**:
  - Unified design token system with light and dark mode toggles backed by `localStorage` persistence.
  - 18+ reusable React components: `MetricCard`, `DataTable`, `Badge`, `Spinner`, `Toast`, `Modal`, `ErrorBoundary`, etc.
  - 5 advanced views: `LiveMetricsView`, `ModelComparisonView`, `ShapExplainabilityView`, `SegmentExplorerView`, and `RoiSimulatorView`.
  - Progressive Web App support: `manifest.json`, service worker caching (`sw.js`), and responsive mobile drawer navigation (`MobileMenu.tsx`).
  - WebSocket streaming endpoint (`/api/ws/pipeline`) for real-time model progress notifications.

- **Automated Testing & End-to-End Quality**:
  - Full pytest test suite with 162 passing tests covering unit, integration, database, security, and caching workflows.
  - Playwright E2E browser automation suite (`playwright.config.ts`) with 6 test specs (`e2e/tests/`).
  - Locust load testing suite (`benchmarks/locustfile.py`) measuring throughput and p99 latency under concurrency.
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`) automating bandit security scans, pytest, and frontend builds.

---

## [1.0.0] - 2026-10-27

### Added
- **Phase 1 Foundation & Causal AI Core Engine**:
  - Synthetic confounded retail dataset generator (`src/data_gen.py`) with 50,000 records.
  - DoWhy structural causal DAG formulation (`src/causal_model.py`) and backdoor identification proof.
  - Multi-class propensity scoring, overlap reporting, and SMD balance table reduction.
  - EconML `CausalForestDML` Double Machine Learning estimator with LightGBM base learners.
  - Ground-truth PEHE evaluation against naive OLS regression and standard random forest baselines.
  - Qini curves, AUQC computation, and cumulative uplift curves.
  - DoWhy refutation suite (Placebo treatment, Random common cause, Data subset refuters).
  - SciPy Mixed-Integer Linear Programming (MILP) budget optimizer allocating discounts to persuadables.
  - Rolling drift detection engine computing sliding PSI and Wasserstein distances.
  - React + Plotly.js quantitative dashboard with 5 core operational panels.
  - FastAPI initial REST microservice exposing `/upload`, `/uplift`, `/allocate`, `/diagnostics`, `/drift`, and `/summary`.
