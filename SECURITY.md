# Security Policy

## 🔒 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## 🛡️ Reporting a Vulnerability

If you discover a potential security vulnerability in this project, please notify the maintainer directly instead of opening a public GitHub issue.

- **Email**: `zeeshanazhar@example.com`
- **Response Window**: Security reports will be acknowledged within 48 hours, followed by a prioritized triage and patch release.

---

## 🔐 Security Measures Implemented

1. **Password Hashing**: Bcrypt with salt rounds = 10 for user credentials.
2. **Token Security**: Stateless JWTs with strict expiration windows and HMAC SHA-256 signatures.
3. **HTTP Hardening**: Helmet CSP, X-Frame-Options, X-Content-Type-Options, Cross-Origin-Opener-Policy.
4. **Input Sanitization**: Strict schema validation with Zod to block prototype pollution, SQL injection via Prisma parameterized queries, and unauthorized payloads.
5. **CORS Governance**: Whitelist-based or environment-controlled origin access policies.
