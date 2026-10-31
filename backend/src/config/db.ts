import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";
import { env } from "./env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function resolveDatabaseUrl(config: {
  NODE_ENV: string;
  TEST_APP_DATABASE_URL?: string;
  TEST_DATABASE_URL?: string;
  APP_DATABASE_URL?: string;
  DATABASE_URL: string;
}): string {
  const runtimeDbUrl =
    config.NODE_ENV === "test"
      ? (config.TEST_APP_DATABASE_URL ?? config.TEST_DATABASE_URL)
      : (config.APP_DATABASE_URL ?? config.DATABASE_URL);

  if (config.NODE_ENV === "test") {
    if (!runtimeDbUrl) {
      throw new Error(
        "Neither TEST_APP_DATABASE_URL nor TEST_DATABASE_URL is defined. Integration tests must use the dedicated test database.",
      );
    }
    if (runtimeDbUrl.includes("loopbill_dev")) {
      throw new Error(
        "CRITICAL: Integration tests cannot target development database (loopbill_dev). Configure TEST_APP_DATABASE_URL or TEST_DATABASE_URL to point to loopbill_test.",
      );
    }
  }

  if (!runtimeDbUrl) {
    throw new Error("Database URL is not defined.");
  }

  return runtimeDbUrl;
}

const runtimeDbUrl = resolveDatabaseUrl(env);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: runtimeDbUrl,
      },
    },
    log:
      env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

interface PrismaEventSubscriber {
  $on(
    event: 'query',
    callback: (e: { query: string; params: string; duration: number }) => void,
  ): void;
  $on(event: 'error', callback: (e: { message: string }) => void): void;
}

// Log queries in debug mode
if (env.LOG_LEVEL === 'debug' || env.LOG_LEVEL === 'trace') {
  (prisma as unknown as PrismaEventSubscriber).$on(
    'query',
    (e: { query: string; params: string; duration: number }) => {
      logger.debug(
        { query: e.query, durationMs: e.duration },
        'Database Query Executed',
      );
    },
  );
}

(prisma as unknown as PrismaEventSubscriber).$on('error', (e: { message: string }) => {
  logger.error({ err: e.message }, 'Database Client Error');
});

export async function connectDb(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully.");
  } catch (err) {
    logger.fatal({ err }, "Failed to connect to PostgreSQL database.");
    throw err;
  }
}

export async function disconnectDb(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Database disconnected cleanly.");
  } catch (err) {
    logger.error({ err }, "Error during database disconnection.");
  }
}
