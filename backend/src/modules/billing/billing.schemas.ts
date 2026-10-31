import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

export const billingRunSchema = z.object({
  asOfDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "asOfDate must be YYYY-MM-DD.")
    .optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(InvoiceStatus).optional(),
  customerId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
});

export type BillingRunInput = z.infer<typeof billingRunSchema>;
export type InvoiceQueryParams = z.infer<typeof invoiceQuerySchema>;
