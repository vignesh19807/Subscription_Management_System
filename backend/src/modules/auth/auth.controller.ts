import { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { TokenUtil, AUTH_COOKIE_NAME } from "../../common/auth/token.js";
import { sendSuccess } from "../../common/utils/response-envelope.js";
import { AppError } from "../../common/errors/app-error.js";

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const { user, token } = await AuthService.register(req.body);
    res.cookie(AUTH_COOKIE_NAME, token, TokenUtil.getCookieOptions());
    sendSuccess(res, { user, token }, 201, undefined, req);
  }

  static async login(req: Request, res: Response): Promise<void> {
    const { user, token } = await AuthService.login(req.body);
    res.cookie(AUTH_COOKIE_NAME, token, TokenUtil.getCookieOptions());
    sendSuccess(res, { user, token }, 200, undefined, req);
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    sendSuccess(res, { message: "Logged out successfully." }, 200, undefined, req);
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw AppError.unauthenticated();
    }
    const user = await AuthService.getMe(req.user.userId);
    sendSuccess(res, user, 200, undefined, req);
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    await AuthService.forgotPassword(req.body.email);
    sendSuccess(
      res,
      { message: "If an account with that email exists, password reset instructions have been queued." },
      200,
      undefined,
      req,
    );
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    await AuthService.resetPassword(req.body);
    sendSuccess(
      res,
      { message: "Password reset successful. Please sign in with your new password." },
      200,
      undefined,
      req,
    );
  }

  static async createStaff(req: Request, res: Response): Promise<void> {
    const staff = await AuthService.createStaff(req.body);
    sendSuccess(res, staff, 201, undefined, req);
  }
}
