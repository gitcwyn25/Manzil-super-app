import { InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { ConsoleAuthController } from "./console-auth.controller";
import { signAdminSession, ADMIN_SESSION_COOKIE_NAME } from "./admin-session.util";

// Throwaway credentials for these tests only — never real ones.
const THROWAWAY_USERNAME = "test_console_admin";
const THROWAWAY_PASSWORD = "correct horse battery staple";

// Fabricated placeholder, used only in-memory for this test run — not the
// real ADMIN_SESSION_SECRET.
const TEST_SECRET = "unit-test-only-session-secret-not-real";

const resolvedAdmin = {
  id: "admin_1",
  email: "admin@example.com",
  name: "Test Admin",
  permissions: new Set(["business.approve", "business.view"]),
  roles: ["moderator"]
};

function makePrisma() {
  return {
    adminUser: { update: jest.fn().mockResolvedValue(undefined) },
    auditLog: { create: jest.fn().mockResolvedValue(undefined) }
  };
}

function makeAdminAuth() {
  return {
    verifyCredentials: jest.fn(),
    resolveAdmin: jest.fn()
  };
}

function makeClerkAuth() {
  return { resolveActorFromRequest: jest.fn() };
}

function makeResponse() {
  return { cookie: jest.fn(), clearCookie: jest.fn() };
}

function makeController(
  prisma: ReturnType<typeof makePrisma>,
  adminAuth: ReturnType<typeof makeAdminAuth>,
  clerkAuth: ReturnType<typeof makeClerkAuth>
) {
  return new ConsoleAuthController(prisma as never, adminAuth as never, clerkAuth as never);
}

describe("ConsoleAuthController.login", () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.ADMIN_SESSION_SECRET;
    } else {
      process.env.ADMIN_SESSION_SECRET = originalSecret;
    }
  });

  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = TEST_SECRET;
  });

  it("succeeds for correct credentials: sets the cookie, updates lastLoginAt, records a success audit entry", async () => {
    const prisma = makePrisma();
    const adminAuth = makeAdminAuth();
    adminAuth.verifyCredentials.mockResolvedValue({ outcome: "success", admin: resolvedAdmin });
    const controller = makeController(prisma, adminAuth, makeClerkAuth());
    const response = makeResponse();

    const result = await controller.login(
      { username: THROWAWAY_USERNAME, password: THROWAWAY_PASSWORD },
      { headers: {}, socket: { remoteAddress: "127.0.0.1" } } as never,
      response as never,
      "127.0.0.1"
    );

    expect(result).toEqual({
      data: {
        id: "admin_1",
        name: "Test Admin",
        email: "admin@example.com",
        permissions: ["business.approve", "business.view"],
        roles: ["moderator"]
      }
    });
    expect(response.cookie).toHaveBeenCalledWith(
      ADMIN_SESSION_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax" })
    );
    expect(prisma.adminUser.update).toHaveBeenCalledWith({
      where: { id: "admin_1" },
      data: { lastLoginAt: expect.any(Date) }
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ actorId: "admin_1", action: "admin.login.success" }) })
    );
  });

  it("fails for a wrong password with the generic error, and audits the failure against the known admin id", async () => {
    const prisma = makePrisma();
    const adminAuth = makeAdminAuth();
    adminAuth.verifyCredentials.mockResolvedValue({ outcome: "invalid_password", adminId: "admin_1" });
    const controller = makeController(prisma, adminAuth, makeClerkAuth());

    await expect(
      controller.login(
        { username: THROWAWAY_USERNAME, password: "wrong" },
        { headers: {}, socket: {} } as never,
        makeResponse() as never,
        "127.0.0.1"
      )
    ).rejects.toMatchObject({ message: "Invalid username or password" });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ actorId: "admin_1", action: "admin.login.failed" }) })
    );
  });

  it("fails for an unknown username with the identical generic error shape as a wrong password", async () => {
    const prisma = makePrisma();
    const adminAuth = makeAdminAuth();
    adminAuth.verifyCredentials.mockResolvedValue({ outcome: "unknown_username" });
    const controller = makeController(prisma, adminAuth, makeClerkAuth());

    let unknownUserError: unknown;
    try {
      await controller.login(
        { username: "no_such_user", password: THROWAWAY_PASSWORD },
        { headers: {}, socket: {} } as never,
        makeResponse() as never,
        "127.0.0.1"
      );
    } catch (error) {
      unknownUserError = error;
    }

    expect(unknownUserError).toBeInstanceOf(UnauthorizedException);
    expect((unknownUserError as UnauthorizedException).message).toBe("Invalid username or password");
    // No AdminUser id exists for an unknown username, so nothing is written
    // to AuditLog (its actorId is a required FK) — this is the one case that
    // cannot produce a DB audit row.
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("fails for an inactive admin with the identical generic error shape", async () => {
    const prisma = makePrisma();
    const adminAuth = makeAdminAuth();
    adminAuth.verifyCredentials.mockResolvedValue({ outcome: "inactive", adminId: "admin_1" });
    const controller = makeController(prisma, adminAuth, makeClerkAuth());

    await expect(
      controller.login(
        { username: THROWAWAY_USERNAME, password: THROWAWAY_PASSWORD },
        { headers: {}, socket: {} } as never,
        makeResponse() as never,
        "127.0.0.1"
      )
    ).rejects.toMatchObject({ message: "Invalid username or password" });
  });

  it("fails closed with no ADMIN_SESSION_SECRET configured: no cookie set, no success audit written", async () => {
    delete process.env.ADMIN_SESSION_SECRET;
    const prisma = makePrisma();
    const adminAuth = makeAdminAuth();
    adminAuth.verifyCredentials.mockResolvedValue({ outcome: "success", admin: resolvedAdmin });
    const controller = makeController(prisma, adminAuth, makeClerkAuth());
    const response = makeResponse();

    await expect(
      controller.login(
        { username: THROWAWAY_USERNAME, password: THROWAWAY_PASSWORD },
        { headers: {}, socket: {} } as never,
        response as never,
        "127.0.0.1"
      )
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(response.cookie).not.toHaveBeenCalled();
    expect(prisma.adminUser.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("ConsoleAuthController.logout", () => {
  it("clears the session cookie", () => {
    const controller = makeController(makePrisma(), makeAdminAuth(), makeClerkAuth());
    const response = makeResponse();

    const result = controller.logout(response as never);

    expect(result).toEqual({ data: { ok: true } });
    expect(response.clearCookie).toHaveBeenCalledWith(ADMIN_SESSION_COOKIE_NAME, expect.objectContaining({ httpOnly: true }));
  });
});

describe("ConsoleAuthController.session", () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.ADMIN_SESSION_SECRET;
    } else {
      process.env.ADMIN_SESSION_SECRET = originalSecret;
    }
  });

  it("returns the current admin for a valid session cookie", async () => {
    process.env.ADMIN_SESSION_SECRET = TEST_SECRET;
    const { value } = signAdminSession("admin_1");
    const prisma = makePrisma();
    const adminAuth = makeAdminAuth();
    adminAuth.resolveAdmin.mockResolvedValue(resolvedAdmin);
    const clerkAuth = makeClerkAuth();
    const controller = makeController(prisma, adminAuth, clerkAuth);

    const result = await controller.session({
      headers: { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${value}` }
    } as never);

    expect(result.data.id).toBe("admin_1");
    expect(adminAuth.resolveAdmin).toHaveBeenCalledWith({ sessionAdminId: "admin_1", actor: undefined });
    // A valid session short-circuits the Clerk lookup entirely.
    expect(clerkAuth.resolveActorFromRequest).not.toHaveBeenCalled();
  });

  it("rejects a tampered cookie signature with 401, and falls back to (unsuccessful) Clerk resolution", async () => {
    process.env.ADMIN_SESSION_SECRET = TEST_SECRET;
    const { value } = signAdminSession("admin_1");
    const [payload] = value.split(".");
    const tampered = `${payload}.${"0".repeat(64)}`;

    const adminAuth = makeAdminAuth();
    adminAuth.resolveAdmin.mockResolvedValue(null);
    const clerkAuth = makeClerkAuth();
    clerkAuth.resolveActorFromRequest.mockResolvedValue(undefined);
    const controller = makeController(makePrisma(), adminAuth, clerkAuth);

    await expect(
      controller.session({ headers: { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${tampered}` } } as never)
    ).rejects.toBeInstanceOf(UnauthorizedException);
    // The tampered cookie didn't verify, so the fallback path (Clerk) was tried.
    expect(clerkAuth.resolveActorFromRequest).toHaveBeenCalled();
  });

  it("returns 401 with no cookie and no Clerk actor", async () => {
    const adminAuth = makeAdminAuth();
    adminAuth.resolveAdmin.mockResolvedValue(null);
    const clerkAuth = makeClerkAuth();
    clerkAuth.resolveActorFromRequest.mockResolvedValue(undefined);
    const controller = makeController(makePrisma(), adminAuth, clerkAuth);

    await expect(controller.session({ headers: {} } as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
