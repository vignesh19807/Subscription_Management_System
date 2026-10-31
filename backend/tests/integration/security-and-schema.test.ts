import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, connectDb, disconnectDb } from "../../src/config/db.js";

describe("Security & Schema Compliance Integration Audit", () => {
  beforeAll(async () => {
    // Strict isolation guard: verify test environment is active
    if (process.env.NODE_ENV !== "test") {
      throw new Error(
        `Integration tests must run with NODE_ENV=test. Current NODE_ENV: ${process.env.NODE_ENV}`,
      );
    }

    await connectDb();

    // Verify session database is strictly loopbill_test to protect development database from mutation
    const dbCheck = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database();
    `;
    const activeDb = dbCheck[0]?.current_database;
    if (activeDb !== "loopbill_test") {
      throw new Error(
        `CRITICAL SAFETY VIOLATION: Integration tests connected to '${activeDb}' instead of 'loopbill_test'. Aborting to protect development data.`,
      );
    }

    // Verify session user is strictly loopbill_app to enforce non-superuser runtime security
    const userCheck = await prisma.$queryRaw<Array<{ current_user: string }>>`
      SELECT current_user;
    `;
    const activeUser = userCheck[0]?.current_user;
    if (activeUser !== "loopbill_app") {
      throw new Error(
        `CRITICAL SECURITY VIOLATION: Integration tests connected as '${activeUser}' instead of runtime role 'loopbill_app'.`,
      );
    }
  });

  afterAll(async () => {
    await disconnectDb();
  });

  describe("1. Database Connection & Environment Isolation", () => {
    it("should verify Prisma connects as runtime role loopbill_app", async () => {
      const userResult = await prisma.$queryRaw<
        Array<{ current_user: string }>
      >`
        SELECT current_user;
      `;
      expect(userResult).toHaveLength(1);
      expect(userResult[0]?.current_user).toBe("loopbill_app");
    });

    it("should verify Prisma connects to the dedicated test database loopbill_test and never development database", async () => {
      const dbResult = await prisma.$queryRaw<
        Array<{ current_database: string }>
      >`
        SELECT current_database();
      `;
      expect(dbResult).toHaveLength(1);
      expect(dbResult[0]?.current_database).toBe("loopbill_test");
      expect(dbResult[0]?.current_database).not.toBe("loopbill_dev");
    });

    it("should confirm runtime role loopbill_app has NOSUPERUSER, NOCREATEDB and NOCREATEROLE", async () => {
      const roles = await prisma.$queryRaw<
        Array<{
          rolname: string;
          rolsuper: boolean;
          rolcreatedb: boolean;
          rolcreaterole: boolean;
        }>
      >`
        SELECT rolname, rolsuper, rolcreatedb, rolcreaterole
        FROM pg_roles
        WHERE rolname = 'loopbill_app';
      `;

      expect(roles).toHaveLength(1);
      const appRole = roles[0]!;
      expect(appRole.rolsuper).toBe(false);
      expect(appRole.rolcreatedb).toBe(false);
      expect(appRole.rolcreaterole).toBe(false);
    });
  });

  describe("2. Schema Field Availability & PostgreSQL Column Types", () => {
    it("should have all newly required fields in the Prisma schema and database catalog", async () => {
      // Query information_schema.columns to verify exact column names and types in PostgreSQL
      interface InformationSchemaColumn {
        table_name: string;
        column_name: string;
        data_type: string;
      }

      const columns = await prisma.$queryRaw<Array<InformationSchemaColumn>>`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND (
            (table_name = 'users' AND column_name = 'password_changed_at')
            OR (table_name = 'password_reset_tokens' AND column_name = 'used_at')
            OR (table_name = 'payments' AND column_name = 'recorded_by')
            OR (table_name = 'email_logs' AND column_name IN ('body_html', 'action_link'))
          )
        ORDER BY table_name, column_name;
      `;

      const columnMap = new Set(
        columns.map(
          (c: InformationSchemaColumn) => `${c.table_name}.${c.column_name}`,
        ),
      );

      expect(columnMap.has("users.password_changed_at")).toBe(true);
      expect(columnMap.has("password_reset_tokens.used_at")).toBe(true);
      expect(columnMap.has("payments.recorded_by")).toBe(true);
      expect(columnMap.has("email_logs.body_html")).toBe(true);
      expect(columnMap.has("email_logs.action_link")).toBe(true);
    });

    it("should verify nullable timestamp with time zone types for newly added schema fields in PostgreSQL catalog", async () => {
      const columns = await prisma.$queryRaw<
        Array<{
          table_name: string;
          column_name: string;
          data_type: string;
          is_nullable: string;
        }>
      >`
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND (
            (table_name = 'users' AND column_name = 'password_changed_at')
            OR (table_name = 'password_reset_tokens' AND column_name = 'used_at')
          )
        ORDER BY table_name, column_name;
      `;

      expect(columns).toHaveLength(2);
      for (const col of columns) {
        expect(col.data_type).toBe("timestamp with time zone");
        expect(col.is_nullable).toBe("YES");
      }
    });
  });

  describe("3. Composite Indexes Verification", () => {
    it("should verify all required composite indexes and partial unique index exist in pg_indexes", async () => {
      interface IndexRow {
        tablename: string;
        indexname: string;
        indexdef: string;
      }

      const indexes = await prisma.$queryRaw<Array<IndexRow>>`
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('subscriptions', 'invoices')
        ORDER BY indexname;
      `;

      const indexDefs = indexes.map((i: IndexRow) => i.indexname);

      // Subscriptions composite indexes
      expect(indexDefs).toContain("subscriptions_status_next_billing_date_idx");
      expect(indexDefs).toContain("subscriptions_customer_id_status_idx");

      // Invoices composite indexes
      expect(indexDefs).toContain("invoices_status_due_date_idx");
      expect(indexDefs).toContain("invoices_customer_id_status_idx");

      // Billing period partial unique index
      expect(indexDefs).toContain("unique_active_billing_period");

      const billingIndex = indexes.find(
        (i) => i.indexname === "unique_active_billing_period",
      );
      expect(billingIndex?.indexdef).toContain("CANCELLED");
    });
  });

  describe("4. PostgreSQL Privilege Verification (has_table_privilege & has_schema_privilege)", () => {
    const protectedTables = [
      "invoices",
      "invoice_lines",
      "payments",
      "audit_logs",
      "subscription_events",
    ] as const;

    it("should verify has_table_privilege returns false for DELETE on all five protected tables", async () => {
      for (const table of protectedTables) {
        const result = await prisma.$queryRaw<Array<{ can_delete: boolean }>>`
          SELECT has_table_privilege('loopbill_app', ${table}, 'DELETE') AS can_delete;
        `;
        expect(result).toHaveLength(1);
        expect(result[0]?.can_delete).toBe(false);
      }
    });

    it("should verify has_table_privilege returns true for SELECT, INSERT, and UPDATE on protected tables", async () => {
      for (const table of protectedTables) {
        const result = await prisma.$queryRaw<
          Array<{
            can_select: boolean;
            can_insert: boolean;
            can_update: boolean;
          }>
        >`
          SELECT
            has_table_privilege('loopbill_app', ${table}, 'SELECT') AS can_select,
            has_table_privilege('loopbill_app', ${table}, 'INSERT') AS can_insert,
            has_table_privilege('loopbill_app', ${table}, 'UPDATE') AS can_update;
        `;
        expect(result).toHaveLength(1);
        expect(result[0]?.can_select).toBe(true);
        expect(result[0]?.can_insert).toBe(true);
        expect(result[0]?.can_update).toBe(true);
      }
    });

    it("should verify has_table_privilege returns true for all operations including DELETE on operational tables", async () => {
      const operationalTables = [
        "products",
        "product_variants",
        "plans",
        "discount_rules",
        "tax_rules",
      ] as const;

      for (const table of operationalTables) {
        const result = await prisma.$queryRaw<
          Array<{
            can_select: boolean;
            can_insert: boolean;
            can_update: boolean;
            can_delete: boolean;
          }>
        >`
          SELECT
            has_table_privilege('loopbill_app', ${table}, 'SELECT') AS can_select,
            has_table_privilege('loopbill_app', ${table}, 'INSERT') AS can_insert,
            has_table_privilege('loopbill_app', ${table}, 'UPDATE') AS can_update,
            has_table_privilege('loopbill_app', ${table}, 'DELETE') AS can_delete;
        `;
        expect(result).toHaveLength(1);
        expect(result[0]?.can_select).toBe(true);
        expect(result[0]?.can_insert).toBe(true);
        expect(result[0]?.can_update).toBe(true);
        expect(result[0]?.can_delete).toBe(true);
      }
    });

    it("should verify has_schema_privilege returns false for CREATE on public schema for loopbill_app", async () => {
      const result = await prisma.$queryRaw<Array<{ can_create: boolean }>>`
        SELECT has_schema_privilege('loopbill_app', 'public', 'CREATE') AS can_create;
      `;
      expect(result).toHaveLength(1);
      expect(result[0]?.can_create).toBe(false);
    });

    it("should verify default privileges for loopbill_app do not automatically grant DELETE on future tables", async () => {
      const defaultAcls = await prisma.$queryRaw<
        Array<{ defaclobjtype: string; privileges: string }>
      >`
        SELECT defaclobjtype, defaclacl::text AS privileges
        FROM pg_default_acl
        WHERE defaclobjtype = 'r';
      `;

      expect(defaultAcls.length).toBeGreaterThan(0);
      for (const acl of defaultAcls) {
        expect(acl.privileges).not.toMatch(/loopbill_app=[^}]*d[^}]*\//);
        expect(acl.privileges).toContain("loopbill_app=arw");
      }
    });
  });

  describe("5. Database Security & Financial Record Protection (Actual Rejection Tests)", () => {
    it("should strictly deny DELETE privilege on invoices for runtime role loopbill_app", async () => {
      // Attempting to execute raw DELETE as loopbill_app on invoices must throw permission denied error
      await expect(
        prisma.$executeRawUnsafe(
          `DELETE FROM invoices WHERE id = '00000000-0000-0000-0000-000000000000';`,
        ),
      ).rejects.toThrow(/permission denied for table invoices/i);
    });

    it("should strictly deny DELETE privilege on invoice_lines for runtime role loopbill_app", async () => {
      await expect(
        prisma.$executeRawUnsafe(
          `DELETE FROM invoice_lines WHERE id = '00000000-0000-0000-0000-000000000000';`,
        ),
      ).rejects.toThrow(/permission denied for table invoice_lines/i);
    });

    it("should strictly deny DELETE privilege on payments for runtime role loopbill_app", async () => {
      await expect(
        prisma.$executeRawUnsafe(
          `DELETE FROM payments WHERE id = '00000000-0000-0000-0000-000000000000';`,
        ),
      ).rejects.toThrow(/permission denied for table payments/i);
    });

    it("should strictly deny DELETE privilege on audit_logs for runtime role loopbill_app", async () => {
      await expect(
        prisma.$executeRawUnsafe(
          `DELETE FROM audit_logs WHERE id = '00000000-0000-0000-0000-000000000000';`,
        ),
      ).rejects.toThrow(/permission denied for table audit_logs/i);
    });

    it("should strictly deny DELETE privilege on subscription_events for runtime role loopbill_app", async () => {
      await expect(
        prisma.$executeRawUnsafe(
          `DELETE FROM subscription_events WHERE id = '00000000-0000-0000-0000-000000000000';`,
        ),
      ).rejects.toThrow(/permission denied for table subscription_events/i);
    });

    it("should strictly deny DDL statements (CREATE TABLE) for runtime role loopbill_app", async () => {
      await expect(
        prisma.$executeRawUnsafe(
          `CREATE TABLE unauthorized_runtime_table (id int);`,
        ),
      ).rejects.toThrow(/permission denied for schema public/i);
    });

    it("should allow runtime role loopbill_app to perform necessary SELECT and read operations", async () => {
      const userCount = await prisma.user.count();
      expect(typeof userCount).toBe("number");

      const planCount = await prisma.plan.count();
      expect(typeof planCount).toBe("number");
    });
  });

  describe("6. Migration Status & Nullable Timestamp Types", () => {
    it("should verify nullable timestamp types for _prisma_migrations columns in PostgreSQL catalog", async () => {
      interface MigrationColumnInfo {
        column_name: string;
        data_type: string;
        is_nullable: string;
      }

      const columns = await prisma.$queryRaw<Array<MigrationColumnInfo>>`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = '_prisma_migrations'
          AND column_name IN ('finished_at', 'rolled_back_at', 'started_at')
        ORDER BY column_name;
      `;

      const colMap = new Map(
        columns.map((c: MigrationColumnInfo) => [c.column_name, c]),
      );

      // started_at is NOT NULL TIMESTAMPTZ
      const started = colMap.get("started_at");
      expect(started?.data_type).toBe("timestamp with time zone");
      expect(started?.is_nullable).toBe("NO");

      // finished_at is NULLABLE TIMESTAMPTZ
      const finished = colMap.get("finished_at");
      expect(finished?.data_type).toBe("timestamp with time zone");
      expect(finished?.is_nullable).toBe("YES");

      // rolled_back_at is NULLABLE TIMESTAMPTZ
      const rolledBack = colMap.get("rolled_back_at");
      expect(rolledBack?.data_type).toBe("timestamp with time zone");
      expect(rolledBack?.is_nullable).toBe("YES");
    });

    it("should verify that all migrations have been applied without rollback with correct nullable timestamp typing", async () => {
      interface MigrationRow {
        migration_name: string;
        started_at: Date;
        finished_at: Date | null;
        rolled_back_at: Date | null;
      }

      const migrations = await prisma.$queryRaw<Array<MigrationRow>>`
        SELECT migration_name, started_at, finished_at, rolled_back_at
        FROM _prisma_migrations
        ORDER BY finished_at ASC;
      `;

      expect(migrations.length).toBeGreaterThanOrEqual(5);
      for (const m of migrations) {
        expect(m.started_at).toBeInstanceOf(Date);
        expect(m.finished_at).not.toBeNull();
        expect(m.finished_at).toBeInstanceOf(Date);
        expect(m.rolled_back_at).toBeNull();
      }
    });
  });
});
