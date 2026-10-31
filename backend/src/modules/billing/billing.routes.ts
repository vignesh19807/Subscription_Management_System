import { Router } from "express";
import { UserRole } from "@prisma/client";
import { BillingController } from "./billing.controller.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import { billingRunSchema, invoiceQuerySchema } from "./billing.schemas.js";

export const billingRouter = Router();

// Billing Day Runs (Admin & Staff)
billingRouter.post(
  "/billing/dry-run",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(billingRunSchema),
  asyncHandler(BillingController.dryRun),
);

billingRouter.post(
  "/billing/execute",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(billingRunSchema),
  asyncHandler(BillingController.executeBilling),
);

// Invoices
billingRouter.get(
  "/invoices",
  authenticate,
  validateQuery(invoiceQuerySchema),
  asyncHandler(BillingController.listInvoices),
);

billingRouter.get(
  "/invoices/:id",
  authenticate,
  asyncHandler(BillingController.getInvoice),
);

billingRouter.post(
  "/invoices/:id/confirm",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  asyncHandler(BillingController.confirmInvoice),
);
