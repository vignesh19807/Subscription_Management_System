import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../common/errors/app-error.js";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthenticated("Authentication required.");
    }

    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Access denied. Role '${req.user.role}' is not authorized to perform this action.`,
      );
    }

    next();
  };
}
