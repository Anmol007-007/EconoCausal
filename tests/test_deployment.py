from pathlib import Path
from fastapi.testclient import TestClient
import pytest
from api.main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent
client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "service" in data
    assert "timestamp" in data


def test_api_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


def test_dockerfile_structure():
    dockerfile_path = PROJECT_ROOT / "Dockerfile"
    assert dockerfile_path.exists(), "Dockerfile is missing"
    content = dockerfile_path.read_text(encoding="utf-8")
    assert "FROM node:20-alpine" in content, "Frontend builder stage missing in Dockerfile"
    assert "FROM python:3.12-slim" in content, "Python runtime stage missing in Dockerfile"
    assert "HEALTHCHECK" in content, "Healthcheck instruction missing in Dockerfile"
    assert "EXPOSE 8000" in content, "Expose port missing in Dockerfile"


def test_docker_compose_structure():
    compose_path = PROJECT_ROOT / "docker-compose.yml"
    assert compose_path.exists(), "docker-compose.yml is missing"
    content = compose_path.read_text(encoding="utf-8")
    assert "services:" in content
    assert "econocausal:" in content
    assert "8000:8000" in content
    assert "healthcheck:" in content


def test_env_example_keys():
    env_path = PROJECT_ROOT / ".env.example"
    assert env_path.exists(), ".env.example is missing"
    content = env_path.read_text(encoding="utf-8")
    required_keys = ["PORT", "HOST", "WORKERS", "DEFAULT_CAMPAIGN_BUDGET", "DRIFT_PSI_THRESHOLD"]
    for key in required_keys:
        assert f"{key}=" in content, f"Missing key {key} in .env.example"


def test_healthcheck_script_exists():
    script_path = PROJECT_ROOT / "scripts" / "healthcheck.py"
    assert script_path.exists(), "scripts/healthcheck.py is missing"
    content = script_path.read_text(encoding="utf-8")
    assert "check_health" in content


def test_deployment_docs_exist():
    docs_path = PROJECT_ROOT / "docs" / "DEPLOYMENT.md"
    assert docs_path.exists(), "docs/DEPLOYMENT.md is missing"
    assert docs_path.stat().st_size > 1000
