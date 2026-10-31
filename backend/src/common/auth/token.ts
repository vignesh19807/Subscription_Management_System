import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { CookieOptions } from "express";

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export const AUTH_COOKIE_NAME = "loopbill_token";

export class TokenUtil {
  static sign(payload: AuthUser): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  static verify(token: string): AuthUser {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        fullName: decoded.fullName,
      };
    } catch {
      throw AppError.unauthenticated("Invalid or expired session token.");
    }
  }

  static getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    };
  }
}
