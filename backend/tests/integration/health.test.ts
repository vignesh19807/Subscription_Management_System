import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { connectDb, disconnectDb } from "../../src/config/db.js";

describe("Health & Global Error Middleware Integration", () => {
  beforeAll(async () => {
    await connectDb();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("GET /api/v1/health should return 200 with status UP and timing header", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe("UP");
    expect(res.body.data.database).toBe("CONNECTED");
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.requestId).toBeDefined();

    // Verify response headers
    expect(res.headers["x-response-time"]).toBeDefined();
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("GET /api/v1/non-existent-route should return 404 with standard error envelope", async () => {
    const res = await request(app).get("/api/v1/non-existent-route");

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toContain(
      "Route GET /api/v1/non-existent-route not found",
    );
    expect(res.body.error.requestId).toBeDefined();
    expect(res.body.error.timestamp).toBeDefined();
  });
});
