import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID."),
  amount: z.coerce.number().positive("Payment amount must be greater than 0."),
  paymentMethod: z.nativeEnum(PaymentMethod),
  referenceNote: z.string().max(255).optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  invoiceId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type PaymentQueryParams = z.infer<typeof paymentQuerySchema>;
