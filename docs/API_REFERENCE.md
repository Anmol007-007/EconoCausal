# EconoCausal REST API Reference (v2.0)

EconoCausal exposes a high-performance, asynchronous RESTful microservice API powered by FastAPI. All endpoints are available under `/api/` and versioned under `/api/v2/`.

---

## 1. Authentication & Access Control

### `POST /api/auth/register`
Register a new quantitative researcher or analyst user.

- **Request Body**:
  ```json
  {
    "email": "user@econocausal.ai",
    "password": "StrongPassword123!",
    "full_name": "Dr. Quantitative Analyst",
    "role": "quant"
  }
  ```
- **Responses**:
  - `201 Created`: User created with generated ID and API key.
  - `400 Bad Request`: Email already exists or password fails complexity rules.

---

### `POST /api/auth/login`
Authenticate using email and password to receive JWT access and refresh tokens.

- **Request Body**:
  ```json
  {
    "email": "user@econocausal.ai",
    "password": "StrongPassword123!"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1Ni...",
      "refresh_token": "eyJhbGciOiJIUzI1Ni...",
      "token_type": "bearer",
      "expires_in": 3600
    }
    ```
  - `401 Unauthorized`: Invalid credentials.
  - `423 Locked`: Account temporarily locked after 5 consecutive failed login attempts.

---

### `POST /api/auth/refresh`
Renew an expired access token using a valid refresh token.

- **Request Body**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1Ni..."
  }
  ```
- **Responses**:
  - `200 OK`: New access and refresh token pair.
  - `401 Unauthorized`: Invalid or expired refresh token.

---

### `GET /api/auth/me`
Retrieve the authenticated user's profile details. Requires `Authorization: Bearer <token>` or `X-API-Key: <key>`.

---

## 2. Ingestion & Data Preparation

### `POST /api/upload`
Upload a promotional dataset (CSV or Parquet) or generate a synthetic confounded benchmark dataset.

- **Parameters (Form Data)**:
  - `file`: CSV or Parquet file upload (optional).
  - `benchmark`: Named benchmark identifier (e.g., `starbucks`, `hillstrom`).
  - `seed`: Integer random seed (default: `42`).
  - `n_records`: Record count for synthetic generation (default: `1000`).
- **Responses**:
  - `200 OK`:
    ```json
    {
      "status": "success",
      "dataset_id": "ds_1000_42",
      "records": 1000,
      "columns": ["past_spend", "recency_days", "loyalty_tier", "category_affinity", "discount", "purchase"],
      "missingness": 0.0,
      "confounders": ["past_spend", "recency_days", "loyalty_tier", "category_affinity"],
      "treatment": "discount",
      "outcome": "purchase",
      "validated": true
    }
    ```
  - `413 Payload Too Large`: Payload exceeds 10MB limit.

---

## 3. Causal Inference & Double Machine Learning

### `POST /api/uplift`
Train the EconML `CausalForestDML` model to estimate conditional average treatment effects (CATE / Uplift) across discount arms.

- **Request Body**:
  ```json
  {
    "cv": 2,
    "n_estimators": 32,
    "subforest_size": 4
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "model": "CausalForestDML",
      "records": 1000,
      "cv_folds": 2,
      "ate_10": 0.0542,
      "ate_20": 0.0987,
      "qini_score": 0.684,
      "qini_curve": [{"percentile": 0.1, "cumulative_gain": 0.08}],
      "uplift_curve": [{"percentile": 0.1, "incremental_sales": 14.2}]
    }
    ```

---

### `GET /api/diagnostics`
Retrieve structural causal graph DAG DOT representation, propensity overlap statistics, and standardized mean difference (SMD) balance table. Supports Redis response caching (`X-Cache: HIT / MISS`).

---

### `GET /api/summary`
Retrieve an automated, natural-language executive summary of the model findings and causal recommendations.

---

## 4. Prescriptive Optimization & Budget Allocation

### `POST /api/allocate`
Execute Mixed-Integer Linear Programming (MILP) knapsack optimization allocating marketing budget exclusively to persuadable customer segments.

- **Request Body**:
  ```json
  {
    "total_budget": 5000.0,
    "unit_margin": 45.0,
    "min_margin_floor": 0.0,
    "max_arm_20": null,
    "frequency_cap_days": 21
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "solver": "scipy.optimize.milp",
      "status": "Optimal (converged)",
      "budget_allocated": 4890.0,
      "net_incremental_profit": 3410.50,
      "persuadables_targeted": 345,
      "allocation_breakdown": {"arm_0": 655, "arm_10": 210, "arm_20": 135}
    }
    ```

---

## 5. Experiment Tracking & Audit Logs

### `POST /api/experiments`
Create a persistent named experiment record.

### `GET /api/experiments`
List recorded experiments with cursor/offset pagination (`offset=0&limit=20`).

### `GET /api/experiments/{id}/runs`
List all model training and allocation runs associated with an experiment.

### `GET /api/admin/audit-logs`
Retrieve administrative audit trail logs (Admin authentication required).

---

## 6. Cache Management & Telemetry

### `GET /api/admin/cache/stats`
Get live Redis memory usage, hit rate, and key count.

### `DELETE /api/admin/cache/flush`
Flush all cached keys matching `econocausal:*`.

### `GET /metrics`
Prometheus metrics scrape target exporting HTTP rates, latencies, model durations, and active connections.

### `GET /health`
Liveness and readiness health check probe returning application status, database connectivity, and version info.

