-- ====================================================================
-- LoopBill Phase 1 Compliance Audit Corrections
-- Safe Non-Destructive Schema Additions & Least Privilege Enforcement
-- ====================================================================

-- 1. EmailLog: Safely rename body_content to body_html (preserving all data) and add action_link
ALTER TABLE "email_logs" RENAME COLUMN "body_content" TO "body_html";
ALTER TABLE "email_logs" ADD COLUMN IF NOT EXISTS "action_link" VARCHAR(255);

-- 2. PasswordResetToken: Add used_at and backfill from is_used for data consistency
ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "used_at" TIMESTAMPTZ(6);
UPDATE "password_reset_tokens"
SET "used_at" = "created_at"
WHERE "is_used" = true AND "used_at" IS NULL;

-- 3. Payment: Add recorded_by reference for staff/audit traceability
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "recorded_by" UUID;
CREATE INDEX IF NOT EXISTS "payments_recorded_by_idx" ON "payments"("recorded_by");
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_recorded_by_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_fkey"
  FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. User: Add password_changed_at for session invalidation
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_changed_at" TIMESTAMPTZ(6);

-- 5. Subscriptions: High-frequency composite query indexes
CREATE INDEX IF NOT EXISTS "subscriptions_status_next_billing_date_idx"
  ON "subscriptions"("status", "next_billing_date");
CREATE INDEX IF NOT EXISTS "subscriptions_customer_id_status_idx"
  ON "subscriptions"("customer_id", "status");

-- 6. Invoices: High-frequency composite query indexes
CREATE INDEX IF NOT EXISTS "invoices_status_due_date_idx"
  ON "invoices"("status", "due_date");
CREATE INDEX IF NOT EXISTS "invoices_customer_id_status_idx"
  ON "invoices"("customer_id", "status");

-- 7. Security: Revoke DELETE from application runtime role on immutable financial & audit ledgers
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'loopbill_app') THEN
    REVOKE DELETE ON TABLE "invoices", "invoice_lines", "payments", "audit_logs", "subscription_events" FROM loopbill_app;
  END IF;
END
$$;
