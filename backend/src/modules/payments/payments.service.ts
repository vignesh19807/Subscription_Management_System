import { Prisma, InvoiceStatus, UserRole, PaymentStatus } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../common/errors/app-error.js";
import { Money } from "../../common/money/money.js";
import { parsePagination, buildPaginationMeta } from "../../common/pagination/pagination.js";
import { AuthUser } from "../../common/auth/token.js";
import { RecordPaymentInput, PaymentQueryParams } from "./payments.schemas.js";

export class PaymentsService {
  static async recordPayment(input: RecordPaymentInput, user: AuthUser) {
    // 1. Check idempotency key if provided
    if (input.idempotencyKey) {
      const existing = await prisma.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { invoice: true, customer: true },
      });
      if (existing) {
        return existing;
      }
    }

    // 2. Fetch invoice and validate status
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
    });

    if (!invoice) {
      throw AppError.notFound("Invoice");
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      throw AppError.badRequest("Cannot record payment for an unconfirmed draft invoice.");
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw AppError.badRequest("Cannot record payment for a cancelled invoice.");
    }

    if (invoice.status === InvoiceStatus.PAID || Money.greaterThanOrEqualTo(invoice.amountPaid, invoice.totalAmount)) {
      throw AppError.badRequest("Invoice is already fully settled.");
    }

    const paymentAmount = Money.round(input.amount);
    const remainingBalance = Money.subtract(invoice.totalAmount, invoice.amountPaid);

    // 3. Enforce Payment Upper Bound (BR-009)
    if (Money.greaterThan(paymentAmount, remainingBalance)) {
      throw AppError.badRequest(
        `Payment amount (${Money.formatINR(paymentAmount)}) exceeds remaining invoice balance (${Money.formatINR(remainingBalance)}).`,
      );
    }

    // 4. Record transactionally
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          recordedById: user.userId,
          amount: paymentAmount,
          paymentMethod: input.paymentMethod,
          referenceNote: input.referenceNote,
          idempotencyKey: input.idempotencyKey,
          status: PaymentStatus.COMPLETED,
        },
        include: {
          invoice: true,
          customer: { select: { id: true, email: true, fullName: true } },
        },
      });

      const newAmountPaid = Money.add(invoice.amountPaid, paymentAmount);
      // Derived Settlement: BR-007
      const newStatus = Money.greaterThanOrEqualTo(newAmountPaid, invoice.totalAmount)
        ? InvoiceStatus.PAID
        : invoice.status;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus,
        },
      });

      // Audit trail entry
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "PAYMENT_RECORDED",
          entityName: "Payment",
          entityId: payment.id,
          details: `Recorded payment of ${Money.formatINR(paymentAmount)} via ${input.paymentMethod} for invoice ${invoice.invoiceNumber}. New invoice status: ${newStatus}`,
        },
      });

      return payment;
    });
  }

  static async listPayments(query: PaymentQueryParams, user: AuthUser) {
    const { skip, take, page, limit } = parsePagination(query as unknown as Record<string, unknown>);

    const where: Prisma.PaymentWhereInput = {};

    if (user.role === UserRole.CUSTOMER) {
      where.customerId = user.userId;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.invoiceId) {
      where.invoiceId = query.invoiceId;
    }

    const [totalRecords, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          invoice: { select: { id: true, invoiceNumber: true, totalAmount: true } },
          customer: { select: { id: true, email: true, fullName: true } },
          recorder: { select: { id: true, email: true, fullName: true } },
        },
        skip,
        take,
        orderBy: { paymentDate: "desc" },
      }),
    ]);

    return {
      payments,
      pagination: buildPaginationMeta(totalRecords, page, limit),
    };
  }
}
