# LoopBill — REST API Specification (v1)

**Base URL:** `/api/v1`<br>
**Protocol:** HTTPS / REST<br>
**Authentication:** HTTP-only `loopbill_token` JWT cookie<br>
**Response Headers:**
- `X-Request-Id`: Unique UUID per request for distributed tracing
- `X-Response-Time`: Server response time in milliseconds (e.g., `12.4ms`)

---

## 1. Standard Response Formats

### Success Envelope (HTTP 200 / 201)
```json
{
  "data": {
    "id": "c1f7b02e-9d2a-4c22-b9e7-5789f2d12e45",
    "name": "Cloud Backup Standard"
  },
  "meta": {
    "timestamp": "2026-10-31T08:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Paginated List Envelope (HTTP 200)
```json
{
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalRecords": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    },
    "timestamp": "2026-10-31T08:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Error Envelope (HTTP 4xx / 5xx)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": {
      "password": ["Password must contain at least 9 characters"]
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-10-31T08:00:00.000Z"
  }
}
```

---

## 2. Implemented Endpoints (Phase 1)

### `GET /api/v1/health`
Checks server and database availability.

- **Access:** Public (No authentication required)
- **Response (HTTP 200):**
```json
{
  "data": {
    "status": "UP",
    "timestamp": "2026-10-31T08:00:00.000Z",
    "database": "CONNECTED",
    "uptimeSeconds": 142.5
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

---

## 3. Planned Endpoints (Phases 2–7)

- `POST /api/v1/auth/register` (Public customer signup)
- `POST /api/v1/auth/login` (Authentication & cookie issuance)
- `POST /api/v1/auth/logout` (Cookie invalidation)
- `POST /api/v1/auth/forgot-password` (Outbox reset email dispatch)
- `POST /api/v1/users/staff` (Admin-only staff provisioning)
- `POST /api/v1/catalog/products` (Product catalog management)
- `POST /api/v1/catalog/variants` (Variant pricing deltas, e.g. +₹560)
- `POST /api/v1/plans` (Recurring plan scheduling & flags)
- `POST /api/v1/taxes` & `POST /api/v1/discounts` (Tax & discount rules)
- `POST /api/v1/templates` (Quotation templates)
- `POST /api/v1/subscriptions` (Quotation & subscription management)
- `POST /api/v1/subscriptions/:id/transition` (Lifecycle states)
- `POST /api/v1/billing/dry-run` (Zero-write billing simulation)
- `POST /api/v1/billing/execute` (Idempotent billing run)
- `GET /api/v1/invoices` & `GET /api/v1/invoices/:id` (Invoice snapshots)
- `POST /api/v1/payments` (Payment ledger entries)
- `GET /api/v1/portal/subscriptions` (Customer self-service portal)
- `GET /api/v1/analytics/dashboard` (Real-time financial aggregations)
- `GET /api/v1/outbox` (Simulated email outbox drawer)
