-- ====================================================================
-- LoopBill PostgreSQL Initialization Script (Docker & Local)
-- Non-superuser role separation & least-privilege enforcement
-- ====================================================================

-- 1. Create test database alongside development database
SELECT 'CREATE DATABASE loopbill_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'loopbill_test')\gexec

-- 2. Create migration role (loopbill) with NOSUPERUSER, CREATEDB (for shadow DB)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'loopbill') THEN
    CREATE ROLE loopbill WITH LOGIN PASSWORD 'loopbill_secret' NOSUPERUSER CREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE loopbill WITH NOSUPERUSER CREATEDB NOCREATEROLE;
  END IF;
END
$$;

-- 3. Create least-privilege runtime application role (loopbill_app) with NOSUPERUSER, NOCREATEDB, NOCREATEROLE
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'loopbill_app') THEN
    CREATE ROLE loopbill_app WITH LOGIN PASSWORD 'loopbill_app_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE loopbill_app WITH NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

-- 4. Configure permissions on loopbill_dev
GRANT ALL PRIVILEGES ON DATABASE loopbill_dev TO loopbill;
GRANT ALL ON SCHEMA public TO loopbill;
ALTER SCHEMA public OWNER TO loopbill;

GRANT CONNECT ON DATABASE loopbill_dev TO loopbill_app;
GRANT USAGE ON SCHEMA public TO loopbill_app;

-- Configure default privileges for future objects created by migration role (loopbill)
-- Least privilege: DO NOT automatically grant DELETE on future tables.
-- Runtime role loopbill_app receives SELECT, INSERT, UPDATE only by default.
ALTER DEFAULT PRIVILEGES FOR ROLE loopbill IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO loopbill_app;
ALTER DEFAULT PRIVILEGES FOR ROLE loopbill IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO loopbill_app;

-- Configure default privileges for future objects created by superuser (postgres)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO loopbill_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO loopbill_app;

-- Grant read/write permissions on existing tables/sequences if initialized on existing database
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO loopbill_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO loopbill_app;

-- Explicitly grant DELETE only on operational tables required by application specification
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
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
  END IF;
END
$$;

-- Enforce financial & audit immutability on existing tables
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    REVOKE DELETE ON TABLE "invoices", "invoice_lines", "payments", "audit_logs", "subscription_events" FROM loopbill_app;
  END IF;
END
$$;

-- 5. Connect to loopbill_test and configure identical permissions
\c loopbill_test

GRANT ALL PRIVILEGES ON DATABASE loopbill_test TO loopbill;
GRANT ALL ON SCHEMA public TO loopbill;
ALTER SCHEMA public OWNER TO loopbill;

GRANT CONNECT ON DATABASE loopbill_test TO loopbill_app;
GRANT USAGE ON SCHEMA public TO loopbill_app;

-- Configure default privileges for future objects created by migration role (loopbill)
ALTER DEFAULT PRIVILEGES FOR ROLE loopbill IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO loopbill_app;
ALTER DEFAULT PRIVILEGES FOR ROLE loopbill IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO loopbill_app;

-- Configure default privileges for future objects created by superuser (postgres)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO loopbill_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO loopbill_app;

-- Grant read/write permissions on existing tables/sequences if initialized on existing database
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO loopbill_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO loopbill_app;

-- Explicitly grant DELETE only on operational tables required by application specification
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
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
  END IF;
END
$$;

-- Enforce financial & audit immutability on existing tables
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    REVOKE DELETE ON TABLE "invoices", "invoice_lines", "payments", "audit_logs", "subscription_events" FROM loopbill_app;
  END IF;
END
$$;
