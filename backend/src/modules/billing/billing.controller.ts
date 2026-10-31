import { Request, Response } from "express";
import { BillingService } from "./billing.service.js";
import { sendSuccess } from "../../common/utils/response-envelope.js";
import { InvoiceQueryParams } from "./billing.schemas.js";

export class BillingController {
  static async dryRun(req: Request, res: Response): Promise<void> {
    const result = await BillingService.dryRunBilling(req.body);
    sendSuccess(res, result, 200, undefined, req);
  }

  static async executeBilling(req: Request, res: Response): Promise<void> {
    const result = await BillingService.executeBilling(req.body, req.user!.email);
    sendSuccess(res, result, 201, undefined, req);
  }

  static async listInvoices(req: Request, res: Response): Promise<void> {
    const { invoices, pagination } = await BillingService.listInvoices(
      req.query as unknown as InvoiceQueryParams,
      req.user!,
    );
    sendSuccess(res, invoices, 200, pagination, req);
  }

  static async getInvoice(req: Request, res: Response): Promise<void> {
    const invoice = await BillingService.getInvoiceById(req.params["id"]!, req.user!);
    sendSuccess(res, invoice, 200, undefined, req);
  }

  static async confirmInvoice(req: Request, res: Response): Promise<void> {
    const invoice = await BillingService.confirmInvoice(req.params["id"]!, req.user!);
    sendSuccess(res, invoice, 200, undefined, req);
  }
}
