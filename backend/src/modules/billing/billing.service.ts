import { Prisma, InvoiceStatus, SubscriptionStatus, UserRole, DiscountType } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../common/errors/app-error.js";
import { Money } from "../../common/money/money.js";
import { Dates } from "../../common/dates/dates.js";
import { parsePagination, buildPaginationMeta } from "../../common/pagination/pagination.js";
import { AuthUser } from "../../common/auth/token.js";
import { BillingRunInput, InvoiceQueryParams } from "./billing.schemas.js";
import { Decimal } from "decimal.js";

interface CalculatedLine {
  productId: string | null;
  variantId: string | null;
  productNameSnapshot: string;
  variantNameSnapshot: string | null;
  quantity: number;
  unitPrice: Decimal;
  subtotal: Decimal;
  discountAmount: Decimal;
  discountRuleId: string | null;
  taxRateSnapshot: Decimal;
  taxAmount: Decimal;
  taxRuleId: string | null;
  lineTotal: Decimal;
}


type SubscriptionWithDetails = Prisma.SubscriptionGetPayload<{
  include: {
    customer: true;
    plan: true;
    lines: {
      include: {
        product: true;
        variant: true;
        taxRule: true;
        discountRule: true;
      };
    };
  };
}>;

type InvoiceWithDetails = Prisma.InvoiceGetPayload<{
  include: {
    lines: true;
    customer: { select: { id: true; email: true; fullName: true } };
  };
}>;

interface SimulatedInvoice {
  subscriptionId: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  issueDate: string;
  dueDate: string;
  lines: CalculatedLine[];
  subtotal: Decimal;
  taxTotal: Decimal;
  discountTotal: Decimal;
  totalAmount: Decimal;
}

export class BillingService {
  private static async generateInvoiceNumber(offset = 0): Promise<string> {
    const currentYear = new Date().getUTCFullYear();
    const count = await prisma.invoice.count();
    const seq = count + 1 + offset;
    return `INV-${currentYear}-${String(seq).padStart(4, "0")}`;
  }

  private static calculateDiscount(
    rule: {
      id: string;
      discountType: DiscountType;
      value: Decimal;
      minPurchaseAmount: Decimal | null;
      minQuantity: number | null;
      startDate: Date | null;
      endDate: Date | null;
      maxUses: number | null;
      usedCount: number;
      isActive: boolean;
    } | null,
    grossAmount: Decimal,
    quantity: number,
    asOfDate: Date,
  ): Decimal {
    if (!rule || !rule.isActive) {
      return new Decimal(0);
    }

    // Check validity dates
    if (rule.startDate && rule.startDate > asOfDate) return new Decimal(0);
    if (rule.endDate && rule.endDate < asOfDate) return new Decimal(0);

    // Check usage limits
    if (rule.maxUses !== null && rule.usedCount >= rule.maxUses) return new Decimal(0);

    // Check min quantity
    if (rule.minQuantity !== null && quantity < rule.minQuantity) return new Decimal(0);

    // Check min purchase amount
    if (rule.minPurchaseAmount !== null && grossAmount.lessThan(rule.minPurchaseAmount)) {
      return new Decimal(0);
    }

    if (rule.discountType === DiscountType.PERCENTAGE) {
      return Money.round(grossAmount.times(rule.value).dividedBy(100));
    } else {
      // FIXED discount, capped at gross amount
      return Money.round(Decimal.min(grossAmount, rule.value));
    }
  }

  private static async buildInvoiceCalculations(
    subscription: SubscriptionWithDetails,
    targetDate: Date,
  ): Promise<SimulatedInvoice | null> {
    const billingPeriodStart = subscription.nextBillingDate;
    const plan = subscription.plan;

    // Advance 1 period for billing end
    const nextPeriodStart = Dates.addBillingPeriod(
      billingPeriodStart,
      plan.billingInterval,
      plan.intervalCount,
    );
    const billingPeriodEnd = Dates.addDays(nextPeriodStart, -1);
    const issueDate = targetDate;
    const dueDate = Dates.addDays(issueDate, subscription.paymentTermsDays);

    const activeLines = subscription.lines.filter((l) => l.isActive);
    if (activeLines.length === 0) {
      return null;
    }

    const calculatedLines: CalculatedLine[] = [];
    let subtotalAcc = new Decimal(0);
    let taxTotalAcc = new Decimal(0);
    let discountTotalAcc = new Decimal(0);
    let totalAmountAcc = new Decimal(0);

    for (const line of activeLines) {
      const product = line.product;
      const variant = line.variant;
      const variantDelta = variant ? variant.priceDelta : 0;

      const unitPrice = Money.calculateUnitPrice(product.salesPrice, variantDelta);
      const gross = Money.multiply(unitPrice, line.quantity);

      // Single discount evaluation (BR-004)
      const discount = this.calculateDiscount(
        line.discountRule,
        gross,
        line.quantity,
        targetDate,
      );

      const taxRate = line.taxRule ? line.taxRule.rate : new Decimal(0);

      const itemCalc = Money.calculateLineItem(
        unitPrice,
        line.quantity,
        discount,
        taxRate,
      );

      subtotalAcc = Money.add(subtotalAcc, itemCalc.taxable);
      taxTotalAcc = Money.add(taxTotalAcc, itemCalc.tax);
      discountTotalAcc = Money.add(discountTotalAcc, itemCalc.discount);
      totalAmountAcc = Money.add(totalAmountAcc, itemCalc.lineTotal);

      calculatedLines.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        productNameSnapshot: product.name,
        variantNameSnapshot: variant
          ? `${variant.attributeName}: ${variant.attributeValue}`
          : null,
        quantity: line.quantity,
        unitPrice: itemCalc.unitPrice,
        subtotal: itemCalc.taxable,
        discountAmount: itemCalc.discount,
        discountRuleId: line.discountRuleId,
        taxRateSnapshot: itemCalc.taxRate,
        taxAmount: itemCalc.tax,
        taxRuleId: line.taxRuleId,
        lineTotal: itemCalc.lineTotal,
      });
    }

    return {
      subscriptionId: subscription.id,
      subscriptionNumber: subscription.subscriptionNumber,
      customerId: subscription.customerId,
      customerName: subscription.customer.fullName,
      customerEmail: subscription.customer.email,
      billingPeriodStart: Dates.toDateString(billingPeriodStart),
      billingPeriodEnd: Dates.toDateString(billingPeriodEnd),
      issueDate: Dates.toDateString(issueDate),
      dueDate: Dates.toDateString(dueDate),
      lines: calculatedLines,
      subtotal: subtotalAcc,
      taxTotal: taxTotalAcc,
      discountTotal: discountTotalAcc,
      totalAmount: totalAmountAcc,
    };
  }

  static async dryRunBilling(input: BillingRunInput): Promise<{
    asOfDate: string;
    totalEligibleSubscriptions: number;
    totalProjectedRevenue: Decimal;
    invoices: SimulatedInvoice[];
  }> {
    const asOfDate = input.asOfDate
      ? Dates.fromDateString(input.asOfDate)
      : new Date();

    // Query active subscriptions due for billing (FR-014, BR-006)
    const eligibleSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: { lte: asOfDate },
      },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
            taxRule: true,
            discountRule: true,
          },
        },
      },
      orderBy: { nextBillingDate: "asc" },
    });

    const simulations: SimulatedInvoice[] = [];
    let totalProjected = new Decimal(0);

    for (const sub of eligibleSubscriptions) {
      // Check idempotency: skip if already billed for this period (BR-006)
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          subscriptionId: sub.id,
          billingPeriodStart: sub.nextBillingDate,
          status: { not: InvoiceStatus.CANCELLED },
        },
      });

      if (existingInvoice) {
        continue;
      }

      const calculated = await this.buildInvoiceCalculations(sub, asOfDate);
      if (calculated) {
        simulations.push(calculated);
        totalProjected = Money.add(totalProjected, calculated.totalAmount);
      }
    }

    return {
      asOfDate: Dates.toDateString(asOfDate),
      totalEligibleSubscriptions: simulations.length,
      totalProjectedRevenue: totalProjected,
      invoices: simulations,
    };
  }

  static async executeBilling(
    input: BillingRunInput,
    performedBy: string,
  ): Promise<{
    asOfDate: string;
    invoicesGeneratedCount: number;
    totalInvoicedAmount: Decimal;
    invoices: InvoiceWithDetails[];
  }> {
    const asOfDate = input.asOfDate
      ? Dates.fromDateString(input.asOfDate)
      : new Date();

    const eligibleSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: { lte: asOfDate },
      },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
            taxRule: true,
            discountRule: true,
          },
        },
      },
      orderBy: { nextBillingDate: "asc" },
    });

    const createdInvoices: InvoiceWithDetails[] = [];
    let totalAmountSum = new Decimal(0);
    let invoiceNumberOffset = 0;

    for (const sub of eligibleSubscriptions) {
      // Idempotency check: BR-006
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          subscriptionId: sub.id,
          billingPeriodStart: sub.nextBillingDate,
          status: { not: InvoiceStatus.CANCELLED },
        },
      });

      if (existingInvoice) {
        continue;
      }

      const calc = await this.buildInvoiceCalculations(sub, asOfDate);
      if (!calc) {
        continue;
      }

      const invoiceNumber = await this.generateInvoiceNumber(invoiceNumberOffset);
      invoiceNumberOffset++;

      // Next billing date calculation for subscription
      const nextBillingDate = Dates.addBillingPeriod(
        sub.nextBillingDate,
        sub.plan.billingInterval,
        sub.plan.intervalCount,
      );

      // Execute inside ACID transaction
      const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            invoiceNumber,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            issueDate: Dates.fromDateString(calc.issueDate),
            dueDate: Dates.fromDateString(calc.dueDate),
            billingPeriodStart: Dates.fromDateString(calc.billingPeriodStart),
            billingPeriodEnd: Dates.fromDateString(calc.billingPeriodEnd),
            subtotal: calc.subtotal,
            taxTotal: calc.taxTotal,
            discountTotal: calc.discountTotal,
            totalAmount: calc.totalAmount,
            amountPaid: new Decimal(0),
            status: InvoiceStatus.CONFIRMED,
            lines: {
              create: calc.lines.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                productNameSnapshot: l.productNameSnapshot,
                variantNameSnapshot: l.variantNameSnapshot,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                subtotal: l.subtotal,
                discountAmount: l.discountAmount,
                discountRuleId: l.discountRuleId,
                taxRateSnapshot: l.taxRateSnapshot,
                taxAmount: l.taxAmount,
                taxRuleId: l.taxRuleId,
                lineTotal: l.lineTotal,
              })),
            },
          },
          include: {
            lines: true,
            customer: { select: { id: true, email: true, fullName: true } },
          },
        });

        // Increment discount rule usage count (BR-005)
        for (const l of calc.lines) {
          if (l.discountRuleId) {
            await tx.discountRule.update({
              where: { id: l.discountRuleId },
              data: { usedCount: { increment: 1 } },
            });
          }
        }

        // Advance subscription nextBillingDate
        await tx.subscription.update({
          where: { id: sub.id },
          data: { nextBillingDate },
        });

        // Log audit trail
        await tx.auditLog.create({
          data: {
            action: "INVOICE_GENERATED",
            entityName: "Invoice",
            entityId: inv.id,
            details: `Invoice ${inv.invoiceNumber} generated for subscription ${sub.subscriptionNumber} by ${performedBy}. Total: ${Money.formatINR(inv.totalAmount)}. Next billing date: ${Dates.toDateString(nextBillingDate)}`,
          },
        });

        return inv;
      });

      createdInvoices.push(invoice);
      totalAmountSum = Money.add(totalAmountSum, invoice.totalAmount);
    }

    return {
      asOfDate: Dates.toDateString(asOfDate),
      invoicesGeneratedCount: createdInvoices.length,
      totalInvoicedAmount: totalAmountSum,
      invoices: createdInvoices,
    };
  }

  static async listInvoices(query: InvoiceQueryParams, user: AuthUser) {
    const { skip, take, page, limit } = parsePagination(query as unknown as Record<string, unknown>);

    const where: Prisma.InvoiceWhereInput = {};

    // Customer can only view their own invoices (Tenant Isolation NFR-005)
    if (user.role === UserRole.CUSTOMER) {
      where.customerId = user.userId;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.subscriptionId) {
      where.subscriptionId = query.subscriptionId;
    }

    const [totalRecords, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, email: true, fullName: true } },
          subscription: { select: { id: true, subscriptionNumber: true } },
          lines: true,
          payments: true,
        },
        skip,
        take,
        orderBy: { issueDate: "desc" },
      }),
    ]);

    return {
      invoices,
      pagination: buildPaginationMeta(totalRecords, page, limit),
    };
  }

  static async getInvoiceById(id: string, user: AuthUser) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, email: true, fullName: true } },
        subscription: true,
        lines: true,
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });

    if (!invoice) {
      throw AppError.notFound("Invoice");
    }

    if (user.role === UserRole.CUSTOMER && invoice.customerId !== user.userId) {
      throw AppError.notFound("Invoice");
    }

    return invoice;
  }

  static async confirmInvoice(id: string, user: AuthUser) {
    const invoice = await this.getInvoiceById(id, user);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw AppError.badRequest(`Cannot confirm invoice in status '${invoice.status}'.`);
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CONFIRMED },
      include: { lines: true },
    });
  }
}
