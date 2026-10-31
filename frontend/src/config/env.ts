import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_USE_MOCK_API: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === undefined),
  VITE_APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
});

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
