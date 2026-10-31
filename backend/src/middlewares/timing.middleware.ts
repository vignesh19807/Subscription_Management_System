import { Request, Response, NextFunction } from "express";

export function timingMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = process.hrtime.bigint();

  const originalSend = res.send.bind(res);
  res.send = function (body) {
    if (!res.headersSent) {
      const end = process.hrtime.bigint();
      const durationNs = end - start;
      const durationMs = Number(durationNs) / 1_000_000;
      res.setHeader("X-Response-Time", `${durationMs.toFixed(2)}ms`);
    }
    return originalSend(body);
  };

  next();
}
