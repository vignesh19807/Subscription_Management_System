import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../common/errors/app-error.js";
import { Money } from "../../common/money/money.js";
import {
  CreatePlanInput,
  UpdatePlanInput,
  CreateTaxRuleInput,
  UpdateTaxRuleInput,
  CreateDiscountRuleInput,
  UpdateDiscountRuleInput,
} from "./plans.schemas.js";

export class PlansService {
  // ----------------------------------------------------
  // PLANS
  // ----------------------------------------------------

  static async listPlans(isActiveOnly = false) {
    const where: Prisma.PlanWhereInput = {};
    if (isActiveOnly) {
      where.isActive = true;
    }
    return prisma.plan.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  static async getPlanById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw AppError.notFound("Billing plan");
    }
    return plan;
  }

  static async createPlan(input: CreatePlanInput) {
    if (input.validFrom && input.validTo && input.validFrom > input.validTo) {
      throw AppError.badRequest("validFrom cannot be after validTo.");
    }

    return prisma.plan.create({
      data: {
        name: input.name,
        description: input.description,
        billingInterval: input.billingInterval,
        intervalCount: input.intervalCount,
        planPrice: Money.round(input.planPrice),
        minQuantity: input.minQuantity,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validTo: input.validTo ? new Date(input.validTo) : null,
        autoClose: input.autoClose,
        closableEarly: input.closableEarly,
        pausable: input.pausable,
        renewable: input.renewable,
        isActive: input.isActive,
      },
    });
  }

  static async updatePlan(id: string, input: UpdatePlanInput) {
    const plan = await this.getPlanById(id);

    const validFrom = input.validFrom ? new Date(input.validFrom) : plan.validFrom;
    const validTo = input.validTo ? new Date(input.validTo) : plan.validTo;
    if (validFrom && validTo && validFrom > validTo) {
      throw AppError.badRequest("validFrom cannot be after validTo.");
    }

    const data: Prisma.PlanUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.billingInterval !== undefined) data.billingInterval = input.billingInterval;
    if (input.intervalCount !== undefined) data.intervalCount = input.intervalCount;
    if (input.planPrice !== undefined) data.planPrice = Money.round(input.planPrice);
    if (input.minQuantity !== undefined) data.minQuantity = input.minQuantity;
    if (input.validFrom !== undefined) data.validFrom = input.validFrom ? new Date(input.validFrom) : null;
    if (input.validTo !== undefined) data.validTo = input.validTo ? new Date(input.validTo) : null;
    if (input.autoClose !== undefined) data.autoClose = input.autoClose;
    if (input.closableEarly !== undefined) data.closableEarly = input.closableEarly;
    if (input.pausable !== undefined) data.pausable = input.pausable;
    if (input.renewable !== undefined) data.renewable = input.renewable;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return prisma.plan.update({
      where: { id },
      data,
    });
  }

  static async deletePlan(id: string) {
    await this.getPlanById(id);

    const subCount = await prisma.subscription.count({ where: { planId: id } });
    if (subCount > 0) {
      return prisma.plan.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.plan.delete({ where: { id } });
  }

  // ----------------------------------------------------
  // TAX RULES
  // ----------------------------------------------------

  static async listTaxRules() {
    return prisma.taxRule.findMany({
      orderBy: { rate: "asc" },
    });
  }

  static async createTaxRule(input: CreateTaxRuleInput) {
    return prisma.taxRule.create({
      data: {
        name: input.name,
        rate: Money.round(input.rate),
        isActive: input.isActive,
      },
    });
  }

  static async updateTaxRule(id: string, input: UpdateTaxRuleInput) {
    const existing = await prisma.taxRule.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound("Tax rule");
    }

    const data: Prisma.TaxRuleUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.rate !== undefined) data.rate = Money.round(input.rate);
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return prisma.taxRule.update({
      where: { id },
      data,
    });
  }

  // ----------------------------------------------------
  // DISCOUNT RULES
  // ----------------------------------------------------

  static async listDiscountRules() {
    return prisma.discountRule.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createDiscountRule(input: CreateDiscountRuleInput) {
    const existing = await prisma.discountRule.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw AppError.conflict(`Discount code '${input.code}' already exists.`);
    }

    if (input.startDate && input.endDate && new Date(input.startDate) > new Date(input.endDate)) {
      throw AppError.badRequest("startDate cannot be after endDate.");
    }

    return prisma.discountRule.create({
      data: {
        code: input.code,
        name: input.name,
        discountType: input.discountType,
        scope: input.scope,
        productId: input.productId,
        value: Money.round(input.value),
        minPurchaseAmount: input.minPurchaseAmount !== undefined ? Money.round(input.minPurchaseAmount) : null,
        minQuantity: input.minQuantity,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        maxUses: input.maxUses,
        isActive: input.isActive,
      },
      include: { product: true },
    });
  }

  static async updateDiscountRule(id: string, input: UpdateDiscountRuleInput) {
    const rule = await prisma.discountRule.findUnique({ where: { id } });
    if (!rule) {
      throw AppError.notFound("Discount rule");
    }

    if (input.code && input.code !== rule.code) {
      const existing = await prisma.discountRule.findUnique({ where: { code: input.code } });
      if (existing) {
        throw AppError.conflict(`Discount code '${input.code}' already exists.`);
      }
    }

    const startDate = input.startDate ? new Date(input.startDate) : rule.startDate;
    const endDate = input.endDate ? new Date(input.endDate) : rule.endDate;
    if (startDate && endDate && startDate > endDate) {
      throw AppError.badRequest("startDate cannot be after endDate.");
    }

    const data: Prisma.DiscountRuleUncheckedUpdateInput = {};
    if (input.code !== undefined) data.code = input.code;
    if (input.name !== undefined) data.name = input.name;
    if (input.discountType !== undefined) data.discountType = input.discountType;
    if (input.scope !== undefined) data.scope = input.scope;
    if (input.productId !== undefined) data.productId = input.productId;
    if (input.value !== undefined) data.value = Money.round(input.value);
    if (input.minPurchaseAmount !== undefined) {
      data.minPurchaseAmount = input.minPurchaseAmount !== null ? Money.round(input.minPurchaseAmount) : null;
    }
    if (input.minQuantity !== undefined) data.minQuantity = input.minQuantity;
    if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
    if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;
    if (input.maxUses !== undefined) data.maxUses = input.maxUses;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return prisma.discountRule.update({
      where: { id },
      data,
      include: { product: true },
    });
  }
}
