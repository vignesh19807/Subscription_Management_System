import { Router } from "express";
import { UserRole } from "@prisma/client";
import { PaymentsController } from "./payments.controller.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import { recordPaymentSchema, paymentQuerySchema } from "./payments.schemas.js";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/payments",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(recordPaymentSchema),
  asyncHandler(PaymentsController.recordPayment),
);

paymentsRouter.get(
  "/payments",
  authenticate,
  validateQuery(paymentQuerySchema),
  asyncHandler(PaymentsController.listPayments),
);
