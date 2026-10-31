import { Request, Response, NextFunction } from "express";
import { AppError } from "../common/errors/app-error.js";
import { TokenUtil, AUTH_COOKIE_NAME, AuthUser } from "../common/auth/token.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // Check cookie first, then Bearer Authorization header
  let token: string | undefined = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    throw AppError.unauthenticated("Authentication required. No session token provided.");
  }

  const user = TokenUtil.verify(token);
  req.user = user;
  next();
}

/**
 * Optional authentication middleware: if token is present, sets req.user; otherwise proceeds.
 */
export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  let token: string | undefined = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (token) {
    try {
      req.user = TokenUtil.verify(token);
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}
