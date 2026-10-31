import { Router } from "express";
import { UserRole } from "@prisma/client";
import { PlansController } from "./plans.controller.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createPlanSchema,
  updatePlanSchema,
  createTaxRuleSchema,
  updateTaxRuleSchema,
  createDiscountRuleSchema,
  updateDiscountRuleSchema,
} from "./plans.schemas.js";

export const plansRouter = Router();

// Plans
plansRouter.get(
  "/plans",
  asyncHandler(PlansController.listPlans),
);

plansRouter.get(
  "/plans/:id",
  asyncHandler(PlansController.getPlan),
);

plansRouter.post(
  "/plans",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(createPlanSchema),
  asyncHandler(PlansController.createPlan),
);

plansRouter.patch(
  "/plans/:id",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(updatePlanSchema),
  asyncHandler(PlansController.updatePlan),
);

plansRouter.delete(
  "/plans/:id",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  asyncHandler(PlansController.deletePlan),
);

// Taxes
plansRouter.get(
  "/taxes",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  asyncHandler(PlansController.listTaxRules),
);

plansRouter.post(
  "/taxes",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(createTaxRuleSchema),
  asyncHandler(PlansController.createTaxRule),
);

plansRouter.patch(
  "/taxes/:id",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(updateTaxRuleSchema),
  asyncHandler(PlansController.updateTaxRule),
);

// Discounts (ADMIN only per Role-Permission Matrix)
plansRouter.get(
  "/discounts",
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncHandler(PlansController.listDiscountRules),
);

plansRouter.post(
  "/discounts",
  authenticate,
  requireRole(UserRole.ADMIN),
  validateBody(createDiscountRuleSchema),
  asyncHandler(PlansController.createDiscountRule),
);

plansRouter.patch(
  "/discounts/:id",
  authenticate,
  requireRole(UserRole.ADMIN),
  validateBody(updateDiscountRuleSchema),
  asyncHandler(PlansController.updateDiscountRule),
);
