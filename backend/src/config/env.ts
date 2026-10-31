import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_DATABASE_URL: z.string().optional(),
  TEST_DATABASE_URL: z.string().optional(),
  TEST_APP_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  COOKIE_SECRET: z
    .string()
    .min(16, "COOKIE_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(
  env: Record<string, unknown> = process.env,
): EnvConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const errorMessages = result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    );
    throw new Error(
      `Environment validation failed:\n  ${errorMessages.join("\n  ")}`,
    );
  }
  return result.data;
}

export const env = validateEnv();
