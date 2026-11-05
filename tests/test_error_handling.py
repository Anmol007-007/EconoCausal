import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.exceptions import (
    EconoCausalException,
    ModelNotFittedError,
    InvalidDatasetError,
    InfeasibleAllocationError,
    AuthenticationError,
    PermissionDeniedError,
    ResourceNotFoundError,
    RateLimitExceededError,
)

client = TestClient(app)

def test_exception_classes_attributes():
    e1 = ModelNotFittedError()
    assert e1.status_code == 400
    assert e1.error_code == "MODEL_NOT_FITTED"

    e2 = InvalidDatasetError("Bad data", details={"column": "treatment"})
    assert e2.status_code == 422
    assert e2.details["column"] == "treatment"

    e3 = InfeasibleAllocationError()
    assert e3.status_code == 422
    assert e3.error_code == "INFEASIBLE_ALLOCATION"

    e4 = AuthenticationError()
    assert e4.status_code == 401

    e5 = PermissionDeniedError()
    assert e5.status_code == 403

    e6 = ResourceNotFoundError()
    assert e6.status_code == 404

    e7 = RateLimitExceededError()
    assert e7.status_code == 429

def test_validation_error_handler():
    response = client.post("/api/uplift", json={"n_estimators": 2})
    assert response.status_code == 422
    data = response.json()
    assert data["status"] == "error"
    assert data["error_code"] == "VALIDATION_ERROR"
    assert "errors" in data
    assert any("n_estimators" in err["field"] for err in data["errors"])

def test_unhandled_route_not_found():
    response = client.get("/api/nonexistent/route")
    assert response.status_code == 404
