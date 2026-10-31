import { Router } from "express";
import { UserRole } from "@prisma/client";
import { CatalogController } from "./catalog.controller.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  catalogQuerySchema,
} from "./catalog.schemas.js";

export const catalogRouter = Router();

// Products
catalogRouter.get(
  "/products",
  validateQuery(catalogQuerySchema),
  asyncHandler(CatalogController.listProducts),
);

catalogRouter.get(
  "/products/:id",
  asyncHandler(CatalogController.getProduct),
);

catalogRouter.post(
  "/products",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(createProductSchema),
  asyncHandler(CatalogController.createProduct),
);

catalogRouter.patch(
  "/products/:id",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(updateProductSchema),
  asyncHandler(CatalogController.updateProduct),
);

catalogRouter.delete(
  "/products/:id",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  asyncHandler(CatalogController.deleteProduct),
);

// Variants
catalogRouter.post(
  "/products/:id/variants",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(createVariantSchema),
  asyncHandler(CatalogController.addVariant),
);

catalogRouter.patch(
  "/variants/:id",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  validateBody(updateVariantSchema),
  asyncHandler(CatalogController.updateVariant),
);

catalogRouter.delete(
  "/variants/:id",
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.STAFF),
  asyncHandler(CatalogController.deleteVariant),
);
