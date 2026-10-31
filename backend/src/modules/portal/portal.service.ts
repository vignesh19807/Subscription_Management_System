import { InvoiceStatus, SubscriptionStatus, BillingInterval } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../common/errors/app-error.js";
import { Money } from "../../common/money/money.js";
import { parsePagination, buildPaginationMeta } from "../../common/pagination/pagination.js";
import { Decimal } from "decimal.js";

export class PortalService {
  // ----------------------------------------------------
  // CUSTOMER PORTAL
  // ----------------------------------------------------

  static async getCustomerSubscriptions(customerId: string) {
    return prisma.subscription.findMany({
      where: { customerId },
      include: {
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
        invoices: {
          orderBy: { issueDate: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getCustomerInvoices(customerId: string) {
    return prisma.invoice.findMany({
      where: { customerId },
      include: {
        subscription: { select: { subscriptionNumber: true } },
        lines: true,
        payments: true,
      },
      orderBy: { issueDate: "desc" },
    });
  }

  static async toggleCustomerAddon(
    customerId: string,
    subscriptionId: string,
    lineId: string,
    isActive: boolean,
  ) {
    // Verify subscription ownership
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { lines: true },
    });

    if (!subscription || subscription.customerId !== customerId) {
      throw AppError.notFound("Subscription");
    }

    const targetLine = subscription.lines.find((l) => l.id === lineId);
    if (!targetLine) {
      throw AppError.notFound("Subscription line");
    }

    if (!targetLine.isAddon) {
      throw AppError.badRequest("Only add-on line items can be toggled by customers.");
    }

    // BR-010: Add-on toggle takes effect from subsequent billing period
    const updatedLine = await prisma.subscriptionLine.update({
      where: { id: lineId },
      data: { isActive },
      include: { product: true, variant: true },
    });

    // Log lifecycle event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        fromStatus: subscription.status,
        toStatus: subscription.status,
        reason: `Add-on '${updatedLine.product.name}' ${isActive ? "activated" : "deactivated"} by customer for next billing cycle.`,
      },
    });

    return updatedLine;
  }

  // ----------------------------------------------------
  // FINANCIAL ANALYTICS & DASHBOARD (FR-020)
  // ----------------------------------------------------

  static async getDashboardMetrics() {
    const today = new Date();

    // 1. Active Subscriptions with Plans for MRR calculation
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: {
        plan: true,
        lines: {
          where: { isActive: true },
          include: { variant: true, product: true },
        },
      },
    });

    const activeCount = activeSubscriptions.length;

    // 2. Calculate normalized MRR (Monthly Recurring Revenue)
    let mrrAcc = new Decimal(0);
    for (const sub of activeSubscriptions) {
      let subTotal = new Decimal(0);
      for (const line of sub.lines) {
        const variantDelta = line.variant ? line.variant.priceDelta : 0;
        const unitPrice = Money.calculateUnitPrice(line.product.salesPrice, variantDelta);
        const lineGross = Money.multiply(unitPrice, line.quantity);
        subTotal = Money.add(subTotal, lineGross);
      }

      // Normalize to monthly
      const interval = sub.plan.billingInterval;
      const count = sub.plan.intervalCount || 1;
      let monthlyMultiplier = new Decimal(1);

      switch (interval) {
        case BillingInterval.DAILY:
          monthlyMultiplier = new Decimal(30).dividedBy(count);
          break;
        case BillingInterval.WEEKLY:
          monthlyMultiplier = new Decimal(52).dividedBy(12).dividedBy(count);
          break;
        case BillingInterval.MONTHLY:
          monthlyMultiplier = new Decimal(1).dividedBy(count);
          break;
        case BillingInterval.YEARLY:
          monthlyMultiplier = new Decimal(1).dividedBy(12).dividedBy(count);
          break;
      }

      const normalizedMonthly = Money.multiply(subTotal, monthlyMultiplier);
      mrrAcc = Money.add(mrrAcc, normalizedMonthly);
    }

    const mrr = Money.round(mrrAcc);
    const arr = Money.multiply(mrr, 12);

    // 3. Total Collections from Payment Ledger
    const paymentsAggregate = await prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: { id: true },
    });
    const totalCollections = paymentsAggregate._sum.amount
      ? Money.round(paymentsAggregate._sum.amount)
      : new Decimal(0);

    // 4. Aging Debt / Overdue Invoices: CONFIRMED and due_date < today and amount_paid < total_amount (BR-008)
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.CONFIRMED,
        dueDate: { lt: today },
      },
    });

    let agingDebt = new Decimal(0);
    for (const inv of overdueInvoices) {
      if (Money.lessThan(inv.amountPaid, inv.totalAmount)) {
        const outstanding = Money.subtract(inv.totalAmount, inv.amountPaid);
        agingDebt = Money.add(agingDebt, outstanding);
      }
    }

    // 5. Invoices breakdown by status
    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { totalAmount: true, amountPaid: true },
    });

    // 6. Recent activities
    const [recentPayments, recentEvents, recentInvoices] = await Promise.all([
      prisma.payment.findMany({
        take: 5,
        orderBy: { paymentDate: "desc" },
        include: {
          customer: { select: { fullName: true, email: true } },
          invoice: { select: { invoiceNumber: true } },
        },
      }),
      prisma.subscriptionEvent.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          subscription: { select: { subscriptionNumber: true } },
        },
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { fullName: true } },
        },
      }),
    ]);

    return {
      activeSubscriptionsCount: activeCount,
      mrr: mrr.toNumber(),
      arr: arr.toNumber(),
      mrrFormatted: Money.formatINR(mrr),
      arrFormatted: Money.formatINR(arr),
      totalCollections: totalCollections.toNumber(),
      totalCollectionsFormatted: Money.formatINR(totalCollections),
      agingDebt: agingDebt.toNumber(),
      agingDebtFormatted: Money.formatINR(agingDebt),
      overdueInvoicesCount: overdueInvoices.length,
      invoicesByStatus,
      recentActivities: {
        payments: recentPayments,
        events: recentEvents,
        invoices: recentInvoices,
      },
    };
  }

  // ----------------------------------------------------
  // SIMULATED EMAIL OUTBOX (FR-021)
  // ----------------------------------------------------

  static async listEmailOutbox(query: Record<string, unknown>) {
    const { skip, take, page, limit } = parsePagination(query);

    const [totalRecords, emails] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.findMany({
        skip,
        take,
        orderBy: { sentAt: "desc" },
        include: {
          recipient: { select: { id: true, email: true, fullName: true } },
        },
      }),
    ]);

    return {
      emails,
      pagination: buildPaginationMeta(totalRecords, page, limit),
    };
  }
}
