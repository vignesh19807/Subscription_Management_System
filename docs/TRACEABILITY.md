# LoopBill — Requirements Traceability Matrix

This matrix maps every functional requirement (FR), business rule (BR), and non-functional requirement (NFR) to its corresponding API endpoint, database entity, and test verification identifier.

| Req ID | Requirement Description | API / Operation | Database Table(s) | Test ID | Status |
|---|---|---|---|---|:---:|
| **FR-001** | Customer Registration | `POST /api/v1/auth/register` | `users` | `TEST-AUTH-001` | *Planned* |
| **FR-002** | User Login & Session Cookie | `POST /api/v1/auth/login` | `users` | `TEST-AUTH-002` | *Planned* |
| **FR-003** | Password Reset & Outbox | `POST /api/v1/auth/forgot-password` | `password_reset_tokens`, `email_logs` | `TEST-AUTH-003` | *Planned* |
| **FR-004** | Admin Staff Provisioning | `POST /api/v1/users/staff` | `users` | `TEST-AUTH-004` | *Planned* |
| **FR-005** | Product CRUD & Pricing | `POST/GET /api/v1/catalog/products` | `products` | `TEST-CAT-001` | *Planned* |
| **FR-006** | Variant Surcharge (+₹560) | `POST /api/v1/catalog/variants` | `product_variants` | `TEST-CAT-002` | *Planned* |
| **FR-007** | Recurring Plan Scheduling | `POST/GET /api/v1/plans` | `plans` | `TEST-PLAN-001` | *Planned* |
| **FR-008** | Tax Rule Definition | `POST/GET /api/v1/taxes` | `tax_rules` | `TEST-TAX-001` | *Planned* |
| **FR-009** | Discount Configuration | `POST/GET /api/v1/discounts` | `discount_rules` | `TEST-DISC-001` | *Planned* |
| **FR-010** | Quotation Templates | `POST/GET /api/v1/templates` | `quotation_templates`, `quotation_template_lines` | `TEST-TMPL-001` | *Planned* |
| **FR-011** | Quotation Generation (`SUB-...`)| `POST /api/v1/subscriptions` | `subscriptions`, `subscription_lines` | `TEST-SUB-001` | *Planned* |
| **FR-012** | Subscription State Transitions | `POST /api/v1/subscriptions/:id/transition` | `subscriptions`, `subscription_events` | `TEST-SUB-002` | *Planned* |
| **FR-013** | Subscription Pausing | `POST /api/v1/subscriptions/:id/pause` | `subscriptions`, `subscription_events` | `TEST-SUB-003` | *Planned* |
| **FR-014** | Billing Day Dry-Run Mode | `POST /api/v1/billing/dry-run` | Zero tables modified (In-memory simulation) | `TEST-BILL-001` | *Planned* |
| **FR-015** | Idempotent Billing Execution | `POST /api/v1/billing/execute` | `invoices`, `invoice_lines`, `subscriptions` | `TEST-BILL-002` | *Planned* |
| **FR-016** | Invoice Lifecycle & Snapshots | `GET/POST /api/v1/invoices/:id` | `invoices`, `invoice_lines` | `TEST-INV-001` | *Planned* |
| **FR-017** | Payment Ledger Recording | `POST /api/v1/payments` | `payments`, `invoices` | `TEST-PAY-001` | *Planned* |
| **FR-018** | Customer Portal Isolated View | `GET /api/v1/portal/subscriptions` | `subscriptions`, `invoices` | `TEST-PORT-001` | *Planned* |
| **FR-019** | Customer Add-on Scheduling | `POST /api/v1/portal/addons` | `subscription_lines` | `TEST-PORT-002` | *Planned* |
| **FR-020** | Finance Dashboard Aggregations | `GET /api/v1/analytics/dashboard` | `invoices`, `payments`, `subscriptions` | `TEST-FIN-001` | *Planned* |
| **FR-021** | Simulated Outbox Inspection | `GET /api/v1/outbox` | `email_logs` | `TEST-OUT-001` | *Planned* |
| **BR-001** | Additive Variant Calculation | `PricingCalculator.calculateLineItem()` | N/A (Shared Service) | `TEST-UNIT-MONEY-001` | **Verified** |
| **BR-002** | Decimal Fixed-Point Rounding | `Money.round()`, `Money.multiply()` | All numeric tables (`DECIMAL(12,2)`) | `TEST-UNIT-MONEY-002` | **Verified** |
| **BR-006** | Billing Period Uniqueness | DB Partial Unique Index on `(subscription_id, billing_period_start) WHERE status <> 'CANCELLED'` | `invoices` | `TEST-CONC-BILL-001` | **Verified** (DB Index) |
| **BR-007** | Derived Settlement (`PAID`) | `PaymentService.recordPayment()` | `invoices`, `payments` | `TEST-PAY-002` | *Planned* |
| **BR-008** | Dynamic Overdue Calculation | `InvoiceRepository.findOverdue()` | `invoices` | `TEST-INV-002` | *Planned* |
| **BR-011** | Month-End Date Clamping | `Dates.addBillingPeriod()` | `subscriptions` | `TEST-UNIT-DATE-001` | **Verified** |
| **BR-012** | 5-Stage Line Calculation & Discount Capping | `Money.calculateLineItem()` | `invoice_lines`, `subscription_lines` | `TEST-UNIT-MONEY-003` | **Verified** (₹33,134.40 benchmark) |
| **SEC-001** | Financial & Audit Immutability | Runtime user `DELETE` revocation | `invoices`, `payments`, `audit_logs`, `invoice_lines`, `subscription_events` | `TEST-INT-SEC-001` | **Verified** (Role Denial) |
| **IDX-001** | Composite Query Indexes | Multi-column B-tree indexes | `subscriptions`, `invoices` | `TEST-INT-SEC-002` | **Verified** (pg_indexes) |
| **SCH-001** | Audit & Traceability Fields | `passwordChangedAt`, `usedAt`, `recordedById`, `bodyHtml`, `actionLink` | `users`, `password_reset_tokens`, `payments`, `email_logs` | `TEST-INT-SEC-003` | **Verified** (Catalog & Model) |
| **NFR-001** | Latency Tracking Header | `timingMiddleware` (`X-Response-Time`) | HTTP Headers | `TEST-INT-HEALTH-001` | **Verified** |
