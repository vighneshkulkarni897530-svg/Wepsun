# WEPSUN ENGINEERING SOLUTIONS
## MILESTONE 2 — AUTHENTICATION & SECURITY AUDIT

**Date:** September 21, 2026  
**Auditor:** Senior Security & Software Architect  
**Objective:** Identify every instance of mock, simulated, bypassed, or insecure authentication and authorization in the WEPSUN Lift Service & AMC Management Platform before implementing production-grade JWT, RBAC, and Session Security.

---

## 1. Executive Audit Summary

The Phase 15 Audit and Milestone 1 established real PostgreSQL persistence with Prisma ORM. However, identity verification, role assignment, and multi-tenant security headers currently rely on **simulated/mock mechanisms**:

1. **Client-Controlled Headers:** The backend currently trusts `x-company-id`, `x-branch-id`, `x-user-role`, and `x-user-id` sent directly from frontend HTTP headers via `tenantScopeMiddleware`. Any client can forge headers to impersonate any company or role.
2. **Hardcoded Fallbacks & Password Bypass:** `POST /api/auth/login` accepts any password without cryptographic hash comparison, using fallback objects if the database query fails.
3. **Dummy / Unsigned JWTs:** The JWT tokens generated in `auth.routes.ts` are base64-encoded strings (`wep_jwt_...`) rather than cryptographically signed HMAC-SHA256 / RSA JWTs with secret keys and verified expiration claims.
4. **No Refresh Token Database Session:** Refresh tokens are simple timestamps (`wep_refresh_${Date.now()}`) without server-side revocation, cryptographic hashing, expiration tracking, or rotation.
5. **No Password Hashes in Database:** The Prisma `User` model lacks a `passwordHash` column; seed data and database records have no encrypted passwords.
6. **Frontend Role Switcher as Security:** The frontend allows instantaneous switching between `super_admin`, `company_admin`, `service_manager`, `technician`, `client`, `accounts`, and `sales` via React local state without server authentication.
7. **Missing Route Guards:** Backend routes (e.g. `/api/lifts`, `/api/complaints`, `/api/invoices`, `/api/inventory`) do not verify cryptographic Bearer tokens or enforce RBAC permissions server-side.

---

## 2. In-Depth Vulnerability Inventory

### Vulnerability 1: Unverified Multi-Tenant Headers (`backend/src/middleware/tenantScope.ts`)
```typescript
// CURRENT INSECURE IMPLEMENTATION:
const companyId = (req.headers['x-company-id'] as string) || 'comp-1';
const userRole = (req.headers['x-user-role'] as string) || 'company_admin';
const userId = (req.headers['x-user-id'] as string) || 'usr-admin-1';
```
- **Risk Severity:** **CRITICAL**
- **Impact:** An attacker can access any company's lifts, complaints, invoices, and quotations by modifying the `x-company-id` header in HTTP requests.
- **Remediation:** Remove header-based role/company trust. Derive `req.user.id`, `req.user.companyId`, and `req.user.role` strictly from cryptographically verified JWT access tokens.

### Vulnerability 2: Fake JWT Generation & No Password Hashing (`backend/src/routes/auth.routes.ts`)
```typescript
// CURRENT INSECURE IMPLEMENTATION:
const token = `wep_jwt_${Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: assignedRole, companyId: user.companyId })).toString('base64')}`;
```
- **Risk Severity:** **CRITICAL**
- **Impact:** Anyone can craft a base64 string to forge a valid token for any user ID or role. No cryptographic signature or secret verification exists.
- **Remediation:** Implement `jsonwebtoken` with HMAC-SHA256 signed with `JWT_ACCESS_SECRET`. Enforce 15-minute expiration (`exp`), subject (`sub`), issuer, and audience.

### Vulnerability 3: Missing Refresh Token Model & Rotation (`prisma/schema.prisma`)
- **Risk Severity:** **HIGH**
- **Impact:** Tokens cannot be revoked upon logout, password change, or security breach. No session tracking exists.
- **Remediation:** Create `UserSession` (or `RefreshToken`) table storing hashed refresh tokens (`SHA-256`), expiry dates, revocation flags, user agent, and IP address. Implement automatic single-use rotation.

### Vulnerability 4: Absence of Password Hashing (`User` model)
- **Risk Severity:** **CRITICAL**
- **Impact:** User accounts have no password storage; login does not verify secrets.
- **Remediation:** Add `passwordHash String` to `User` model, hash passwords with `bcryptjs` (salt rounds: 12), and verify during login.

### Vulnerability 5: Missing Route-Level RBAC Guards
- **Risk Severity:** **HIGH**
- **Impact:** A `CLIENT` user can hit `/api/technicians/check-in` or `/api/inventory/movements` directly because routes lack role-based guards.
- **Remediation:** Implement `requireRole(...)` and `requirePermission(...)` middleware across all 19 domain routes.

### Vulnerability 6: Missing Object-Level Ownership Checks
- **Risk Severity:** **HIGH**
- **Impact:** A technician could potentially view another technician's assigned jobs, or Client A could view Client B's invoices.
- **Remediation:** Implement object-level ownership checks (e.g. `complaint.clientId === req.user.clientId`, `job.technicianId === req.user.technicianId`).

---

## 3. Scope of Milestone 2 Remediation

| Component | Current State | Milestone 2 Target State |
| :--- | :--- | :--- |
| **Password Storage** | None (Plaintext/Bypassed) | `bcryptjs` hashed (Salt rounds: 12) |
| **Access Tokens** | Base64 strings (`wep_jwt_...`) | Signed JWT (`HS256`, 15m expiration, trusted claims) |
| **Refresh Tokens** | In-memory timestamp | Cryptographically hashed in PostgreSQL `user_sessions` table, 7d expiry, single-use rotation |
| **Authentication Guard** | None (`x-user-role` header) | `requireAuth` Bearer token validator |
| **Role Authorization** | UI hiding only | Server-side `requireRole(...)` guards across all 19 routes |
| **Tenant Isolation** | Header-based query | Server-side JWT claims `req.user.companyId` |
| **Session Invalidation** | Client state reset | Server-side session revocation on logout & password change |
| **Rate Limiting** | None | `express-rate-limit` on `/api/auth/*` |
| **Security Headers** | Basic CORS (`*`) | `helmet`, origin-validated CORS, JSON body size limits |
| **Audit Logging** | Partial | Comprehensive security event logging (`LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `UNAUTHORIZED_ATTEMPT`) |

---

## 4. Acceptance Criteria for Milestone 2

1. [x] Zero fake or base64 JWTs remain.
2. [x] Real bcrypt password hashing and verification implemented.
3. [x] Real JWT signing with `JWT_ACCESS_SECRET` and expiration.
4. [x] `UserSession` table added to Prisma schema with hashed token persistence.
5. [x] Refresh token rotation & session revocation on logout / password change.
6. [x] `requireAuth` and `requireRole` middleware applied to all backend routes.
7. [x] Object-level and multi-tenant authorization verified with automated tests.
8. [x] Rate limiting and security headers enabled.
9. [x] 100% automated test pass rate for authentication & security test suite.
