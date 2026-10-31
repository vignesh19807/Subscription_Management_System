import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma, connectDb, disconnectDb } from "../../src/config/db.js";
import { PasswordUtil } from "../../src/common/auth/password.js";
import { UserRole, User } from "@prisma/client";
import { TokenUtil, AUTH_COOKIE_NAME } from "../../src/common/auth/token.js";

describe("Authentication & RBAC Integration Tests", () => {
  let adminToken: string;
  let adminUser: User;

  beforeAll(async () => {
    await connectDb();

    // Create or find an ADMIN user for staff creation tests
    const adminEmail = `admin_test_${Date.now()}@loopbill.com`;
    const passwordHash = await PasswordUtil.hash("AdminSecret#2026");
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: "System Admin",
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    adminToken = TokenUtil.sign({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      fullName: adminUser.fullName,
    });
  });

  afterAll(async () => {
    await disconnectDb();
  });

  const testEmail = `cust_${Date.now()}@test.com`;
  const validPassword = "SecurePassword@123";

  it("should register a new customer with CUSTOMER role and set cookie (FR-001)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: testEmail,
        password: validPassword,
        fullName: "Test Customer",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.role).toBe("CUSTOMER");
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(res.body.data.token).toBeDefined();

    // Cookie verification
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieList = Array.isArray(cookies) ? cookies : [cookies!];
    expect(cookieList.some((c: string) => c.includes(AUTH_COOKIE_NAME))).toBe(true);
  });

  it("should reject registration with weak password (< 9 characters or missing special char)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `weak_${Date.now()}@test.com`,
        password: "weak",
        fullName: "Weak User",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject duplicate registration with same email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: testEmail,
        password: validPassword,
        fullName: "Duplicate User",
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("should authenticate customer on login and issue token (FR-002)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: validPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.token).toBeDefined();
  });

  it("should reject login with incorrect password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: "WrongPassword@999",
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("should retrieve current user profile with valid token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: validPassword,
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(testEmail);
    expect(meRes.body.data.role).toBe("CUSTOMER");
  });

  it("should clear session cookie upon logout", async () => {
    const res = await request(app).post("/api/v1/auth/logout");

    expect(res.status).toBe(200);
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieList = Array.isArray(cookies) ? cookies : [cookies!];
    expect(cookieList.some((c: string) => c.includes(`${AUTH_COOKIE_NAME}=;`))).toBe(true);
  });

  it("should request password reset and queue email log (FR-003, FR-021)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: testEmail });

    expect(res.status).toBe(200);

    // Verify token record in database
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { user: { email: testEmail }, isUsed: false },
      orderBy: { createdAt: "desc" },
    });
    expect(tokenRecord).not.toBeNull();

    // Verify email outbox log entry
    const emailLog = await prisma.emailLog.findFirst({
      where: { recipientEmail: testEmail, emailType: "PASSWORD_RESET" },
      orderBy: { sentAt: "desc" },
    });
    expect(emailLog).not.toBeNull();
    expect(emailLog?.bodyHtml).toContain(tokenRecord?.tokenHash);
  });

  it("should reset password with valid token", async () => {
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { user: { email: testEmail }, isUsed: false },
      orderBy: { createdAt: "desc" },
    });
    expect(tokenRecord).not.toBeNull();

    const newPassword = "BrandNewPassword@2026";
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        token: tokenRecord!.tokenHash,
        newPassword,
      });

    expect(res.status).toBe(200);

    // Login with new password should now succeed
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: newPassword,
      });

    expect(loginRes.status).toBe(200);
  });

  it("should allow ADMIN to provision a STAFF account (FR-004)", async () => {
    const staffEmail = `staff_${Date.now()}@loopbill.com`;
    const res = await request(app)
      .post("/api/v1/users/staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: staffEmail,
        password: "StaffSecretPassword@123",
        fullName: "Operations Staff",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("STAFF");
    expect(res.body.data.email).toBe(staffEmail);
  });

  it("should strictly deny CUSTOMER from creating STAFF accounts", async () => {
    const custLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: "BrandNewPassword@2026",
      });

    const custToken = custLogin.body.data.token;

    const res = await request(app)
      .post("/api/v1/users/staff")
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        email: `hacked_${Date.now()}@loopbill.com`,
        password: "StaffSecretPassword@123",
        fullName: "Unauthorized Staff",
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
