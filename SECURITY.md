# Security Policy & Vulnerability Disclosure

**EconoCausal** is committed to ensuring the security, integrity, and privacy of enterprise pricing, causal inference, and promotional optimization data.

---

## 1. Supported Versions

Security updates and patches are actively maintained for the following versions:

| Version | Supported | Notes |
|:---:|:---:|:---|
| **2.0.x** | ✅ Yes | Current production release |
| **1.0.x** | ❌ No | Deprecated; upgrade to v2.0+ recommended |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or potential threat within EconoCausal, please follow these steps:

1. **Do not create a public GitHub issue.**
2. Send a detailed report via email to: `security@econocausal.ai` (or `anmolsoniaids09@gmail.com`).
3. Include the following details in your report:
   - Vulnerability classification (e.g., OWASP category, CWE identifier).
   - Component affected (e.g., API router, authentication middleware, database query).
   - Step-by-step reproduction steps or proof-of-concept (PoC) payload.
   - Potential business or technical impact.
4. You will receive an initial response acknowledging your report within **24 hours**.
5. Critical vulnerabilities will be triaged and hotfixed within **72 hours**.

---

## 3. Security Architecture & Controls

EconoCausal is engineered following industry best practices and the **OWASP Top 10** guidelines:

### A. Authentication & Credential Management
- **Password Storage**: Passwords are never stored in plaintext. They are salted and hashed using `bcrypt` configured with a cost factor of **12 rounds**.
- **Password Policy**: Minimum 8 characters with at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special symbol (`[@$!%*?&_\\-#^]`).
- **Brute-Force Lockout**: Accounts are automatically locked for **15 minutes** after 5 consecutive failed login attempts within a 15-minute window, returning HTTP status code `423 Locked`.
- **Timing-Attack Resistance**: API keys and cryptographic tokens are verified using Python's constant-time comparison primitive (`secrets.compare_digest`).
- **Session Tokens**: Industry-standard JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`). Access tokens expire in 60 minutes; refresh tokens expire in 7 days.

### B. Transport & Network Security
- **Strict HTTPS**: Enforced in production via `HTTPSRedirectMiddleware`.
- **HSTS**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` header guarantees encrypted connections.
- **Content-Security-Policy (CSP)**: Strict script, style, font, and connect origins to prevent cross-site scripting (XSS).
- **Anti-Clickjacking**: `X-Frame-Options: DENY` prevents framing or UI redressing attacks.
- **MIME Protection**: `X-Content-Type-Options: nosniff` mitigates content sniffing exploits.

### C. Input Sanitization & Payload Protection
- **CSV Formula Injection (CWE-1236)**: Uploaded CSV files undergo automated sanitization (`api/sanitizer.py`) escaping leading `=,+,-,@` characters to prevent formula execution in spreadsheet software.
- **Payload Size Guards**: Inbound request size is strictly constrained to 10MB (`MAX_UPLOAD_SIZE_BYTES`), returning `413 Payload Too Large` for oversized requests.
- **Rate Limiting**: Sliding-window rate limiters prevent denial-of-service (DoS) on compute-heavy DML and MILP endpoints (120 req/min default, 15 req/min compute-heavy).

### D. Data Persistence & Access Control
- **Parameterized SQL**: All database operations leverage asynchronous SQLAlchemy 2.0 ORM queries, eliminating SQL injection vectors.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions distinguishing `admin`, `quant`, and `analyst` roles. Sensitive administrative endpoints require verified admin tokens.
- **Comprehensive Audit Trail**: Mutating operations write an append-only audit log entry (`AuditLog`) recording timestamp, user ID, client IP, action, and target resource.

---

## 4. Automated Security Testing

EconoCausal maintains automated security verification in its CI/CD pipeline:
- **Bandit Security Scanner**: Scans backend Python code for insecure imports, hardcoded secrets, and unsafe execution (`bandit -r api/ src/`).
- **Security Audit Test Suite**: Automated unit and integration tests (`tests/test_security_audit.py`) validating lockout, complexity rules, constant-time comparisons, and headers on every build.

