import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma, connectDb, disconnectDb } from "../../src/config/db.js";
import { PasswordUtil } from "../../src/common/auth/password.js";
import { UserRole } from "@prisma/client";
import { TokenUtil } from "../../src/common/auth/token.js";
import { Dates } from "../../src/common/dates/dates.js";

describe("LoopBill Complete Business Lifecycle Integration Tests", () => {
  let adminToken: string;
  let customerToken: string;
  let customerId: string;

  let productId: string;
  let variantId: string;
  let planId: string;
  let taxRuleId: string;
  let discountRuleId: string;
  let subscriptionId: string;
  let invoiceId: string;

  beforeAll(async () => {
    await connectDb();

    // 1. Setup Admin User
    const adminEmail = `admin_biz_${Date.now()}@loopbill.com`;
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await PasswordUtil.hash("AdminPassword#2026"),
        fullName: "Operations Admin",
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminToken = TokenUtil.sign({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName,
    });

    // 2. Setup Customer User
    const custEmail = `cust_biz_${Date.now()}@customer.com`;
    const cust = await prisma.user.create({
      data: {
        email: custEmail,
        passwordHash: await PasswordUtil.hash("CustomerPassword#2026"),
        fullName: "Enterprise Customer",
        role: UserRole.CUSTOMER,
        isActive: true,
      },
    });
    customerId = cust.id;
    customerToken = TokenUtil.sign({
      userId: cust.id,
      email: cust.email,
      role: cust.role,
      fullName: cust.fullName,
    });
  });

  afterAll(async () => {
    await disconnectDb();
  });

  // ----------------------------------------------------
  // 1. PRODUCT CATALOG & VARIANTS
  // ----------------------------------------------------
  describe("1. Product and Variant CRUD", () => {
    it("should create a product with sales price and cost price (FR-005)", async () => {
      const res = await request(app)
        .post("/api/v1/catalog/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Cloud Server Pro",
          description: "High-performance compute instance",
          productType: "STANDARD",
          salesPrice: 1000.0,
          costPrice: 400.0,
          notes: "Primary flagship product",
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Cloud Server Pro");
      expect(Number(res.body.data.salesPrice)).toBe(1000);
      productId = res.body.data.id;
    });

    it("should add a product variant with price delta (FR-006, BR-001)", async () => {
      const res = await request(app)
        .post(`/api/v1/catalog/products/${productId}/variants`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          attributeName: "Brand Edition",
          attributeValue: "Odoo Enterprise",
          priceDelta: 560.0,
          sku: `SKU-ODOO-${Date.now()}`,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.attributeValue).toBe("Odoo Enterprise");
      expect(Number(res.body.data.priceDelta)).toBe(560);
      variantId = res.body.data.id;
    });

    it("should retrieve product with variants", async () => {
      const res = await request(app).get(`/api/v1/catalog/products/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.variants).toHaveLength(1);
      expect(res.body.data.variants[0].id).toBe(variantId);
    });
  });

  // ----------------------------------------------------
  // 2. PLANS, TAXES & DISCOUNTS
  // ----------------------------------------------------
  describe("2. Plans, Taxes & Discounts", () => {
    it("should create a recurring monthly plan with governance flags (FR-007)", async () => {
      const res = await request(app)
        .post("/api/v1/plans")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Monthly Business Plan",
          billingInterval: "MONTHLY",
          intervalCount: 1,
          planPrice: 0.0,
          minQuantity: 1,
          pausable: true,
          closableEarly: true,
          renewable: true,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.billingInterval).toBe("MONTHLY");
      expect(res.body.data.pausable).toBe(true);
      planId = res.body.data.id;
    });

    it("should create a tax rule (FR-008)", async () => {
      const res = await request(app)
        .post("/api/v1/taxes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Standard GST 18%",
          rate: 18.0,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.data.rate)).toBe(18);
      taxRuleId = res.body.data.id;
    });

    it("should create a discount rule (FR-009)", async () => {
      const res = await request(app)
        .post("/api/v1/discounts")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: `SAVE10_${Date.now()}`,
          name: "10% Welcome Discount",
          discountType: "PERCENTAGE",
          scope: "PRODUCT",
          productId,
          value: 10.0,
          minPurchaseAmount: 500.0,
          maxUses: 100,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.data.value)).toBe(10);
      discountRuleId = res.body.data.id;
    });
  });

  // ----------------------------------------------------
  // 3. QUOTATIONS & SUBSCRIPTION LIFECYCLE
  // ----------------------------------------------------
  describe("3. Quotation & Subscription Lifecycle", () => {
    it("should create quotation with sequential number and additive variant pricing (FR-011, BR-001)", async () => {
      const today = Dates.toDateString(new Date());

      const res = await request(app)
        .post("/api/v1/subscriptions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          customerId,
          planId,
          startDate: today,
          paymentTermsDays: 15,
          notes: "Initial deployment quotation",
          lines: [
            {
              productId,
              variantId,
              quantity: 2,
              isAddon: false,
              taxRuleId,
              discountRuleId,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.subscriptionNumber).toMatch(/^SUB-\d{4}-\d{4}$/);
      expect(res.body.data.status).toBe("QUOTATION");
      expect(res.body.data.lines).toHaveLength(1);

      // Base: ₹1000 + Variant: ₹560 = Unit Price ₹1560
      expect(Number(res.body.data.lines[0].unitPrice)).toBe(1560);
      // Subtotal = 1560 * 2 = ₹3120
      expect(Number(res.body.data.lines[0].subtotal)).toBe(3120);

      subscriptionId = res.body.data.id;
    });

    it("should transition QUOTATION -> CONFIRMED -> ACTIVE (FR-012)", async () => {
      // 1. Confirm
      const confirmRes = await request(app)
        .post(`/api/v1/subscriptions/${subscriptionId}/transition`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ toStatus: "CONFIRMED", reason: "Customer accepted quotation" });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.status).toBe("CONFIRMED");

      // 2. Activate
      const activateRes = await request(app)
        .post(`/api/v1/subscriptions/${subscriptionId}/transition`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ toStatus: "ACTIVE", reason: "Service provisioned" });

      expect(activateRes.status).toBe(200);
      expect(activateRes.body.data.status).toBe("ACTIVE");
    });

    it("should pause and resume subscription when plan allows pausing (FR-013)", async () => {
      // Pause
      const pauseRes = await request(app)
        .post(`/api/v1/subscriptions/${subscriptionId}/transition`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ toStatus: "PAUSED", reason: "Temporary maintenance pause" });

      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.status).toBe("PAUSED");

      // Resume back to ACTIVE
      const resumeRes = await request(app)
        .post(`/api/v1/subscriptions/${subscriptionId}/transition`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ toStatus: "ACTIVE", reason: "Maintenance complete" });

      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.status).toBe("ACTIVE");
    });

    it("should enforce tenant isolation (NFR-005: other customers cannot access this subscription)", async () => {
      // Create another customer
      const otherCust = await prisma.user.create({
        data: {
          email: `other_${Date.now()}@customer.com`,
          passwordHash: await PasswordUtil.hash("OtherPassword#2026"),
          fullName: "Other Customer",
          role: UserRole.CUSTOMER,
          isActive: true,
        },
      });
      const otherToken = TokenUtil.sign({
        userId: otherCust.id,
        email: otherCust.email,
        role: otherCust.role,
        fullName: otherCust.fullName,
      });

      const res = await request(app)
        .get(`/api/v1/subscriptions/${subscriptionId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  // ----------------------------------------------------
  // 4. BILLING ENGINE & INVOICE GENERATION
  // ----------------------------------------------------
  describe("4. Billing Engine & Invoices", () => {
    it("should preview billing calculations via dry-run without database mutations (FR-014)", async () => {
      const today = Dates.toDateString(new Date());

      const res = await request(app)
        .post("/api/v1/billing/dry-run")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ asOfDate: today });

      expect(res.status).toBe(200);
      expect(res.body.data.totalEligibleSubscriptions).toBeGreaterThanOrEqual(1);

      const targetSimulation = res.body.data.invoices.find(
        (inv: { subscriptionId: string }) => inv.subscriptionId === subscriptionId,
      );
      expect(targetSimulation).toBeDefined();

      // Math verification:
      // Gross: 1560 * 2 = 3120.00
      // 10% Discount: 312.00
      // Taxable: 3120 - 312 = 2808.00
      // 18% Tax: 2808 * 0.18 = 505.44
      // Total: 2808 + 505.44 = 3313.44
      expect(Number(targetSimulation.subtotal)).toBe(2808.0);
      expect(Number(targetSimulation.discountTotal)).toBe(312.0);
      expect(Number(targetSimulation.taxTotal)).toBe(505.44);
      expect(Number(targetSimulation.totalAmount)).toBe(3313.44);

      // Verify zero invoices were persisted during dry run
      const count = await prisma.invoice.count({ where: { subscriptionId } });
      expect(count).toBe(0);
    });

    it("should execute billing run, creating invoice with immutable snapshots and advancing nextBillingDate (FR-015, BR-003)", async () => {
      const today = Dates.toDateString(new Date());

      const res = await request(app)
        .post("/api/v1/billing/execute")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ asOfDate: today });

      expect(res.status).toBe(201);
      expect(res.body.data.invoicesGeneratedCount).toBeGreaterThanOrEqual(1);

      const createdInvoice = res.body.data.invoices.find(
        (inv: { subscriptionId: string }) => inv.subscriptionId === subscriptionId,
      );
      expect(createdInvoice).toBeDefined();
      expect(createdInvoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
      expect(Number(createdInvoice.totalAmount)).toBe(3313.44);
      expect(createdInvoice.status).toBe("CONFIRMED");

      invoiceId = createdInvoice.id;

      // Verify immutable snapshots in invoice lines
      expect(createdInvoice.lines[0].productNameSnapshot).toBe("Cloud Server Pro");
      expect(createdInvoice.lines[0].variantNameSnapshot).toBe("Brand Edition: Odoo Enterprise");
      expect(Number(createdInvoice.lines[0].taxRateSnapshot)).toBe(18);

      // Verify subscription nextBillingDate was advanced 1 month
      const updatedSub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
      expect(Dates.toDateString(updatedSub!.nextBillingDate)).not.toBe(today);
    });

    it("should enforce billing idempotency on re-execution (BR-006: zero duplicates)", async () => {
      const today = Dates.toDateString(new Date());

      const res = await request(app)
        .post("/api/v1/billing/execute")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ asOfDate: today });

      expect(res.status).toBe(201);
      // Target subscription should not be re-billed for the same period
      const duplicateInvoice = res.body.data.invoices.find(
        (inv: { subscriptionId: string }) => inv.subscriptionId === subscriptionId,
      );
      expect(duplicateInvoice).toBeUndefined();
    });
  });

  // ----------------------------------------------------
  // 5. PAYMENT LEDGER & SETTLEMENTS
  // ----------------------------------------------------
  describe("5. Payment Ledger and Settlements", () => {
    it("should reject payment exceeding remaining invoice balance (BR-009)", async () => {
      const res = await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: 5000.0, // Total is 3313.44
          paymentMethod: "BANK_TRANSFER",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toContain("exceeds remaining invoice balance");
    });

    it("should record partial payment and update amountPaid (FR-017)", async () => {
      const res = await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: 1500.0,
          paymentMethod: "UPI",
          referenceNote: "Partial advance settlement",
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.data.amount)).toBe(1500);

      // Verify invoice state
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      expect(Number(invoice!.amountPaid)).toBe(1500);
      expect(invoice!.status).toBe("CONFIRMED"); // Still CONFIRMED, not yet fully PAID
    });

    it("should record final payment and derive PAID settlement status (BR-007)", async () => {
      // Remaining: 3313.44 - 1500 = 1813.44
      const res = await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          invoiceId,
          amount: 1813.44,
          paymentMethod: "CARD",
          referenceNote: "Final settlement",
        });

      expect(res.status).toBe(201);

      // Derived settlement to PAID
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      expect(Number(invoice!.amountPaid)).toBe(3313.44);
      expect(invoice!.status).toBe("PAID");
    });
  });

  // ----------------------------------------------------
  // 6. CUSTOMER PORTAL & FINANCIAL DASHBOARD
  // ----------------------------------------------------
  describe("6. Customer Portal & Financial Dashboard", () => {
    it("should allow customer to view personal subscriptions and invoices (FR-018)", async () => {
      const subsRes = await request(app)
        .get("/api/v1/portal/subscriptions")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(subsRes.status).toBe(200);
      expect(subsRes.body.data).toHaveLength(1);
      expect(subsRes.body.data[0].id).toBe(subscriptionId);

      const invRes = await request(app)
        .get("/api/v1/portal/invoices")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(invRes.status).toBe(200);
      expect(invRes.body.data).toHaveLength(1);
      expect(invRes.body.data[0].id).toBe(invoiceId);
    });

    it("should return comprehensive financial metrics on dashboard (FR-020)", async () => {
      const res = await request(app)
        .get("/api/v1/analytics/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("mrr");
      expect(res.body.data).toHaveProperty("arr");
      expect(res.body.data).toHaveProperty("totalCollections");
      expect(res.body.data.activeSubscriptionsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalCollections).toBeGreaterThanOrEqual(3313.44);
    });

    it("should allow Admin/Staff to view simulated email outbox (FR-021)", async () => {
      const res = await request(app)
        .get("/api/v1/outbox")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.emails).toBeDefined();
    });
  });
});
