import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_auth_login_default_admin():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@econocausal.ai", "password": "AdminPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0

def test_auth_login_invalid_password():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@econocausal.ai", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_auth_login_nonexistent_user():
    response = client.post(
        "/api/auth/login",
        json={"email": "ghost@econocausal.ai", "password": "AnyPassword123!"},
    )
    assert response.status_code == 401

def test_auth_register_new_user():
    email = "researcher_test@econocausal.ai"
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Test Quantitative Researcher",
            "role": "quant",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert data["full_name"] == "Test Quantitative Researcher"
    assert "id" in data
    assert "api_key" in data

    # Test registration with duplicate email
    dup_res = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "AnotherPassword123!",
        },
    )
    assert dup_res.status_code == 400

def test_auth_me_with_bearer_token():
    # Login as admin
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@econocausal.ai", "password": "AdminPass123!"},
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@econocausal.ai"
    assert data["is_admin"] is True

def test_auth_me_unauthorized():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_auth_me_with_api_key():
    # Login as admin to get API key
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@econocausal.ai", "password": "AdminPass123!"},
    )
    token = login_res.json()["access_token"]
    user_data = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    ).json()

    api_key = user_data["api_key"]
    response = client.get(
        "/api/auth/me",
        headers={"X-API-Key": api_key},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "admin@econocausal.ai"

def test_auth_refresh_token_flow():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@econocausal.ai", "password": "AdminPass123!"},
    )
    refresh_token = login_res.json()["refresh_token"]

    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_auth_rotate_api_key():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "quant@econocausal.ai", "password": "QuantPass123!"},
    )
    token = login_res.json()["access_token"]

    response = client.post(
        "/api/auth/api-keys",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["api_key"].startswith("ec_live_")

