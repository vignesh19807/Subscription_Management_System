# LoopBill — Requirements Specification & Role-Permission Matrix

## 1. Functional Requirements (FR)

| ID | Title | Description | Target Role |
|---|---|---|---|
| **FR-001** | User Registration | Public registration creating accounts with `CUSTOMER` role only. | Public |
| **FR-002** | User Login & Sessions | Credential-based authentication issuing secure HTTP-only cookies. | All |
| **FR-003** | Password Reset Flow | Request password reset token; logged to local Email Outbox. | All |
| **FR-004** | Admin Staff Creation | Provision internal `STAFF` accounts; restricted to `ADMIN`. | Admin |
| **FR-005** | Product Management | Create, update, view, and deactivate products with sales and cost prices. | Admin, Staff |
| **FR-006** | Product Variant Deltas| Define variant attributes and price surcharges (e.g. +₹560 for Odoo Brand). | Admin, Staff |
| **FR-007** | Plan Scheduling | Create recurring plans (Daily, Weekly, Monthly, Yearly) with governance flags. | Admin, Staff |
| **FR-008** | Tax Rule Configuration | Configure non-compounding percentage tax rules per product line. | Admin, Staff |
| **FR-009** | Discount Configuration | Configure percentage/fixed discounts with dates, min spend, and usage limits. | Admin, Staff |
| **FR-010** | Quotation Templates | Maintain reusable quotation templates with preset line items and terms. | Admin, Staff |
| **FR-011** | Quotation Generation | Issue quotations with auto-generated sequential numbers (`SUB-YYYY-XXXX`). | Admin, Staff |
| **FR-012** | Subscription Machine | Transition subscriptions: `DRAFT` $\rightarrow$ `QUOTATION` $\rightarrow$ `CONFIRMED` $\rightarrow$ `ACTIVE` $\rightarrow$ `CLOSED`. | Admin, Staff, Customer |
| **FR-013** | Subscription Pausing | Transition `ACTIVE` $\rightleftharpoons$ `PAUSED` strictly when allowed by plan flag (`allow_pause`). | Admin, Staff, Customer |
| **FR-014** | Billing Day Dry-Run | Preview billing run calculations without persisting any database changes. | Admin, Staff |
| **FR-015** | Idempotent Billing Run | Execute scheduled/manual billing runs, creating invoices with immutable snapshots. | System, Admin |
| **FR-016** | Invoice Lifecycle | Manage invoices: `DRAFT` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PAID` (or `CANCELLED`). | Admin, Staff |
| **FR-017** | Payment Recording | Record multi-method payments against confirmed invoices with balance validation. | Admin, Staff |
| **FR-018** | Customer Portal View | Customer view of personal subscriptions, invoices, and payment receipts. | Customer |
| **FR-019** | Customer Add-on Toggle | Customer toggle of add-ons scheduled for activation on next billing cycle. | Customer |
| **FR-020** | Finance Dashboard KPIs | Aggregate real-time metrics (Active subscriptions, MRR, ARR, collections, aging debt). | Admin, Staff |
| **FR-021** | Simulated Email Outbox | Internal ledger of dispatched system notifications for testing and audit. | Admin, Staff |

---

## 2. Business Rules (BR)

| ID | Title | Rule Definition |
|---|---|---|
| **BR-001** | Additive Variant Pricing | $\text{Unit Price} = \text{Product Sales Price} + \text{Variant Price Delta}$. Server is authoritative. |
| **BR-002** | Decimal Monetary Math | All monetary values must use fixed-point `DECIMAL(12, 2)` arithmetic; floating point is prohibited. |
| **BR-003** | Immutable Invoices | Invoice line items freeze product names, variant surcharges, unit prices, discounts, and taxes permanently. |
| **BR-004** | Single Discount Rule | Discounts do not stack. Only the single largest qualifying discount is applied. |
| **BR-005** | Transactional Discount Limits | Discount usage count is incremented upon invoice creation and decremented upon invoice cancellation. |
| **BR-006** | Billing Idempotency | Multiple billing executions on the same date for the same period will never generate duplicate invoices. |
| **BR-007** | Derived Settlement | `PAID` invoice status is derived when cumulative verified payments equal the invoice total. |
| **BR-008** | Dynamic Overdue | An invoice is `OVERDUE` if status is `CONFIRMED`, `current_date > due_date`, and `amount_paid < total_amount`. |
| **BR-009** | Payment Upper Bound | A payment entry cannot exceed the remaining outstanding balance of the target invoice. |
| **BR-010** | Add-on Next Cycle Rule | Add-on modifications made by customers take effect strictly from the subsequent billing period. |
| **BR-011** | Month-End Clamping | Monthly billing on the 31st advances to the last valid day of shorter months (e.g., Feb 28/29). |

---

## 3. Non-Functional Requirements (NFR)

| ID | Title | Target & Standard |
|---|---|---|
| **NFR-001** | Response Latency | Server-side response time $< 300\text{ ms}$ (p95); full page load $< 2.0\text{ s}$ under load. |
| **NFR-002** | Scalability | Architecture supports $10,000+$ active subscriptions and $30,000+$ invoices with indexes and pagination. |
| **NFR-003** | Password Security | Passwords $\ge 9$ chars with upper, lower, special character; hashed via `bcrypt` (cost 12). |
| **NFR-004** | Session Security | JWT stored in `httpOnly`, `SameSite=Lax`, secure cookies; 15-minute access token lifespan. |
| **NFR-005** | Tenant Isolation | All customer queries enforce ownership in repositories; cross-tenant access returns 404. |
| **NFR-006** | Offline First | Zero external CDN or mandatory paid third-party API dependencies. Local fonts and local outbox. |

---

## 4. Role-Permission Matrix

| Functional Area / Action | ADMIN | STAFF | CUSTOMER |
|---|:---:|:---:|:---:|
| **Register Account (Public)** | - | - | **YES** |
| **Login / Logout / Reset Password** | **YES** | **YES** | **YES** |
| **Create Staff Accounts** | **YES** | NO | NO |
| **Manage Products & Variants** | **YES** | **YES** | NO |
| **Manage Billing Plans & Taxes** | **YES** | **YES** | NO |
| **Manage Discount Rules** | **YES** | NO | NO |
| **Create Quotation Templates** | **YES** | **YES** | NO |
| **Issue Quotations & Subscriptions**| **YES** | **YES** | NO |
| **Confirm & Activate Subscriptions**| **YES** | **YES** | NO |
| **View Own Subscriptions & Invoices**| **YES** | **YES** | **YES (Own records only)** |
| **Pause / Resume Subscription** | **YES** | **YES** | **YES (If plan permits)** |
| **Close Subscription** | **YES** | **YES** | **YES (If plan permits)** |
| **Run Billing Day (Dry-run / Real)**| **YES** | **YES** | NO |
| **Confirm / Cancel Invoices** | **YES** | **YES** | NO |
| **Record Payments** | **YES** | **YES** | NO |
| **View Financial Dashboard** | **YES** | **YES** | NO |
| **View Email Outbox Drawer** | **YES** | **YES** | NO |
