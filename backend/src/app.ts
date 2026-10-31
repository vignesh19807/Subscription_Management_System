import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { timingMiddleware } from "./middlewares/timing.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { AppError } from "./common/errors/app-error.js";
import { sendSuccess } from "./common/utils/response-envelope.js";
import { asyncHandler } from "./common/utils/async-handler.js";

// Feature module routers
import { authRouter } from "./modules/auth/auth.routes.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { plansRouter } from "./modules/plans/plans.routes.js";
import { subscriptionsRouter } from "./modules/subscriptions/subscriptions.routes.js";
import { billingRouter } from "./modules/billing/billing.routes.js";
import { paymentsRouter } from "./modules/payments/payments.routes.js";
import { portalRouter } from "./modules/portal/portal.routes.js";

export function createApp(): Express {
  const app = express();

  // 1. Basic security headers
  app.use(helmet());

  // 2. CORS configuration for frontend credentials
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-Id",
        "X-CSRF-Token",
      ],
      exposedHeaders: ["X-Request-Id", "X-Response-Time"],
    }),
  );

  // 3. Request parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // 4. Observability & tracing middlewares
  app.use(requestIdMiddleware);
  app.use(timingMiddleware);

  // ----------------------------------------------------
  // BASE & HEALTH ROUTES
  // ----------------------------------------------------

  app.get(
    "/api/v1/health",
    asyncHandler(async (req: Request, res: Response) => {
      let dbStatus = "CONNECTED";
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch {
        dbStatus = "DISCONNECTED";
      }

      sendSuccess(
        res,
        {
          status: "UP",
          timestamp: new Date().toISOString(),
          database: dbStatus,
          uptimeSeconds: process.uptime(),
          version: "1.0.0",
        },
        200,
        undefined,
        req,
      );
    }),
  );

  // ----------------------------------------------------
  // BUSINESS MODULE ROUTERS
  // ----------------------------------------------------

  // 1. Authentication & Staff Management (/api/v1/auth/*, /api/v1/users/staff)
  app.use("/api/v1", authRouter);

  // 2. Product Catalog & Variants (/api/v1/catalog/* and /api/v1/* aliases)
  app.use("/api/v1/catalog", catalogRouter);
  app.use("/api/v1", catalogRouter);

  // 3. Billing Plans, Taxes & Discounts (/api/v1/plans, /api/v1/taxes, /api/v1/discounts)
  app.use("/api/v1", plansRouter);

  // 4. Quotations & Subscriptions (/api/v1/subscriptions)
  app.use("/api/v1", subscriptionsRouter);

  // 5. Billing Engine & Invoices (/api/v1/billing/*, /api/v1/invoices)
  app.use("/api/v1", billingRouter);

  // 6. Payment Ledger (/api/v1/payments)
  app.use("/api/v1", paymentsRouter);

  // 7. Customer Portal, Analytics Dashboard & Outbox (/api/v1/portal/*, /api/v1/analytics/*, /api/v1/outbox)
  app.use("/api/v1", portalRouter);

  // ----------------------------------------------------
  // UNMATCHED ROUTE (404) & ERROR HANDLER
  // ----------------------------------------------------

  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
  });

  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
