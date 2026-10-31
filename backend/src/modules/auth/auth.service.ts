import { v4 as uuidv4 } from "uuid";
import { UserRole } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../common/errors/app-error.js";
import { PasswordUtil } from "../../common/auth/password.js";
import { TokenUtil, AuthUser } from "../../common/auth/token.js";
import {
  RegisterInput,
  LoginInput,
  CreateStaffInput,
  ResetPasswordInput,
} from "./auth.schemas.js";

export interface SanitizedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

function sanitizeUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}): SanitizedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export class AuthService {
  static async register(input: RegisterInput): Promise<{ user: SanitizedUser; token: string }> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw AppError.conflict("A user with this email address already exists.");
    }

    const passwordHash = await PasswordUtil.hash(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: UserRole.CUSTOMER, // FR-001: Public signup is strictly CUSTOMER role
        isActive: true,
      },
    });

    const authPayload: AuthUser = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const token = TokenUtil.sign(authPayload);

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  static async login(input: LoginInput): Promise<{ user: SanitizedUser; token: string }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthenticated("Invalid email or password.");
    }

    const isValidPassword = await PasswordUtil.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw AppError.unauthenticated("Invalid email or password.");
    }

    const authPayload: AuthUser = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const token = TokenUtil.sign(authPayload);

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Do not reveal whether email exists; silently return if not found (NFR-003)
    if (!user || !user.isActive) {
      return;
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await prisma.$transaction(async (tx) => {
      // Invalidate existing unused tokens for this user
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, isUsed: false },
        data: { isUsed: true, usedAt: new Date() },
      });

      // Create new reset token
      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: resetToken,
          expiresAt,
          isUsed: false,
        },
      });

      // Log dispatch to simulated local Email Outbox (FR-003, FR-021)
      await tx.emailLog.create({
        data: {
          recipientId: user.id,
          recipientEmail: user.email,
          subject: "LoopBill — Password Reset Request",
          bodyHtml: `<p>Hello ${user.fullName},</p><p>You requested a password reset. Use token: <code>${resetToken}</code></p>`,
          actionLink: `http://localhost:3000/reset-password?token=${resetToken}`,
          emailType: "PASSWORD_RESET",
        },
      });
    });
  }

  static async resetPassword(input: ResetPasswordInput): Promise<void> {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: input.token },
      include: { user: true },
    });

    if (
      !resetRecord ||
      resetRecord.isUsed ||
      resetRecord.expiresAt < new Date() ||
      !resetRecord.user.isActive
    ) {
      throw AppError.badRequest("Invalid or expired password reset token.");
    }

    const passwordHash = await PasswordUtil.hash(input.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });
    });
  }

  static async createStaff(input: CreateStaffInput): Promise<SanitizedUser> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw AppError.conflict("A user with this email address already exists.");
    }

    const passwordHash = await PasswordUtil.hash(input.password);

    const staff = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: UserRole.STAFF, // FR-004: Admin creates STAFF accounts
        isActive: true,
      },
    });

    return sanitizeUser(staff);
  }

  static async getMe(userId: string): Promise<SanitizedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw AppError.notFound("User");
    }

    return sanitizeUser(user);
  }
}
