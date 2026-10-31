# LoopBill — Backend System Architecture

## 1. Architectural Philosophy

LoopBill is designed as a **Modular Monolith** adhering to strict layered separation of concerns. To ensure predictability, auditability, and ease of maintenance by a two-developer engineering team, business logic is decoupled from HTTP transport and persistence concerns.

```
┌────────────────────────────────────────────────────────┐
│                   HTTP Request                         │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 1. ROUTE LAYER: Express Endpoints & Route Guards      │
│    - Method & Path Matching (/api/v1/...)              │
│    - Middleware: Request ID, Timing, Auth, RBAC, Zod   │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. CONTROLLER LAYER: HTTP Request & Response Framing   │
│    - Extracts params, query, validated body            │
│    - Invokes Service functions                         │
│    - Returns standardized JSON envelopes ({ data, meta })│
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. SERVICE LAYER: Authoritative Domain Business Logic │
│    - Pure business rules & state machine enforcement   │
│    - Multi-step transactional boundaries               │
│    - Decimal currency calculations                     │
│    - Zero Express / HTTP dependencies                  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. REPOSITORY LAYER: Data Access & Tenant Isolation   │
│    - Prisma ORM query construction                     │
│    - Ownership filtering (WHERE customer_id = user_id) │
│    - Locking (FOR UPDATE SKIP LOCKED)                  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 5. DATABASE: PostgreSQL 16 (ACID Persistence)         │
│    - NUMERIC(12, 2) columns                            │
│    - Foreign Keys & Composite Uniqueness Constraints   │
│    - Advisory Locks for Billing Concurrency            │
└────────────────────────────────────────────────────────┘
```

---

## 2. Layer Responsibilities & Isolation Rules

1. **Routes (`src/modules/*/routes.ts`):**
   - Bind HTTP verbs and URI paths.
   - Attach middleware in strict order: `requestIdMiddleware` $\rightarrow$ `timingMiddleware` $\rightarrow$ `authMiddleware` $\rightarrow$ `rbacMiddleware` $\rightarrow$ `validateMiddleware(schema)`.
   - Never invoke repositories or database operations directly.

2. **Controllers (`src/modules/*/controller.ts`):**
   - Wrapped with `asyncHandler` to forward unhandled rejections to `error.middleware.ts`.
   - Parse inputs and format response envelopes: `{ data: ... , meta: ... }`.
   - Contain zero business rules or calculations.

3. **Services (`src/modules/*/service.ts`):**
   - Encapsulate domain rules: subscription state transitions, variant delta pricing, discount eligibility checking, and invoice snapshot creation.
   - Coordinate multi-entity database transactions using Prisma `$transaction`.
   - Never reference `req` or `res` objects.

4. **Repositories (`src/modules/*/repository.ts`):**
   - Abstract all Prisma operations.
   - Enforce customer-level tenancy checks (`WHERE customer_id = auth_user_id`).
   - Implement pagination with `take` and `skip`.

5. **Common Utilities (`src/common/*`):**
   - `money/money.ts`: Shared decimal arithmetic functions using `decimal.js`.
   - `errors/app-error.ts`: Standardized error hierarchy with HTTP status codes and error codes.
   - `dates/dates.ts`: UTC date calculations and month-end clamping helpers.
   - `pagination/pagination.ts`: Pagination parameter parsing and metadata calculation.

---

## 3. Financial Engineering & Calculations

- **Precision Guarantee:** Floating-point operations (`+`, `-`, `*`, `/`) on numbers are prohibited for financial calculations.
- **Library Standard:** All money operations use `Decimal` from `decimal.js` or Prisma client.
- **Authoritative Price Formula:**
  $$\text{Unit Price} = \text{Product Sales Price} + \text{Variant Price Delta}$$
- **Authoritative Line Total Formula:**
  $$\text{Line Subtotal} = (\text{Unit Price} \times \text{Quantity}) - \text{Discount Amount}$$
  $$\text{Line Tax} = \text{Line Subtotal} \times \left(\frac{\text{Tax Rate}}{100}\right)$$
  $$\text{Line Total} = \text{Line Subtotal} + \text{Line Tax}$$
- **Rounding:** Rounded to 2 decimal places using `ROUND_HALF_UP` only when persisting or presenting final amounts.

---

## 4. Security Architecture

1. **Authentication:**
   - Stateless session token (JWT) signed with `HS256` stored in an `httpOnly`, `SameSite=Lax`, secure cookie named `loopbill_token`.
   - Token payload includes `userId`, `email`, and `role`.
2. **Authorization (RBAC):**
   - Middleware inspects `req.user.role` against required roles: `ADMIN`, `STAFF`, `CUSTOMER`.
   - Denied requests throw `AppError.forbidden("Access denied for role")`.
3. **Tenant Data Isolation (IDOR Protection):**
   - Customer endpoints automatically bind `customer_id` from the authenticated user token.
   - Attempts to access other customer records resolve to `404 Not Found` rather than `403 Forbidden` to prevent resource enumeration.
4. **Input Validation:**
   - Every mutating request body and query parameter is strictly validated against a Zod schema. Extra properties are stripped.

---

## 5. Billing Engine & Concurrency Design

1. **PostgreSQL Advisory Lock:** The billing engine acquires a session-level advisory lock (`pg_try_advisory_lock(987654321)`) prior to batch processing to ensure only one billing runner executes at any given second.
2. **Row-Level Locking:** Subscriptions are fetched and locked using `SELECT ... FOR UPDATE SKIP LOCKED` in batches of 200 to prevent concurrent worker conflicts.
3. **Idempotency Invariant:** A partial unique index on `(subscription_id, billing_period_start)` for non-cancelled invoices guarantees that duplicate invoices can never be generated.
