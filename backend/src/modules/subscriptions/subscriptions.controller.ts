import { Request, Response } from "express";
import { SubscriptionsService } from "./subscriptions.service.js";
import { sendSuccess } from "../../common/utils/response-envelope.js";
import { SubscriptionQueryParams } from "./subscriptions.schemas.js";

export class SubscriptionsController {
  static async listSubscriptions(req: Request, res: Response): Promise<void> {
    const { subscriptions, pagination } = await SubscriptionsService.listSubscriptions(
      req.query as unknown as SubscriptionQueryParams,
      req.user!,
    );
    sendSuccess(res, subscriptions, 200, pagination, req);
  }

  static async getSubscription(req: Request, res: Response): Promise<void> {
    const subscription = await SubscriptionsService.getSubscriptionById(
      req.params["id"]!,
      req.user!,
    );
    sendSuccess(res, subscription, 200, undefined, req);
  }

  static async createSubscription(req: Request, res: Response): Promise<void> {
    const subscription = await SubscriptionsService.createSubscription(
      req.body,
      req.user!,
    );
    sendSuccess(res, subscription, 201, undefined, req);
  }

  static async transitionSubscription(req: Request, res: Response): Promise<void> {
    const subscription = await SubscriptionsService.transitionSubscription(
      req.params["id"]!,
      req.body,
      req.user!,
    );
    sendSuccess(res, subscription, 200, undefined, req);
  }
}
