export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR"
  | "FINANCIAL_PRECISION_ERROR"
  | "IDEMPOTENT_CONFLICT";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly fields?: Record<string, string[]>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode,
    fields?: Record<string, string[]>,
    isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.fields = fields;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(
    message: string,
    fields?: Record<string, string[]>,
  ): AppError {
    return new AppError(message, 400, "VALIDATION_ERROR", fields);
  }

  static unauthenticated(message = "Authentication required."): AppError {
    return new AppError(message, 401, "UNAUTHENTICATED");
  }

  static forbidden(
    message = "Access denied. Insufficient permissions.",
  ): AppError {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(resource = "Resource"): AppError {
    return new AppError(`${resource} not found.`, 404, "NOT_FOUND");
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, "CONFLICT");
  }

  static unprocessable(
    message: string,
    fields?: Record<string, string[]>,
  ): AppError {
    return new AppError(message, 422, "UNPROCESSABLE_ENTITY", fields);
  }

  static tooManyRequests(
    message = "Rate limit exceeded. Please try again later.",
  ): AppError {
    return new AppError(message, 429, "TOO_MANY_REQUESTS");
  }

  static internal(message = "An unexpected server error occurred."): AppError {
    return new AppError(
      message,
      500,
      "INTERNAL_SERVER_ERROR",
      undefined,
      false,
    );
  }
}
