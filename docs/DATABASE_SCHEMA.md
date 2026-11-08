# EconoCausal Database Schema & Data Dictionary

EconoCausal persists experiments, pipeline execution runs, user authentication records, security audit logs, and distribution drift events in a relational schema managed via **SQLAlchemy 2.0 Async** and **Alembic**.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ AUDIT_LOGS : generates
    EXPERIMENTS ||--o{ PIPELINE_RUNS : contains
    PIPELINE_RUNS ||--o{ DRIFT_EVENTS : tracks

    USERS {
        string id PK "usr_..."
        string email UK "user email address"
        string hashed_password "bcrypt hash"
        string full_name "User full name"
        string role "admin | quant | analyst"
        boolean is_active "Active flag"
        boolean is_admin "Admin privileges"
        string api_key UK "ec_live_..."
        float created_at "Epoch timestamp"
    }

    EXPERIMENTS {
        string id PK "exp_..."
        string name "Experiment title"
        string description "Hypothesis details"
        string dataset_hash "SHA256 of data"
        integer row_count "Sample size"
        json meta_info "Tags and params"
        string status "active | archived | completed"
        float created_at "Epoch timestamp"
    }

    PIPELINE_RUNS {
        string id PK "run_..."
        string experiment_id FK "References experiments(id)"
        string run_type "dml_causal_forest | milp_allocation"
        string status "running | completed | failed"
        json params "Hyperparameters JSON"
        json results_json "Model / solve output"
        float duration_ms "Execution wall time"
        float created_at "Epoch timestamp"
    }

    AUDIT_LOGS {
        string id PK "aud_..."
        string user_id FK "References users(id)"
        string action "create | execute | allocate | delete"
        string entity_type "experiment | pipeline_run | user"
        string entity_id "Target record ID"
        string ip_address "Client IPv4 / IPv6"
        json details "Event payload metadata"
        float created_at "Epoch timestamp"
    }

    DRIFT_EVENTS {
        string id PK "drf_..."
        string run_id FK "References pipeline_runs(id)"
        string feature "Feature column name"
        float psi_score "Population Stability Index"
        float ks_stat "Kolmogorov-Smirnov statistic"
        boolean p_value_significant "Drift detected flag"
        string severity "none | low | medium | critical"
        float detected_at "Epoch timestamp"
    }
```

---

## 2. Table Specifications

### `users`
Stores user identity, role-based authorization scopes, and API access credentials.
- `id` (VARCHAR(36), PK): Unique user identifier prefix `usr_`.
- `email` (VARCHAR(255), UNIQUE, NOT NULL): Canonical user email address. Indexed for $O(1)$ authentication lookups.
- `hashed_password` (VARCHAR(255), NOT NULL): 12-round bcrypt salted hash.
- `role` (VARCHAR(50), DEFAULT 'analyst'): Authorization tier (`admin`, `quant`, `analyst`).
- `api_key` (VARCHAR(128), UNIQUE): External programmatic API token (`ec_live_...`).

### `experiments`
Represents an analytical study investigating causal uplift on a particular customer cohort.
- `id` (VARCHAR(36), PK): Prefix `exp_`.
- `name` (VARCHAR(255), NOT NULL): Human-readable experiment name.
- `dataset_hash` (VARCHAR(64)): Hash identifying the underlying training dataset for caching and provenance.
- `status` (VARCHAR(32), DEFAULT 'active'): Lifecycle stage (`active`, `archived`, `completed`).
- `created_at` (FLOAT, NOT NULL): Epoch creation timestamp. Indexed for reverse chronological listing.

### `pipeline_runs`
Records discrete execution instances of causal machine learning or optimization pipelines.
- `id` (VARCHAR(36), PK): Prefix `run_`.
- `experiment_id` (VARCHAR(36), FK -> `experiments.id`): Parent study.
- `run_type` (VARCHAR(64), NOT NULL): Algorithm type (`dml_causal_forest`, `milp_allocation`, `refutation`).
- `params` (JSON): Hyperparameters (trees, folds, margin, budget constraints).
- `results_json` (JSON): Computed metrics (ATEs, Qini AUC, PEHE, allocations).
- `duration_ms` (FLOAT): Wall-clock compute time in milliseconds.

### `audit_logs`
Immutable compliance audit trail logging security and data access events.
- `id` (VARCHAR(36), PK): Prefix `aud_`.
- `user_id` (VARCHAR(36), FK -> `users.id`): Initiating actor.
- `action` (VARCHAR(64), NOT NULL): Operation type (`login`, `upload`, `train`, `allocate`, `delete`).
- `ip_address` (VARCHAR(45)): Client IP address.
- `created_at` (FLOAT, NOT NULL): Indexed epoch timestamp.

### `drift_events`
Monitors feature distribution shifts and treatment effect decay over time.
- `id` (VARCHAR(36), PK): Prefix `drf_`.
- `run_id` (VARCHAR(36), FK -> `pipeline_runs.id`): Associated model execution.
- `feature` (VARCHAR(64), NOT NULL): Evaluated attribute.
- `psi_score` (FLOAT): Population Stability Index ($PSI > 0.2$ signals severe drift).
- `severity` (VARCHAR(32)): Classification level (`none`, `moderate`, `critical`).

---

## 3. Indexing Strategy & Migration History

| Migration Revision | Description | Indexes Added |
|:---|:---|:---|
| `001_initial_schema` | Base relational tables, foreign keys, and primary keys. | Primary keys, foreign key constraints. |
| `002_add_indexes` | Performance optimization for query scaling and pagination. | `ix_pipeline_runs_experiment_created` `(experiment_id, created_at)`<br>`ix_experiments_status_created` `(status, created_at)`<br>`ix_audit_logs_user` `(user_id, created_at)`<br>`ix_audit_logs_entity` `(entity_type, entity_id, created_at)`<br>`ix_drift_events_run_detected` `(run_id, detected_at)`<br>`ix_users_email` (unique) |
