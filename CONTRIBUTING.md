# Contributing to EconoCausal

Thank you for your interest in contributing to **EconoCausal: Enterprise Causal AI & Double Machine Learning Microservice Platform**!

---

## 1. Code of Conduct

All contributors and maintainers are expected to maintain a welcoming, respectful, and harassment-free environment for everyone. Please be constructive, professional, and empathetic in all interactions.

---

## 2. Development Workflow

### Step 1: Fork and Clone
```bash
git clone https://github.com/Anmol007-007/EconoCausal.git
cd EconoCausal
```

### Step 2: Environment Setup
```powershell
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 4: Database & Redis Configuration
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Apply Alembic database migrations:
```powershell
alembic upgrade head
```
Seed default users and experiments:
```powershell
python scripts/seed_db.py
```

---

## 3. Running the Platform Locally

### Backend Microservice
```powershell
python -m uvicorn api.main:app --reload --port 8000
```
- Interactive Swagger UI: `http://localhost:8000/docs`
- Redoc API documentation: `http://localhost:8000/redoc`
- Prometheus telemetry: `http://localhost:8000/metrics`
- Single Page Application: `http://localhost:8000/`

### Frontend Development Server (Optional for Live HMR)
```bash
cd frontend
npm run dev -- --port 5173
```

---

## 4. Testing & Code Quality Standards

Before submitting any Pull Request, ensure that all tests and linting checks pass cleanly:

### Run Full Test Suite
```powershell
pytest tests/ -v
```
*Requirement: 100% of tests must pass (162+ tests).*

### Run Security Audit Suite
```powershell
pytest tests/test_security_audit.py -v
```

### Frontend Build & Typecheck
```bash
cd frontend
npm run build
```

---

## 5. Architectural Principles

When writing or modifying code in EconoCausal, please adhere to these core guidelines:
1. **Comment-Free Compliance**: Write self-documenting, clean code with expressive variable, function, and type names.
2. **Type Annotations**: Provide explicit type hints for all Python function parameters and return types (`from __future__ import annotations`).
3. **Async First**: Use asynchronous database queries (`AsyncSession`, `await session.execute(...)`) and async Redis operations (`database/cache.py`).
4. **Security by Design**: Never log sensitive user credentials, access tokens, or unhashed passwords. Use `secrets.compare_digest` for secret equality checks.
5. **Zero Test Regressions**: Add unit and integration tests under `tests/` for all new features or bug fixes.

---

## 6. Pull Request Guidelines

1. Create a descriptive branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make atomic, focused commits following Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
3. Push your branch to your fork and open a Pull Request against `main`.
4. Describe the changes, motivation, test results, and any relevant issue references in the PR description.
