# WEPSUN Engineering Solutions — Enterprise Database Architecture & Production Runbook

## 1. Executive Summary & Architecture Overview

The WEPSUN Engineering Solution Lift Service & AMC Management Platform is powered by an enterprise-grade relational database architecture designed for high throughput, strict multi-tenancy, sub-50ms query latency, and offline resilience across field mobile devices.

### Technology Stack
- **Primary Database Engine:** PostgreSQL 15 / 16
- **Cloud Database Hosting Provider:** Supabase (Enterprise Managed PostgreSQL)
- **Object-Relational Mapping (ORM):** Prisma ORM v6
- **Connection Pooling & Concurrency Manager:** PgBouncer (Port 6543, Transaction Mode)
- **Direct Migration Gateway:** PostgreSQL Direct Connection (Port 5432, `DIRECT_URL`)
- **Push Notification Engine:** Firebase Cloud Messaging (FCM)
- **Offline Client Storage Engine:** Browser Native IndexedDB (`wepsun_offline_v2`)
- **Real-time Synchronization:** Server-Sent Events (SSE) + Event-Driven Invalidation

---

## 2. Dual Connection String Architecture

Prisma and PostgreSQL use two isolated connection strings to guarantee connection pooling scalability while preventing transactional migration deadlocks:

```env
# 1. Pooled Connection (Used by backend API runtime for high concurrent throughput)
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# 2. Direct Connection (Used exclusively by Prisma CLI for DDL migrations & schema sync)
DIRECT_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].supabase.com:5432/postgres?sslmode=require"
```

### Key Rules:
1. **Never use PgBouncer port 6543 for migrations:** PgBouncer in transaction pooling mode does not support advisory locks (`pg_advisory_lock`), which Prisma requires to manage migration state.
2. **Always enable SSL (`sslmode=require`):** Enforces TLS 1.3 encryption in transit for all database queries.
3. **No Database Migration to NoSQL:** The relational integrity between Lifts, AMC Contracts, Maintenance Schedules, and Invoices requires PostgreSQL ACID compliance. MongoDB, MySQL, and Firestore are strictly prohibited.

---

## 3. Database Security & Access Control

### 3.1 Role-Based Access Control (RBAC)
WEPSUN enforces 7 authoritative business roles:
1. **SUPER_ADMIN / MASTER_ADMIN:** Global platform visibility across all companies.
2. **COMPANY_ADMIN:** Full operational and financial management scoped to their tenant company.
3. **SERVICE_MANAGER:** Dispatching, technician assignments, and AMC contract approval.
4. **TECHNICIAN:** View assigned tickets, submit digital service reports, update equipment status, and log GPS check-ins.
5. **CLIENT:** View registered lifts, log breakdown/emergency requests, review quotations/invoices, and rate completed jobs.
6. **ACCOUNTS:** Invoicing, GST ledger, and payment verification.
7. **SALES:** Lead conversion and quotation authoring.

### 3.2 PostgreSQL Row-Level Security (RLS)
The script located at `scripts/setup-enterprise-rls.sql` configures native PostgreSQL Row-Level Security for direct Supabase access:
- **Tenant Isolation:** Enforces `company_id = auth.jwt() ->> 'companyId'` on every SELECT, UPDATE, and DELETE.
- **Service Role Bypass:** Allows the backend server (`service_role` and `postgres` roles) full query execution without artificial constraints.
- **Client Equipment Scoping:** Clients can only query lifts, complaints, and service reports matching their `client_id`.
- **Technician Ticket Scoping:** Field engineers can only access complaints assigned to their `technician_id` or unassigned in their assigned branch.
- **Audit Log Immutability:** Explicit `USING (false)` policies block any `UPDATE` or `DELETE` operations on `audit_logs`.

To deploy RLS policies to Supabase:
```bash
# In the Supabase SQL Editor or via psql:
\i scripts/setup-enterprise-rls.sql
```

---

## 4. Complete Audit Trail System

Every business mutation creates an immutable audit record in the `audit_logs` table:
- **Who:** `userId`, `performedBy`, `userRole`
- **What:** `entityType`, `entityId`, `action`
- **When:** `timestamp` (ISO-8601 UTC)
- **State Diff:** `previousValues` (JSON before mutation) and `newValues` (JSON after mutation)
- **Metadata:** `ipAddress` (sanitized client IP) and `userAgent`
- **Details:** Human-readable summary of the action

### Immutability Guarantee
- **API Level:** Any `PUT`, `POST`, `PATCH`, or `DELETE` sent to `/api/audit` returns `HTTP 405 Method Not Allowed` (`code: IMMUTABLE_RECORD`).
- **Database Level:** PostgreSQL RLS policy `audit_logs_no_update` and `audit_logs_no_delete` reject modification attempts.

### Audited Operations:
1. **Complaints & Breakdowns:** Creation, Emergency SOS triggers, Technician Assignment, Status Updates, Resolution, Closure.
2. **Service Reports:** Sign-off, Client OTP Verification, Parts Consumption.
3. **Technicians:** Onboarding approval, Blocking, Unblocking.
4. **Finance:** Invoice generation, Payment verification.
5. **Inventory:** Stock purchase, Workshop issue, Field consumption ledger.

---

## 5. Performance Optimization & Indexing

High-performance composite indexes are deployed across all high-frequency query paths:

| Table | Index Columns | Purpose |
|---|---|---|
| `complaints` | `(company_id, is_emergency, status)` | Instant filtering of active emergency breakdowns |
| `complaints` | `(company_id, reported_at DESC)` | High-speed complaint feed pagination |
| `complaints` | `(lift_id, status)` | Fast equipment active ticket check |
| `lifts` | `(building_id)` / `(client_id)` | Fast lookup of client equipment inventories |
| `lifts` | `(current_status)` / `(amc_status)` | Real-time breakdown and AMC status aggregations |
| `amc_contracts` | `(company_id, client_id, status)` | Fast client contract & expiry queries |
| `invoices` | `(company_id, client_id, status)` | Client billing history and overdue invoice queries |
| `inventory_parts` | `(company_id, current_stock, min_stock_threshold)` | Real-time low-stock alerts without table scans |
| `service_reports` | `(company_id, technician_id, service_date DESC)` | Technician performance & service history retrieval |
| `audit_logs` | `(company_id, entity_id)` / `(company_id, timestamp DESC)` | Paginated, indexed audit trail inspection |

### Slow Query Detection
`backend/src/lib/prisma.ts` includes automatic query execution monitoring:
- Queries exceeding 200ms trigger `[PRISMA SLOW QUERY]` warnings in production logs.
- Metric counter aggregates total queries, slow queries, failed queries, and average query latency.

---

## 6. Offline Data Synchronization Architecture

To support field technicians working in elevator shafts and basements without cellular connectivity, WEPSUN implements a resilient offline data engine:

```
[ Field Mobile App / Browser ]
           │
  (Offline Mutation)
           │
           ▼
[ Native IndexedDB: 'wepsun_offline_v2' ]
   ├── Store: 'entities'     (High-capacity cache for Lifts, Complaints, AMC, Inventory)
   └── Store: 'sync_queue'   (Transactional FIFO mutation ledger with UUID & Idempotency Key)
           │
   (Network Reconnected)
           │
           ▼
[ OfflineSyncEngine (syncQueue.ts) ]
   ├── Exponential Backoff Retry (1s, 2s, 4s, 8s, up to 30s)
   ├── Idempotency Check ('x-idempotency-key' header prevents duplicate submissions)
   ├── Conflict Detection (Compares server 'updatedAt' timestamp)
   └── Real-time Sync Status Indicator ('idle' | 'syncing' | 'synced' | 'error' | 'offline')
           │
           ▼
[ Production Backend & PostgreSQL Database ]
```

### Safety Rules:
1. **Never Silently Discard Data:** Offline actions remain safely stored in IndexedDB until confirmed by the central backend.
2. **Duplicate Submission Prevention:** Every mutation generates an `x-idempotency-key` UUID so retries never create duplicate tickets or invoices.
3. **Conflict Resolution:** If a record was modified concurrently on the server while the technician was offline, server authoritative data is merged while preserving field notes and signatures.

---

## 7. Production Health & Monitoring Endpoints

| Endpoint | Probe Type | Purpose | Output |
|---|---|---|---|
| `GET /api/health` | Liveness Probe | Cloud load balancer & watchdog heartbeat | Uptime, Memory (RSS/Heap), RBAC status, Service version |
| `GET /api/health/db` | Readiness Probe | Validates live PostgreSQL & table health | Ping latency (ms), DB version, PgBouncer pooling mode, Table inventory counts |
| `GET /api/health/metrics` | Telemetry Probe | Performance & latency diagnostics | Total queries, Slow queries, Failed queries, Avg latency, Recent slow query list |

---

## 8. Backup, PITR & Disaster Recovery Runbook

### 8.1 Automated Supabase Cloud Backups
- **Daily Automated Backups:** Supabase executes automated daily full database snapshots retained for 7 to 30 days depending on the compute plan.
- **Point-In-Time Recovery (PITR):** Continuous Write-Ahead Log (WAL) archiving allows restoring the database to any exact second within the retention window.

### 8.2 Enabling Point-In-Time Recovery (PITR) in Supabase Dashboard:
1. Navigate to **Supabase Dashboard** -> Select Project `wepsun`.
2. Go to **Settings** -> **Database** -> **Backups**.
3. Enable **Point in Time Recovery (PITR)**.
4. Set WAL retention period (7 or 14 days).

### 8.3 CLI Disaster Recovery Utility
A Node/TypeScript utility is provided in the repository:
```bash
# 1. Verify live database referential integrity & table counts:
npx tsx scripts/db-backup-restore.ts verify

# 2. Export complete JSON data snapshot to backups/:
npx tsx scripts/db-backup-restore.ts backup
```

### 8.4 Disaster Recovery Procedure (Step-by-Step)
In the event of accidental data corruption or catastrophic hardware failure:

1. **Isolate Traffic:** Place the application into maintenance mode or point DNS to maintenance page.
2. **Identify Target Timestamp:** Inspect `/api/audit` or the database audit trail to find the exact timestamp immediately preceding the incident.
3. **Execute PITR Restoration:**
   - In Supabase Dashboard -> **Database** -> **Backups** -> Select **Restore to point in time**.
   - Input the target timestamp (UTC) and confirm restore.
4. **Verify Integrity:**
   ```bash
   npx tsx scripts/db-backup-restore.ts verify
   ```
5. **Run Migrations (if schema was affected):**
   ```bash
   npx prisma migrate deploy
   ```
6. **Resume Traffic:** Re-enable cloud load balancer routing.

---

## 9. Safe Migration Guidelines (Zero-Downtime)

1. **Always test migrations in a staging branch first.**
2. **Never execute destructive operations in a single migration:**
   - Do not drop columns immediately. Instead: Add new column -> Backfill -> Deprecate old column -> Drop in later release.
3. **Command to apply migrations using direct URL:**
   ```bash
   npx prisma migrate deploy
   ```
4. **Never run `prisma db push --force-reset` in production.**
