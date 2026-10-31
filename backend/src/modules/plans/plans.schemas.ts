import { z } from "zod";
import { BillingInterval, DiscountType, DiscountScope } from "@prisma/client";

// Plan Schemas
export const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required.").max(255).trim(),
  description: z.string().optional(),
  billingInterval: z.nativeEnum(BillingInterval).default(BillingInterval.MONTHLY),
  intervalCount: z.coerce.number().int().min(1, "Interval count must be at least 1.").default(1),
  planPrice: z.coerce.number().min(0, "Plan price cannot be negative.").default(0),
  minQuantity: z.coerce.number().int().min(1, "Minimum quantity must be at least 1.").default(1),
  validFrom: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  validTo: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  autoClose: z.boolean().default(false),
  closableEarly: z.boolean().default(false),
  pausable: z.boolean().default(true),
  renewable: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();

// Tax Rule Schemas
export const createTaxRuleSchema = z.object({
  name: z.string().min(1, "Tax rule name is required.").max(100).trim(),
  rate: z.coerce.number().min(0, "Tax rate cannot be negative.").max(100, "Tax rate cannot exceed 100%."),
  isActive: z.boolean().default(true),
});

export const updateTaxRuleSchema = createTaxRuleSchema.partial();

// Discount Rule Schemas
export const createDiscountRuleSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters.").max(50).toUpperCase().trim(),
  name: z.string().min(1, "Discount name is required.").max(255).trim(),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.PERCENTAGE),
  scope: z.nativeEnum(DiscountScope).default(DiscountScope.PRODUCT),
  productId: z.string().uuid("Invalid product ID.").optional(),
  value: z.coerce.number().min(0, "Discount value cannot be negative."),
  minPurchaseAmount: z.coerce.number().min(0).optional(),
  minQuantity: z.coerce.number().int().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
});

export const updateDiscountRuleSchema = createDiscountRuleSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>;
export type UpdateTaxRuleInput = z.infer<typeof updateTaxRuleSchema>;
export type CreateDiscountRuleInput = z.infer<typeof createDiscountRuleSchema>;
export type UpdateDiscountRuleInput = z.infer<typeof updateDiscountRuleSchema>;
