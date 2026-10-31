# LoopBill — Architectural & Business Assumptions

This document records all baseline assumptions, conventions, and operational decisions governing the LoopBill platform, in alignment with the Brightloop Software Master Build Specification.

---

## 1. Currency & Monetary Calculations

1. **Base Currency:** All financial operations, catalog pricing, surcharges, invoices, and payment ledger entries are denominated in **Indian Rupee (INR / ₹)**. Multi-currency conversion is excluded from Version 1.
2. **Numeric Representation:** All financial data stored in the database uses PostgreSQL `NUMERIC(12, 2)` (or `DECIMAL(12, 2)`).
3. **Precision & Rounding:** Fixed-point arithmetic is executed exclusively via `decimal.js` / Prisma `Decimal`. Rounding follows the **ROUND_HALF_UP** rule to two decimal places at the line item and invoice totals level. Binary floating-point arithmetic is strictly prohibited in monetary code.

---

## 2. Temporal & Billing Rules

1. **Timezone Standard:** All application timestamps (`created_at`, `sent_at`, event logs) are stored in **UTC** as PostgreSQL `TIMESTAMPTZ`. Business calendar dates (`issue_date`, `due_date`, `next_billing_date`, `start_date`, `end_date`) are stored as `DATE`.
2. **Month-End Date Advancement:** When advancing monthly billing cycles from a 31st or 30th date to a shorter month (e.g., January 31 + 1 month), the system clamps to the last valid day of that month (e.g., February 28, or February 29 in leap years). Subsequent advancements restore the original anchor day if valid.
3. **Billing Day Execution Timing:** The automated billing engine runs daily at 00:00 UTC (configurable). Manual triggers can be invoked at any time with an explicit target date parameter.
4. **Dry-Run Guarantee:** Dry-run billing execution operates purely as an in-memory simulation; it writes **zero rows** to the database and issues no database state modifications.

---

## 3. Product Catalog & Variant Pricing

1. **Pricing Formula:** The authoritative unit price of an item is:
   $$\text{Final Unit Price} = \text{Product Base Sales Price} + \text{Variant Price Delta}$$
2. **Authoritative Benchmark Example:**
   - Base Product Sales Price: ₹1,000.00
   - Odoo Brand Variant Price Delta: +₹560.00
   - Authoritative Unit Price: ₹1,560.00
3. **Immutable Snapshots:** When an invoice is created, all product names, variant labels, unit prices, discounts, and tax rates are frozen into `invoice_lines`. Future updates to the product catalog never modify existing invoices.

---

## 4. Discounts & Taxes

1. **Discount Stacking:** Discounts do **not** stack. If multiple discounts are theoretically applicable, the system selects and applies only the single largest monetary discount.
2. **Discount Reservation:** Discount usage limits are incremented within the transaction that creates the invoice. If the invoice is formally cancelled, reserved discount usage is atomically decremented.
3. **Tax Calculations:** Taxes are computed per invoice line based on the applicable active tax rule percentage. Compounding tax is not supported in Version 1.

---

## 5. Security & Authentication

1. **Authentication Mode:** Stateless authentication using JWT stored in secure HTTP-only, `SameSite=Lax` cookies. LocalStorage token persistence is prohibited.
2. **Password Complexity:** Minimum 9 characters, requiring at least one uppercase letter, one lowercase letter, and one special character. Hashing uses `bcrypt` with cost factor 12.
3. **Role Access:**
   - `ADMIN`: Full administrative control; sole role capable of provisioning `STAFF`.
   - `STAFF`: Operational role for catalog, quotations, subscriptions, billing, and invoices.
   - `CUSTOMER`: External client role; access strictly confined to own subscriptions and invoices via backend ownership filtering (`WHERE customer_id = authenticated_user_id`).

---

## 6. Email Outbox & External Services

1. **Zero External Dependency:** All transactional emails (password resets, invoice notices) are stored locally in the `email_logs` table. External SMTP delivery is optional and non-blocking.
2. **Payment Ledger Scope:** LoopBill v1 operates as an internal accounting payment ledger; no live payment gateway or cardholder data (PAN/CVV) storage is included.
