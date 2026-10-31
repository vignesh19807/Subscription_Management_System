import { Router } from "express";
import { UserRole } from "@prisma/client";
import { AuthController } from "./auth.controller.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createStaffSchema,
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post(
  "/auth/register",
  validateBody(registerSchema),
  asyncHandler(AuthController.register),
);

authRouter.post(
  "/auth/login",
  validateBody(loginSchema),
  asyncHandler(AuthController.login),
);

authRouter.post(
  "/auth/logout",
  asyncHandler(AuthController.logout),
);

authRouter.get(
  "/auth/me",
  authenticate,
  asyncHandler(AuthController.getMe),
);

authRouter.post(
  "/auth/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(AuthController.forgotPassword),
);

authRouter.post(
  "/auth/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(AuthController.resetPassword),
);

// Admin-only staff provisioning (FR-004, API.md)
authRouter.post(
  "/users/staff",
  authenticate,
  requireRole(UserRole.ADMIN),
  validateBody(createStaffSchema),
  asyncHandler(AuthController.createStaff),
);

// Alias under /auth/staff
authRouter.post(
  "/auth/staff",
  authenticate,
  requireRole(UserRole.ADMIN),
  validateBody(createStaffSchema),
  asyncHandler(AuthController.createStaff),
);
