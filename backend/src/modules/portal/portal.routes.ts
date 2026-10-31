import { Router } from "express";
import { UserRole } from "@prisma/client";
import { PortalController } from "./portal.controller.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

export const portalRouter = Router();

// Customer Portal (FR-018, FR-019)
portalRouter.get(
  "/portal/subscriptions",
  authenticate,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(PortalController.getCustomerSubscriptions),
);

portalRouter.get(
  "/portal/invoices",
  authenticate,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(PortalController.getCustomerInvoices),
);

portalRouter.patch(
  "/portal/subscriptions/:id/addons/:lineId",
  authenticate,
  requireRole(UserRole.CUSTOMER),
  asyncHandler(PortalController.toggleCustomerAddon),
);

// Financial Dashboard Analytics (FR-020)
portalRouter.get(
  "/analytics/dashboard",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  asyncHandler(PortalController.getDashboardMetrics),
);

// Simulated Email Outbox Ledger (FR-021)
portalRouter.get(
  "/outbox",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  asyncHandler(PortalController.listEmailOutbox),
);
