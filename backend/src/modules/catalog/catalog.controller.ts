import { Request, Response } from "express";
import { CatalogService } from "./catalog.service.js";
import { sendSuccess } from "../../common/utils/response-envelope.js";
import { CatalogQueryParams } from "./catalog.schemas.js";

export class CatalogController {
  static async listProducts(req: Request, res: Response): Promise<void> {
    const { products, pagination } = await CatalogService.listProducts(req.query as unknown as CatalogQueryParams);
    sendSuccess(res, products, 200, pagination, req);
  }

  static async getProduct(req: Request, res: Response): Promise<void> {
    const product = await CatalogService.getProductById(req.params["id"]!);
    sendSuccess(res, product, 200, undefined, req);
  }

  static async createProduct(req: Request, res: Response): Promise<void> {
    const product = await CatalogService.createProduct(req.body);
    sendSuccess(res, product, 201, undefined, req);
  }

  static async updateProduct(req: Request, res: Response): Promise<void> {
    const product = await CatalogService.updateProduct(req.params["id"]!, req.body);
    sendSuccess(res, product, 200, undefined, req);
  }

  static async deleteProduct(req: Request, res: Response): Promise<void> {
    await CatalogService.deleteProduct(req.params["id"]!);
    sendSuccess(res, { message: "Product removed successfully." }, 200, undefined, req);
  }

  static async addVariant(req: Request, res: Response): Promise<void> {
    const variant = await CatalogService.addVariant(req.params["id"]!, req.body);
    sendSuccess(res, variant, 201, undefined, req);
  }

  static async updateVariant(req: Request, res: Response): Promise<void> {
    const variant = await CatalogService.updateVariant(req.params["id"]!, req.body);
    sendSuccess(res, variant, 200, undefined, req);
  }

  static async deleteVariant(req: Request, res: Response): Promise<void> {
    await CatalogService.deleteVariant(req.params["id"]!);
    sendSuccess(res, { message: "Variant removed successfully." }, 200, undefined, req);
  }
}
