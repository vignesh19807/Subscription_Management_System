-- ====================================================================
-- LoopBill Phase 1 Corrective Migration
-- Master Build Specification Alignment & Data Preservation
-- ====================================================================

-- 1. Plans: authoritative naming corrections (preserve data)
ALTER TABLE "plans" RENAME COLUMN "valid_until" TO "valid_to";
ALTER TABLE "plans" RENAME COLUMN "allow_early_closure" TO "closable_early";
ALTER TABLE "plans" RENAME COLUMN "allow_pause" TO "pausable";
ALTER TABLE "plans" RENAME COLUMN "allow_renewal" TO "renewable";

-- 2. Subscriptions: authoritative naming & missing fields (preserve data)
ALTER TABLE "subscriptions" RENAME COLUMN "end_date" TO "expiry_date";
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "quotation_valid_until" DATE;

-- 3. Subscription Lines: missing authoritative fields
ALTER TABLE "subscription_lines" ADD COLUMN IF NOT EXISTS "is_addon" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscription_lines" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "subscription_lines" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- 4. Discount Rules: authoritative naming, missing product scope relation
ALTER TABLE "discount_rules" RENAME COLUMN "valid_from" TO "start_date";
ALTER TABLE "discount_rules" RENAME COLUMN "valid_until" TO "end_date";
ALTER TABLE "discount_rules" RENAME COLUMN "max_usage_count" TO "max_uses";
ALTER TABLE "discount_rules" RENAME COLUMN "current_usage_count" TO "used_count";
ALTER TABLE "discount_rules" ADD COLUMN IF NOT EXISTS "product_id" UUID;

CREATE INDEX IF NOT EXISTS "discount_rules_code_idx" ON "discount_rules"("code");
CREATE INDEX IF NOT EXISTS "discount_rules_product_id_idx" ON "discount_rules"("product_id");

ALTER TABLE "discount_rules" DROP CONSTRAINT IF EXISTS "discount_rules_product_id_fkey";
ALTER TABLE "discount_rules" ADD CONSTRAINT "discount_rules_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Invoice Lines: immutable historical snapshots & nullable catalog references
ALTER TABLE "invoice_lines" RENAME COLUMN "description" TO "product_name_snapshot";
ALTER TABLE "invoice_lines" RENAME COLUMN "tax_rate" TO "tax_rate_snapshot";
ALTER TABLE "invoice_lines" ADD COLUMN IF NOT EXISTS "variant_name_snapshot" VARCHAR(100);
ALTER TABLE "invoice_lines" ALTER COLUMN "product_id" DROP NOT NULL;

ALTER TABLE "invoice_lines" DROP CONSTRAINT IF EXISTS "invoice_lines_product_id_fkey";
ALTER TABLE "invoice_lines" DROP CONSTRAINT IF EXISTS "invoice_lines_variant_id_fkey";

ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ====================================================================
-- Domain Integrity CHECK Constraints (Authoritative Master Spec)
-- ====================================================================

-- Products: nonnegative monetary constraints
ALTER TABLE "products"
  ADD CONSTRAINT "chk_products_sales_price_nonnegative" CHECK ("sales_price" >= 0),
  ADD CONSTRAINT "chk_products_cost_price_nonnegative" CHECK ("cost_price" >= 0);

-- Plans: nonnegative price, positive quantity, valid date bounds
ALTER TABLE "plans"
  ADD CONSTRAINT "chk_plans_price_nonnegative" CHECK ("plan_price" >= 0),
  ADD CONSTRAINT "chk_plans_min_quantity_positive" CHECK ("min_quantity" > 0),
  ADD CONSTRAINT "chk_plans_valid_dates" CHECK ("valid_from" IS NULL OR "valid_to" IS NULL OR "valid_from" <= "valid_to");

-- Tax Rules: nonnegative tax rate
ALTER TABLE "tax_rules"
  ADD CONSTRAINT "chk_tax_rules_rate_nonnegative" CHECK ("rate" >= 0);

-- Discount Rules: nonnegative value, positive min quantity, valid dates, usage limits
ALTER TABLE "discount_rules"
  ADD CONSTRAINT "chk_discount_rules_value_nonnegative" CHECK ("value" >= 0),
  ADD CONSTRAINT "chk_discount_rules_min_purchase_nonnegative" CHECK ("min_purchase_amount" IS NULL OR "min_purchase_amount" >= 0),
  ADD CONSTRAINT "chk_discount_rules_min_quantity_positive" CHECK ("min_quantity" IS NULL OR "min_quantity" > 0),
  ADD CONSTRAINT "chk_discount_rules_dates" CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "start_date" <= "end_date"),
  ADD CONSTRAINT "chk_discount_rules_usage_limits" CHECK ("used_count" >= 0 AND ("max_uses" IS NULL OR "used_count" <= "max_uses"));

-- Quotation Templates & Lines: validity days and line constraints
ALTER TABLE "quotation_templates"
  ADD CONSTRAINT "chk_quotation_templates_validity_positive" CHECK ("validity_days" > 0);

ALTER TABLE "quotation_template_lines"
  ADD CONSTRAINT "chk_quotation_template_lines_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "chk_quotation_template_lines_price_nonnegative" CHECK ("unit_price" >= 0);

-- Subscriptions: start before expiry, nonnegative payment terms
ALTER TABLE "subscriptions"
  ADD CONSTRAINT "chk_subscriptions_dates" CHECK ("expiry_date" IS NULL OR "start_date" <= "expiry_date"),
  ADD CONSTRAINT "chk_subscriptions_payment_terms_nonnegative" CHECK ("payment_terms_days" >= 0);

-- Subscription Lines: positive quantity, nonnegative monetary amounts
ALTER TABLE "subscription_lines"
  ADD CONSTRAINT "chk_subscription_lines_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "chk_subscription_lines_price_nonnegative" CHECK ("unit_price" >= 0),
  ADD CONSTRAINT "chk_subscription_lines_subtotal_nonnegative" CHECK ("subtotal" >= 0);

-- Invoices: nonnegative monetary amounts, amount paid <= total, chronological dates
ALTER TABLE "invoices"
  ADD CONSTRAINT "chk_invoices_subtotal_nonnegative" CHECK ("subtotal" >= 0),
  ADD CONSTRAINT "chk_invoices_tax_total_nonnegative" CHECK ("tax_total" >= 0),
  ADD CONSTRAINT "chk_invoices_discount_total_nonnegative" CHECK ("discount_total" >= 0),
  ADD CONSTRAINT "chk_invoices_total_amount_nonnegative" CHECK ("total_amount" >= 0),
  ADD CONSTRAINT "chk_invoices_amount_paid_nonnegative" CHECK ("amount_paid" >= 0),
  ADD CONSTRAINT "chk_invoices_amount_paid_lte_total" CHECK ("amount_paid" <= "total_amount"),
  ADD CONSTRAINT "chk_invoices_issue_due_dates" CHECK ("issue_date" <= "due_date"),
  ADD CONSTRAINT "chk_invoices_billing_period_dates" CHECK ("billing_period_start" <= "billing_period_end");

-- Invoice Lines: positive quantity, nonnegative monetary amounts
ALTER TABLE "invoice_lines"
  ADD CONSTRAINT "chk_invoice_lines_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "chk_invoice_lines_unit_price_nonnegative" CHECK ("unit_price" >= 0),
  ADD CONSTRAINT "chk_invoice_lines_subtotal_nonnegative" CHECK ("subtotal" >= 0),
  ADD CONSTRAINT "chk_invoice_lines_discount_amount_nonnegative" CHECK ("discount_amount" >= 0),
  ADD CONSTRAINT "chk_invoice_lines_tax_rate_nonnegative" CHECK ("tax_rate_snapshot" >= 0),
  ADD CONSTRAINT "chk_invoice_lines_tax_amount_nonnegative" CHECK ("tax_amount" >= 0),
  ADD CONSTRAINT "chk_invoice_lines_line_total_nonnegative" CHECK ("line_total" >= 0);

-- Payments: positive payment amount
ALTER TABLE "payments"
  ADD CONSTRAINT "chk_payments_amount_positive" CHECK ("amount" > 0);
