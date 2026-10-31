import { Request, Response } from "express";
import { PortalService } from "./portal.service.js";
import { sendSuccess } from "../../common/utils/response-envelope.js";

export class PortalController {
  // Customer Portal
  static async getCustomerSubscriptions(req: Request, res: Response): Promise<void> {
    const subscriptions = await PortalService.getCustomerSubscriptions(req.user!.userId);
    sendSuccess(res, subscriptions, 200, undefined, req);
  }

  static async getCustomerInvoices(req: Request, res: Response): Promise<void> {
    const invoices = await PortalService.getCustomerInvoices(req.user!.userId);
    sendSuccess(res, invoices, 200, undefined, req);
  }

  static async toggleCustomerAddon(req: Request, res: Response): Promise<void> {
    const { isActive } = req.body;
    const line = await PortalService.toggleCustomerAddon(
      req.user!.userId,
      req.params["id"]!,
      req.params["lineId"]!,
      Boolean(isActive),
    );
    sendSuccess(res, line, 200, undefined, req);
  }

  // Financial Dashboard (Admin/Staff)
  static async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    const metrics = await PortalService.getDashboardMetrics();
    sendSuccess(res, metrics, 200, undefined, req);
  }

  // Simulated Email Outbox (Admin/Staff)
  static async listEmailOutbox(req: Request, res: Response): Promise<void> {
    const { emails, pagination } = await PortalService.listEmailOutbox(req.query);
    sendSuccess(res, { emails }, 200, pagination, req);
  }
}
