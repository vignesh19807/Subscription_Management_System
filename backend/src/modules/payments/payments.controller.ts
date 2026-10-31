import { Request, Response } from "express";
import { PaymentsService } from "./payments.service.js";
import { sendSuccess } from "../../common/utils/response-envelope.js";
import { PaymentQueryParams } from "./payments.schemas.js";

export class PaymentsController {
  static async recordPayment(req: Request, res: Response): Promise<void> {
    const payment = await PaymentsService.recordPayment(req.body, req.user!);
    sendSuccess(res, payment, 201, undefined, req);
  }

  static async listPayments(req: Request, res: Response): Promise<void> {
    const { payments, pagination } = await PaymentsService.listPayments(
      req.query as unknown as PaymentQueryParams,
      req.user!,
    );
    sendSuccess(res, payments, 200, pagination, req);
  }
}
