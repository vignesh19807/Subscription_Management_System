import { Prisma, SubscriptionStatus, UserRole } from "@prisma/client";
import { Decimal } from "decimal.js";
import { prisma } from "../../config/db.js";
import { AppError } from "../../common/errors/app-error.js";
import { Money } from "../../common/money/money.js";
import { Dates } from "../../common/dates/dates.js";
import { parsePagination, buildPaginationMeta } from "../../common/pagination/pagination.js";
import { AuthUser } from "../../common/auth/token.js";
import {
  CreateSubscriptionInput,
  TransitionSubscriptionInput,
  SubscriptionQueryParams,
} from "./subscriptions.schemas.js";

export class SubscriptionsService {
  private static async generateSubscriptionNumber(): Promise<string> {
    const currentYear = new Date().getUTCFullYear();
    const count = await prisma.subscription.count();
    const seq = count + 1;
    return `SUB-${currentYear}-${String(seq).padStart(4, "0")}`;
  }

  static async listSubscriptions(
    query: SubscriptionQueryParams,
    user: AuthUser,
  ) {
    const { skip, take, page, limit } = parsePagination(query as unknown as Record<string, unknown>);

    const where: Prisma.SubscriptionWhereInput = {};

    // Customer can only see their own subscriptions (Tenant Isolation NFR-005)
    if (user.role === UserRole.CUSTOMER) {
      where.customerId = user.userId;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [totalRecords, subscriptions] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        include: {
          customer: { select: { id: true, email: true, fullName: true } },
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
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      subscriptions,
      pagination: buildPaginationMeta(totalRecords, page, limit),
    };
  }

  static async getSubscriptionById(id: string, user: AuthUser) {
    const where: Prisma.SubscriptionWhereUniqueInput = { id };

    const subscription = await prisma.subscription.findUnique({
      where,
      include: {
        customer: { select: { id: true, email: true, fullName: true } },
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
            taxRule: true,
            discountRule: true,
          },
        },
        events: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { issueDate: "desc" } },
      },
    });

    if (!subscription) {
      throw AppError.notFound("Subscription");
    }

    // Tenant isolation check
    if (user.role === UserRole.CUSTOMER && subscription.customerId !== user.userId) {
      throw AppError.notFound("Subscription"); // Return 404 to avoid information disclosure
    }

    return subscription;
  }

  static async createSubscription(
    input: CreateSubscriptionInput,
    user: AuthUser,
  ) {
    // Determine customer ID
    let customerId = user.userId;
    if (user.role !== UserRole.CUSTOMER) {
      if (!input.customerId) {
        throw AppError.badRequest("customerId is required when creating subscriptions as staff or admin.");
      }
      customerId = input.customerId;
    }

    // Verify customer exists
    const customer = await prisma.user.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw AppError.notFound("Customer");
    }

    // Verify plan exists
    const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
    if (!plan || !plan.isActive) {
      throw AppError.badRequest("Selected plan does not exist or is inactive.");
    }

    // Calculate line items using Money utility (BR-001, BR-002)
    const lineCreations: Array<{
      productId: string;
      variantId?: string;
      isAddon: boolean;
      isActive: boolean;
      quantity: number;
      unitPrice: Decimal;
      subtotal: Decimal;
      taxRuleId?: string;
      discountRuleId?: string;
    }> = [];

    for (const line of input.lines) {
      const product = await prisma.product.findUnique({ where: { id: line.productId } });
      if (!product || !product.isActive) {
        throw AppError.badRequest(`Product '${line.productId}' does not exist or is inactive.`);
      }

      let variantDelta = 0;
      if (line.variantId) {
        const variant = await prisma.productVariant.findUnique({ where: { id: line.variantId } });
        if (!variant || variant.productId !== product.id || !variant.isActive) {
          throw AppError.badRequest(`Invalid or inactive variant '${line.variantId}' for product '${product.name}'.`);
        }
        variantDelta = variant.priceDelta.toNumber();
      }

      // Unit Price = Base Price + Variant Delta (BR-001)
      const unitPrice = Money.calculateUnitPrice(product.salesPrice, variantDelta);
      const subtotal = Money.multiply(unitPrice, line.quantity);

      lineCreations.push({
        productId: product.id,
        variantId: line.variantId,
        isAddon: line.isAddon,
        isActive: true,
        quantity: line.quantity,
        unitPrice,
        subtotal,
        taxRuleId: line.taxRuleId,
        discountRuleId: line.discountRuleId,
      });
    }

    const subscriptionNumber = await this.generateSubscriptionNumber();
    const startDate = Dates.fromDateString(input.startDate);
    const initialStatus =
      user.role === UserRole.CUSTOMER ? SubscriptionStatus.QUOTATION : SubscriptionStatus.QUOTATION;

    return prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId,
          planId: plan.id,
          templateId: input.templateId,
          status: initialStatus,
          startDate,
          nextBillingDate: startDate,
          paymentTermsDays: input.paymentTermsDays,
          notes: input.notes,
          lines: {
            create: lineCreations,
          },
        },
        include: {
          customer: { select: { id: true, email: true, fullName: true } },
          plan: true,
          lines: true,
        },
      });

      // Record lifecycle event
      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          fromStatus: null,
          toStatus: initialStatus,
          reason: "Quotation generated",
          performedBy: user.email,
        },
      });

      return subscription;
    });
  }

  static async transitionSubscription(
    id: string,
    input: TransitionSubscriptionInput,
    user: AuthUser,
  ) {
    const subscription = await this.getSubscriptionById(id, user);

    // Validate state transition
    const currentStatus = subscription.status;
    const targetStatus = input.toStatus;

    if (currentStatus === targetStatus) {
      throw AppError.badRequest(`Subscription is already in status '${currentStatus}'.`);
    }

    if (currentStatus === SubscriptionStatus.CLOSED) {
      throw AppError.badRequest("Closed subscriptions cannot be transitioned.");
    }

    // Role and plan rules
    switch (targetStatus) {
      case SubscriptionStatus.CONFIRMED:
        if (currentStatus !== SubscriptionStatus.DRAFT && currentStatus !== SubscriptionStatus.QUOTATION) {
          throw AppError.badRequest(`Cannot confirm subscription from status ${currentStatus}.`);
        }
        break;
      case SubscriptionStatus.ACTIVE:
        if (currentStatus !== SubscriptionStatus.CONFIRMED && currentStatus !== SubscriptionStatus.PAUSED) {
          throw AppError.badRequest(`Cannot activate subscription from status ${currentStatus}.`);
        }
        break;
      case SubscriptionStatus.PAUSED:
        if (currentStatus !== SubscriptionStatus.ACTIVE) {
          throw AppError.badRequest(`Cannot pause subscription from status ${currentStatus}.`);
        }
        if (!subscription.plan.pausable) {
          throw AppError.badRequest("The plan for this subscription does not permit pausing.");
        }
        break;
      case SubscriptionStatus.CLOSED:
        if (user.role === UserRole.CUSTOMER && !subscription.plan.closableEarly) {
          throw AppError.badRequest("The plan for this subscription does not allow early closure by customers.");
        }
        break;
      default:
        throw AppError.badRequest(`Unsupported target status: ${String(targetStatus)}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id },
        data: { status: targetStatus },
        include: {
          customer: { select: { id: true, email: true, fullName: true } },
          plan: true,
          lines: true,
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: id,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          reason: input.reason || `Transitioned to ${targetStatus}`,
          performedBy: user.email,
        },
      });

      return updated;
    });
  }
}
