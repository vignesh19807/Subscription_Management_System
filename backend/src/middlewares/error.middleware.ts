import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../common/errors/app-error.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";
import { ApiErrorResponse } from "../common/types/api.types.js";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId =
    req.id || (req.headers["x-request-id"] as string) || undefined;
  const timestamp = new Date().toISOString();

  // 1. Known AppError
  if (err instanceof AppError) {
    logger.warn(
      {
        err: {
          name: err.name,
          message: err.message,
          statusCode: err.statusCode,
          errorCode: err.errorCode,
          fields: err.fields,
        },
        requestId,
        path: req.originalUrl,
        method: req.method,
      },
      `AppError handled: ${err.message}`,
    );

    const payload: ApiErrorResponse = {
      error: {
        code: err.errorCode,
        message: err.message,
        fields: err.fields,
        requestId,
        timestamp,
      },
    };

    res.status(err.statusCode).json(payload);
    return;
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "root";
      if (!fields[path]) {
        fields[path] = [];
      }
      fields[path].push(issue.message);
    }

    logger.warn(
      { fields, requestId, path: req.originalUrl },
      "Zod validation error",
    );

    const payload: ApiErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        fields,
        requestId,
        timestamp,
      },
    };

    res.status(400).json(payload);
    return;
  }

  // 3. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.["target"])
        ? (err.meta["target"] as string[]).join(", ")
        : "field";

      const payload: ApiErrorResponse = {
        error: {
          code: "CONFLICT",
          message: `Unique constraint violation on ${target}.`,
          requestId,
          timestamp,
        },
      };

      res.status(409).json(payload);
      return;
    }

    if (err.code === "P2025") {
      const payload: ApiErrorResponse = {
        error: {
          code: "NOT_FOUND",
          message: "Requested record was not found.",
          requestId,
          timestamp,
        },
      };

      res.status(404).json(payload);
      return;
    }

    if (err.code === "P2003") {
      const payload: ApiErrorResponse = {
        error: {
          code: "UNPROCESSABLE_ENTITY",
          message:
            "Foreign key constraint failed. Related record does not exist or cannot be deleted.",
          requestId,
          timestamp,
        },
      };

      res.status(422).json(payload);
      return;
    }
  }

  // 4. JSON Syntax / Body Parser Error
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as { status: number }).status === 400
  ) {
    const payload: ApiErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Malformed JSON payload in request body.",
        requestId,
        timestamp,
      },
    };

    res.status(400).json(payload);
    return;
  }

  // 5. Unhandled / Internal Server Error
  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      requestId,
      path: req.originalUrl,
      method: req.method,
    },
    "Unhandled server error caught by errorMiddleware",
  );

  const isProduction = env.NODE_ENV === "production";
  const payload: ApiErrorResponse = {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isProduction
        ? "An unexpected server error occurred."
        : err.message || "An unexpected server error occurred.",
      requestId,
      timestamp,
    },
  };

  res.status(500).json(payload);
}
