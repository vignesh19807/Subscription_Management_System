-- Partial Unique Index for Billing Idempotency
-- Guarantees that a subscription can only have one non-cancelled invoice per billing period start date.
CREATE UNIQUE INDEX "unique_active_billing_period"
ON "invoices" ("subscription_id", "billing_period_start")
WHERE "status" != 'CANCELLED';
