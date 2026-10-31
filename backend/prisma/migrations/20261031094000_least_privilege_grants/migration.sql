-- ====================================================================
-- LoopBill Phase 1 Least Privilege Grants Migration
-- Explicitly grant DELETE on operational tables; protect immutable ledgers
-- ====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'loopbill_app') THEN
    -- Explicitly grant DELETE only where permitted by application specification
    GRANT DELETE ON TABLE
      "products",
      "product_variants",
      "plans",
      "tax_rules",
      "discount_rules",
      "quotation_templates",
      "quotation_template_lines",
      "subscriptions",
      "subscription_lines",
      "password_reset_tokens",
      "users"
    TO loopbill_app;

    -- Ensure DELETE is strictly revoked on immutable financial and audit tables
    REVOKE DELETE ON TABLE
      "invoices",
      "invoice_lines",
      "payments",
      "audit_logs",
      "subscription_events"
    FROM loopbill_app;
  END IF;
END
$$;
