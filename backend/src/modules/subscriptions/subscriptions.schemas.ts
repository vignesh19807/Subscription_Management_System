import { z } from "zod";
import { SubscriptionStatus } from "@prisma/client";

export const subscriptionLineInputSchema = z.object({
  productId: z.string().uuid("Invalid product ID."),
  variantId: z.string().uuid("Invalid variant ID.").optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1.").default(1),
  isAddon: z.boolean().default(false),
  taxRuleId: z.string().uuid("Invalid tax rule ID.").optional(),
  discountRuleId: z.string().uuid("Invalid discount rule ID.").optional(),
});

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID.").optional(), // optional if customer themselves
  planId: z.string().uuid("Invalid plan ID."),
  templateId: z.string().uuid("Invalid template ID.").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD."),
  paymentTermsDays: z.coerce.number().int().min(0).default(15),
  notes: z.string().optional(),
  lines: z.array(subscriptionLineInputSchema).min(1, "Subscription must have at least one line item."),
});

export const transitionSubscriptionSchema = z.object({
  toStatus: z.nativeEnum(SubscriptionStatus),
  reason: z.string().max(500).optional(),
});

export const subscriptionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  customerId: z.string().uuid().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type TransitionSubscriptionInput = z.infer<typeof transitionSubscriptionSchema>;
export type SubscriptionQueryParams = z.infer<typeof subscriptionQuerySchema>;
