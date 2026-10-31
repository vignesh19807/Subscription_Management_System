import { z } from "zod";
import { ProductType } from "@prisma/client";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required.").max(255).trim(),
  description: z.string().optional(),
  productType: z.nativeEnum(ProductType).default(ProductType.STANDARD),
  salesPrice: z.coerce.number().min(0, "Sales price cannot be negative."),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative.").default(0),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  attributeName: z.string().min(1, "Attribute name is required.").max(100).trim(),
  attributeValue: z.string().min(1, "Attribute value is required.").max(100).trim(),
  priceDelta: z.coerce.number().default(0),
  sku: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
});

export const updateVariantSchema = createVariantSchema.partial();

export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  productType: z.nativeEnum(ProductType).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type CatalogQueryParams = z.infer<typeof catalogQuerySchema>;
