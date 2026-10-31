# LoopBill — Edge Cases & Mitigation Strategies

This document catalogs critical domain edge cases and their architectural mitigations.

---

## 1. Calendar & Temporal Edge Cases

### A. Month-End Billing Date Clamping
- **Scenario:** A customer subscribes on January 31 with a Monthly plan. Adding 1 month naively yields February 31 (invalid date).
- **Mitigation:** The `Dates.addBillingPeriod()` utility checks if the target month has fewer days than the anchor day. It clamps to the last valid day of that month (February 28, or February 29 in leap years).
- **Leap Year Test:** Verified via unit tests spanning February 29 in 2024/2028 versus non-leap years.

### B. Catch-Up Billing for Multi-Cycle Delinquency
- **Scenario:** The billing runner was paused or missed for 3 months due to system maintenance.
- **Mitigation:** The billing engine detects when `next_billing_date` is multiple cycles behind `current_date`. It processes and generates individual invoices for each missed period in strict chronological sequence, recording discrete `billing_period_start` and `billing_period_end` values.

---

## 2. Concurrency & Race Conditions

### A. Concurrent Billing Day Runs
- **Scenario:** A scheduled cron job triggers billing at 00:00:00 UTC while an admin simultaneously triggers manual billing from the dashboard.
- **Mitigation:**
  1. The billing engine acquires a PostgreSQL advisory lock: `SELECT pg_try_advisory_lock(987654321)`. If another runner holds the lock, the second instance exits immediately with a clean skip log.
  2. Invoices table has a partial unique index:
     `CREATE UNIQUE INDEX unique_active_billing_period ON invoices (subscription_id, billing_period_start) WHERE status != 'CANCELLED';`
     Even if two workers bypassed advisory locks, the second insert fails on database constraint and is caught as an idempotent skip.

### B. Concurrent Partial Payments (Overpayment Race)
- **Scenario:** Two cashier staff simultaneously record ₹500 payments on an invoice with only ₹600 remaining balance.
- **Mitigation:** Payment recording executes inside a Prisma `$transaction`. It locks the target invoice row using `SELECT ... FOR UPDATE`, re-fetches the current `amount_paid` and `total_amount`, verifies that `new_amount <= (total_amount - amount_paid)`, and only then creates the payment record. If the second payment exceeds the updated balance, it throws a `400 BAD_REQUEST` ("Payment exceeds outstanding balance").

---

## 3. Financial & Business Invariants

### A. Catalog Price Modification After Invoicing
- **Scenario:** Admin changes the sales price of "Cloud ERP" from ₹5,000 to ₹6,500.
- **Mitigation:** `invoice_lines` stores immutable snapshot fields (`product_name`, `variant_name`, `unit_price`, `quantity`, `tax_rate`, `line_total`). Invoices never dynamically calculate totals from the active `products` table. Past financial reports and tax records remain permanently unchanged.

### B. Discount Limit Race Condition
- **Scenario:** A promotional discount has `max_usage_count = 100` and currently has 99 usages. Two invoices attempt to apply it concurrently.
- **Mitigation:** Discount usage increment executes atomically within the invoice generation transaction:
  `UPDATE discount_rules SET current_usage_count = current_usage_count + 1 WHERE id = $id AND current_usage_count < max_usage_count`
  If zero rows are updated, the discount is treated as exhausted and omitted from the invoice.
- **Cancellation Recovery:** If an invoice is cancelled, the discount usage count is atomically decremented (`current_usage_count = current_usage_count - 1`).

---

## 4. Security & Tenant Isolation Edge Cases

### A. Insecure Direct Object Reference (IDOR)
- **Scenario:** Customer `C-101` attempts to view invoice `INV-2026-9999` belonging to Customer `C-102` by altering the URL path `/api/v1/portal/invoices/INV-2026-9999`.
- **Mitigation:** Customer portal queries explicitly append `WHERE customer_id = req.user.id`. If no row matches both the invoice ID and customer ID, the repository returns `null`, prompting a `404 Not Found` response. This prevents enumeration of invoices belonging to other tenants.
