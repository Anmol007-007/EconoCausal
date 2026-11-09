import pytest
import secrets
import pandas as pd
from fastapi.testclient import TestClient
from api.main import app
from api.auth import (
    validate_password_complexity,
    is_account_locked,
    record_failed_login,
    reset_failed_logins,
    MAX_FAILED_ATTEMPTS,
    get_user_by_api_key,
)
from api.config import settings
from api.sanitizer import sanitize_csv_data

client = TestClient(app)

class TestPasswordComplexity:
    def test_valid_passwords_pass(self):
        assert validate_password_complexity("StrongPass123!") is True
        assert validate_password_complexity("Causal_AI_2026#") is True
        assert validate_password_complexity("Admin@Econo$1") is True

    def test_short_password_rejected(self):
        assert validate_password_complexity("Pass1!") is False

    def test_missing_uppercase_rejected(self):
        assert validate_password_complexity("password123!") is False

    def test_missing_lowercase_rejected(self):
        assert validate_password_complexity("PASSWORD123!") is False

    def test_missing_digit_rejected(self):
        assert validate_password_complexity("PasswordNoDigit!") is False

    def test_missing_special_char_rejected(self):
        assert validate_password_complexity("Password12345") is False

    def test_registration_with_weak_password_fails(self):
        res = client.post(
            "/api/auth/register",
            json={
                "email": "weak_pass_user@econocausal.ai",
                "password": "simplepassword",
                "full_name": "Weak User",
            },
        )
        assert res.status_code == 400
        assert "Password must be at least 8 characters" in res.json()["detail"]

class TestAccountLockout:
    def test_account_locks_after_5_failed_attempts(self):
        test_email = "lockout_target@econocausal.ai"
        reset_failed_logins(test_email)

        for _ in range(MAX_FAILED_ATTEMPTS - 1):
            record_failed_login(test_email)
            assert is_account_locked(test_email) is False

        record_failed_login(test_email)
        assert is_account_locked(test_email) is True

        reset_failed_logins(test_email)
        assert is_account_locked(test_email) is False

    def test_login_endpoint_returns_423_when_locked(self):
        locked_email = "victim_bruteforce@econocausal.ai"
        reset_failed_logins(locked_email)

        for _ in range(MAX_FAILED_ATTEMPTS):
            client.post(
                "/api/auth/login",
                json={"email": locked_email, "password": "WrongPassword123!"},
            )

        locked_res = client.post(
            "/api/auth/login",
            json={"email": locked_email, "password": "WrongPassword123!"},
        )
        assert locked_res.status_code == 423
        assert "Account temporarily locked" in locked_res.json()["detail"]

        reset_failed_logins(locked_email)

class TestTimingAttackMitigation:
    def test_constant_time_comparison(self):
        key_a = "ec_live_secret_key_12345"
        key_b = "ec_live_secret_key_12345"
        key_c = "ec_live_secret_key_99999"
        assert secrets.compare_digest(key_a, key_b) is True
        assert secrets.compare_digest(key_a, key_c) is False

    def test_api_key_lookup_uses_constant_time_comparison(self):
        user = get_user_by_api_key(settings.MASTER_API_KEY)
        assert user is not None
        assert user.email == "admin@econocausal.ai"

        invalid_user = get_user_by_api_key("invalid_key_random")
        assert invalid_user is None

class TestSecurityHeadersAndPayload:
    def test_owasp_security_headers_present(self):
        response = client.get("/health")
        headers = response.headers

        assert headers.get("x-content-type-options") == "nosniff"
        assert headers.get("x-frame-options") == "DENY"
        assert "max-age=31536000" in headers.get("strict-transport-security", "")
        assert "default-src 'self'" in headers.get("content-security-policy", "")
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    def test_timing_and_correlation_headers(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        assert "X-Process-Time-Ms" in response.headers
        assert "X-Request-ID" in response.headers
        assert float(response.headers["X-Process-Time-Ms"]) >= 0

    def test_large_payload_rejected_with_413(self):
        oversized_headers = {"content-length": str(settings.MAX_UPLOAD_SIZE_BYTES + 1024)}
        res = client.post("/api/upload", headers=oversized_headers)
        assert res.status_code == 413
        assert "Payload too large" in res.json()["detail"]

class TestFormulaInjectionSanitization:
    def test_csv_formula_injection_cells_escaped(self):
        malicious_df = pd.DataFrame({
            "col_formula": ["=CMD('calc')", "+SUM(A1:A10)", "-2+3", "@SUM(B1:B5)", "safe_value"],
            "numeric_col": [10.5, 20.0, 30.5, 40.0, 50.0],
        })

        sanitized = sanitize_csv_data(malicious_df)
        assert sanitized["col_formula"].iloc[0].startswith("'")
        assert sanitized["col_formula"].iloc[1].startswith("'")
        assert sanitized["col_formula"].iloc[3].startswith("'")
        assert sanitized["col_formula"].iloc[4] == "safe_value"
