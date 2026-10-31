import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../common/errors/app-error.js";
import { Money } from "../../common/money/money.js";
import { parsePagination, buildPaginationMeta } from "../../common/pagination/pagination.js";
import { PaginationMeta } from "../../common/types/api.types.js";
import {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
  CatalogQueryParams,
} from "./catalog.schemas.js";

export class CatalogService {
  static async listProducts(query: CatalogQueryParams): Promise<{
    products: Array<Prisma.ProductGetPayload<{ include: { variants: true } }>>;
    pagination: PaginationMeta;
  }> {
    const { skip, take, page, limit } = parsePagination(query as unknown as Record<string, unknown>);

    const where: Prisma.ProductWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.productType) {
      where.productType = query.productType;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    }

    const [totalRecords, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { variants: true },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      products,
      pagination: buildPaginationMeta(totalRecords, page, limit),
    };
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product) {
      throw AppError.notFound("Product");
    }

    return product;
  }

  static async createProduct(input: CreateProductInput) {
    return prisma.product.create({
      data: {
        name: input.name,
        description: input.description,
        productType: input.productType,
        salesPrice: Money.round(input.salesPrice),
        costPrice: Money.round(input.costPrice),
        notes: input.notes,
        isActive: input.isActive,
      },
      include: { variants: true },
    });
  }

  static async updateProduct(id: string, input: UpdateProductInput) {
    await this.getProductById(id);

    const data: Prisma.ProductUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.productType !== undefined) data.productType = input.productType;
    if (input.salesPrice !== undefined) data.salesPrice = Money.round(input.salesPrice);
    if (input.costPrice !== undefined) data.costPrice = Money.round(input.costPrice);
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return prisma.product.update({
      where: { id },
      data,
      include: { variants: true },
    });
  }

  static async deleteProduct(id: string) {
    await this.getProductById(id);

    // Check if referenced in subscriptions or invoices
    const [subLinesCount, invLinesCount] = await Promise.all([
      prisma.subscriptionLine.count({ where: { productId: id } }),
      prisma.invoiceLine.count({ where: { productId: id } }),
    ]);

    if (subLinesCount > 0 || invLinesCount > 0) {
      // Soft-delete to preserve relational integrity
      return prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.product.delete({ where: { id } });
  }

  static async addVariant(productId: string, input: CreateVariantInput) {
    await this.getProductById(productId);

    return prisma.productVariant.create({
      data: {
        productId,
        attributeName: input.attributeName,
        attributeValue: input.attributeValue,
        priceDelta: Money.round(input.priceDelta),
        sku: input.sku,
        isActive: input.isActive,
      },
    });
  }

  static async updateVariant(variantId: string, input: UpdateVariantInput) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw AppError.notFound("Product variant");
    }

    const data: Prisma.ProductVariantUpdateInput = {};
    if (input.attributeName !== undefined) data.attributeName = input.attributeName;
    if (input.attributeValue !== undefined) data.attributeValue = input.attributeValue;
    if (input.priceDelta !== undefined) data.priceDelta = Money.round(input.priceDelta);
    if (input.sku !== undefined) data.sku = input.sku;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  }

  static async deleteVariant(variantId: string) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw AppError.notFound("Product variant");
    }

    const [subLinesCount, invLinesCount] = await Promise.all([
      prisma.subscriptionLine.count({ where: { variantId } }),
      prisma.invoiceLine.count({ where: { variantId } }),
    ]);

    if (subLinesCount > 0 || invLinesCount > 0) {
      return prisma.productVariant.update({
        where: { id: variantId },
        data: { isActive: false },
      });
    }

    return prisma.productVariant.delete({ where: { id: variantId } });
  }
}
