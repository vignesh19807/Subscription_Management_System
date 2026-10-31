# LoopBill — Implementation Status & Traceability Register

**Current Stage:** Phase 1 — Foundation, Database and Requirements<br>
**Active Lead Engineers:** Developer 1 (Backend Lead), Developer 2 (Frontend Lead)<br>
**Last Audit Timestamp:** 2026-10-31<br>

---

## 1. Classification Guidelines

- **Planned:** Architecture and specifications documented; source code not yet committed.
- **Implemented:** Code committed and running in repository; verification/tests pending completion.
- **Verified:** Implemented, verified against real PostgreSQL, and passing unit/integration acceptance tests.

---

## 2. Phase-by-Phase Implementation Status

| Phase | Module / Scope | Status | Notes / Blockers |
|---|---|---|---|
| Phase | Module / Scope | Status | Notes / Blockers |
|---|---|---|---|
| **Phase 1** | **Foundation, Database & Scaffolding** | **Verified** | Express, Prisma schema, PostgreSQL 16 Alpine, Money utils (₹33,134.40 benchmark), Non-superuser role separation, Financial DELETE protection, 35 CHECK constraints, Composite indexes |
| Phase 2 | Authentication, RBAC & Outbox | *Planned* | Registration, JWT cookies, 9+ char password, local outbox |
| Phase 3 | Catalog, Variants (+₹560), Plans & Discounts | *Planned* | Additive pricing, interval governance, discount limits |
| Phase 4 | Quotations & Subscription State Machine | *Planned* | Templates, sequential numbering (`SUB-...`), pausing logic |
| Phase 5 | Billing Day Engine & Idempotency | *Planned* | Dry-run mode, partial unique index, immutable snapshots |
| Phase 6 | Invoices, Payments Ledger & Finance APIs | *Planned* | Multi-method payments, derived PAID, computed OVERDUE |
| Phase 7 | Customer Portal APIs & Ownership Isolation | *Planned* | IDOR prevention (`WHERE customer_id = user_id`) |
| Phase 8 | Complete Integration & Security Testing | *Planned* | 17-step end-to-end journey validation |
| Phase 9 | Performance & Benchmarking (<2s SLA) | *Planned* | 10k+ subscription load seeder, EXPLAIN ANALYZE |
| Phase 10 | Final Delivery & Documentation | *Planned* | Demo seed data, deployment package |

---

## 3. Phase 1 Detailed Deliverables Checklist

- [x] Repository audit and Git branch confirmation (`feature/backend-foundation`)
- [x] Docker Compose configuration (`docker-compose.yml`) for PostgreSQL 16 Alpine
- [x] Native local PostgreSQL setup support (configured on port 5433)
- [x] Database security role separation: non-superuser runtime role (`loopbill_app`) and migration role (`loopbill`)
- [x] Financial & audit record protection: `DELETE` strictly revoked on `invoices`, `invoice_lines`, `payments`, `audit_logs`, `subscription_events`
- [x] Core Prisma schema encompassing all 17 entities with authoritative naming, relations, and audit fields (`passwordChangedAt`, `usedAt`, `recordedById`, `bodyHtml`, `actionLink`)
- [x] Corrective migrations (`20261031083542_schema_master_spec_corrections`, `20261031090401_schema_compliance_audit_fixes`)
- [x] Partial unique index on invoices (`unique_active_billing_period` WHERE `status <> 'CANCELLED'`)
- [x] High-frequency composite query indexes on `subscriptions` (`[status, nextBillingDate]`, `[customerId, status]`) and `invoices` (`[status, dueDate]`, `[customerId, status]`)
- [x] Strict TypeScript configuration (`tsconfig.json`)
- [x] ESLint flat config & Prettier code formatting
- [x] Zod environment variable parsing (`src/config/env.ts`)
- [x] Pino structured logger (`src/config/logger.ts`)
- [x] Prisma database client with lifecycle management & role routing (`src/config/db.ts`)
- [x] Shared `money.ts` authoritative 5-stage calculation with stage-by-stage `ROUND_HALF_UP` 2-decimal rounding
- [x] Shared `dates.ts` month-end clamping utility
- [x] Shared `pagination.ts` parameter parser and envelope generator
- [x] Standardized error classes & central error handling middleware
- [x] Request ID and timing headers (`X-Response-Time`, `X-Request-Id`)
- [x] Health check endpoint (`GET /api/v1/health`) verified with live HTTP response
- [x] Vitest test suite (34 passing tests across unit and integration suites)
- [x] PostgreSQL 16 Alpine Docker deployment and verification
- [x] GitHub Actions CI configuration (`.github/workflows/ci.yml`)
