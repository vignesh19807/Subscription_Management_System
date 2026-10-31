import { describe, it, expect } from "vitest";
import { validateEnv } from "../../src/config/env.js";

describe("Environment Variable Validation (Zod)", () => {
  it("should successfully validate when all required variables are present", () => {
    const validConfig = {
      DATABASE_URL:
        "postgresql://loopbill:loopbill_secret@localhost:5433/loopbill_dev",
      APP_DATABASE_URL:
        "postgresql://loopbill_app:loopbill_app_secret@localhost:5433/loopbill_dev",
      JWT_SECRET: "this_is_a_sufficiently_long_jwt_secret_32_chars",
      COOKIE_SECRET: "this_is_a_valid_cookie_secret_16",
      NODE_ENV: "test",
    };

    const parsed = validateEnv(validConfig);
    expect(parsed.DATABASE_URL).toBe(validConfig.DATABASE_URL);
    expect(parsed.APP_DATABASE_URL).toBe(validConfig.APP_DATABASE_URL);
    expect(parsed.JWT_SECRET).toBe(validConfig.JWT_SECRET);
    expect(parsed.PORT).toBe(5000); // default
  });

  it("should throw an error if DATABASE_URL is missing", () => {
    const invalidConfig = {
      JWT_SECRET: "this_is_a_sufficiently_long_jwt_secret_32_chars",
      COOKIE_SECRET: "this_is_a_valid_cookie_secret_16",
    };

    expect(() => validateEnv(invalidConfig)).toThrow(/DATABASE_URL/);
  });

  it("should throw an error if JWT_SECRET is shorter than 32 characters", () => {
    const invalidConfig = {
      DATABASE_URL: "postgresql://localhost:5432/db",
      JWT_SECRET: "too_short",
      COOKIE_SECRET: "valid_cookie_secret_16",
    };

    expect(() => validateEnv(invalidConfig)).toThrow(
      /JWT_SECRET: JWT_SECRET must be at least 32 characters long/,
    );
  });

  it("should recognize and preserve APP_DATABASE_URL, TEST_DATABASE_URL, and TEST_APP_DATABASE_URL", () => {
    const config = {
      DATABASE_URL:
        "postgresql://loopbill:loopbill_secret@localhost:5433/loopbill_dev",
      APP_DATABASE_URL:
        "postgresql://loopbill_app:loopbill_app_secret@localhost:5433/loopbill_dev",
      TEST_DATABASE_URL:
        "postgresql://loopbill:loopbill_secret@localhost:5433/loopbill_test",
      TEST_APP_DATABASE_URL:
        "postgresql://loopbill_app:loopbill_app_secret@localhost:5433/loopbill_test",
      JWT_SECRET: "this_is_a_sufficiently_long_jwt_secret_32_chars",
      COOKIE_SECRET: "this_is_a_valid_cookie_secret_16",
      NODE_ENV: "test",
    };

    const parsed = validateEnv(config);
    expect(parsed.APP_DATABASE_URL).toBe(config.APP_DATABASE_URL);
    expect(parsed.TEST_DATABASE_URL).toBe(config.TEST_DATABASE_URL);
    expect(parsed.TEST_APP_DATABASE_URL).toBe(config.TEST_APP_DATABASE_URL);
  });
});

describe("Database URL Resolution (resolveDatabaseUrl)", () => {
  const baseConfig = {
    DATABASE_URL: "postgresql://loopbill:secret@localhost:5433/loopbill_dev",
    APP_DATABASE_URL:
      "postgresql://loopbill_app:secret@localhost:5433/loopbill_dev",
    TEST_DATABASE_URL:
      "postgresql://loopbill:secret@localhost:5433/loopbill_test",
    TEST_APP_DATABASE_URL:
      "postgresql://loopbill_app:secret@localhost:5433/loopbill_test",
  };

  it("should select TEST_APP_DATABASE_URL when NODE_ENV=test", async () => {
    const { resolveDatabaseUrl } = await import("../../src/config/db.js");
    const url = resolveDatabaseUrl({
      ...baseConfig,
      NODE_ENV: "test",
    });
    expect(url).toBe(baseConfig.TEST_APP_DATABASE_URL);
  });

  it("should fallback to TEST_DATABASE_URL when TEST_APP_DATABASE_URL is absent and NODE_ENV=test", async () => {
    const { resolveDatabaseUrl } = await import("../../src/config/db.js");
    const url = resolveDatabaseUrl({
      NODE_ENV: "test",
      DATABASE_URL: baseConfig.DATABASE_URL,
      APP_DATABASE_URL: baseConfig.APP_DATABASE_URL,
      TEST_DATABASE_URL: baseConfig.TEST_DATABASE_URL,
    });
    expect(url).toBe(baseConfig.TEST_DATABASE_URL);
  });

  it("should strictly throw and never fallback to development database when test URLs are missing in NODE_ENV=test", async () => {
    const { resolveDatabaseUrl } = await import("../../src/config/db.js");
    expect(() =>
      resolveDatabaseUrl({
        NODE_ENV: "test",
        DATABASE_URL: baseConfig.DATABASE_URL,
        APP_DATABASE_URL: baseConfig.APP_DATABASE_URL,
      }),
    ).toThrow(/Neither TEST_APP_DATABASE_URL nor TEST_DATABASE_URL is defined/);
  });

  it("should strictly throw if test URL targets loopbill_dev in NODE_ENV=test", async () => {
    const { resolveDatabaseUrl } = await import("../../src/config/db.js");
    expect(() =>
      resolveDatabaseUrl({
        NODE_ENV: "test",
        DATABASE_URL: baseConfig.DATABASE_URL,
        TEST_APP_DATABASE_URL:
          "postgresql://loopbill_app:secret@localhost:5433/loopbill_dev",
      }),
    ).toThrow(/CRITICAL: Integration tests cannot target development database/);
  });

  it("should select APP_DATABASE_URL when NODE_ENV=development", async () => {
    const { resolveDatabaseUrl } = await import("../../src/config/db.js");
    const url = resolveDatabaseUrl({
      ...baseConfig,
      NODE_ENV: "development",
    });
    expect(url).toBe(baseConfig.APP_DATABASE_URL);
  });
});
