import { Router } from "express";
import { SubscriptionsController } from "./subscriptions.controller.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  createSubscriptionSchema,
  transitionSubscriptionSchema,
  subscriptionQuerySchema,
} from "./subscriptions.schemas.js";

export const subscriptionsRouter = Router();

subscriptionsRouter.get(
  "/subscriptions",
  authenticate,
  validateQuery(subscriptionQuerySchema),
  asyncHandler(SubscriptionsController.listSubscriptions),
);

subscriptionsRouter.get(
  "/subscriptions/:id",
  authenticate,
  asyncHandler(SubscriptionsController.getSubscription),
);

subscriptionsRouter.post(
  "/subscriptions",
  authenticate,
  validateBody(createSubscriptionSchema),
  asyncHandler(SubscriptionsController.createSubscription),
);

subscriptionsRouter.post(
  "/subscriptions/:id/transition",
  authenticate,
  validateBody(transitionSubscriptionSchema),
  asyncHandler(SubscriptionsController.transitionSubscription),
);
