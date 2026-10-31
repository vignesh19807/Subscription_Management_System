import { z } from "zod";

const passwordSchema = z
  .string()
  .min(9, "Password must contain at least 9 characters.")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{9,}$/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one special character.",
  );

export const registerSchema = z.object({
  email: z.string().email("Invalid email address.").toLowerCase().trim(),
  password: passwordSchema,
  fullName: z.string().min(2, "Full name must be at least 2 characters.").max(255).trim(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address.").toLowerCase().trim(),
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address.").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required.").trim(),
  newPassword: passwordSchema,
});

export const createStaffSchema = z.object({
  email: z.string().email("Invalid email address.").toLowerCase().trim(),
  password: passwordSchema,
  fullName: z.string().min(2, "Full name must be at least 2 characters.").max(255).trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
