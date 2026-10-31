import { Response, Request } from "express";
import { ApiSuccessResponse, PaginationMeta } from "../types/api.types.js";

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: PaginationMeta,
  req?: Request,
): void {
  const meta = {
    timestamp: new Date().toISOString(),
    requestId: req?.id || (req?.headers["x-request-id"] as string) || undefined,
    ...(pagination ? { pagination } : {}),
  };

  const payload: ApiSuccessResponse<T> = {
    data,
    meta,
  };

  res.status(statusCode).json(payload);
}
