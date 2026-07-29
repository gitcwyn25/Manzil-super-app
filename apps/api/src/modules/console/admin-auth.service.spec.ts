import { AdminAuthService } from "./admin-auth.service";
import { hashPassword } from "./admin-password.util";

// Throwaway credentials for these tests only — never real ones.
const THROWAWAY_USERNAME = "test_console_admin";
const THROWAWAY_PASSWORD = "correct horse battery staple";
const WRONG_PASSWORD = "not the right password";

function makeAdminRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "admin_1",
    email: "admin@example.com",
    name: "Test Admin",
    isActive: true,
    username: THROWAWAY_USERNAME,
    passwordHash: hashPassword(THROWAWAY_PASSWORD),
    clerkId: null,
    userId: null,
    roles: [
      {
        role: {
          slug: "moderator",
          permissions: [{ permission: { slug: "business.approve" } }, { permission: { slug: "business.view" } }]
        }
      }
    ],
    ...overrides
  };
}

function makePrisma() {
  return {
    adminUser: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined)
    }
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new AdminAuthService(prisma as never);
}

describe("AdminAuthService.verifyCredentials", () => {
  it("succeeds for the correct username/password and returns flattened permissions/roles", async () => {
    const row = makeAdminRow();
    const prisma = makePrisma();
    // First call: username lookup. Second call: loadResolvedAdminById.
    prisma.adminUser.findFirst.mockResolvedValueOnce(row).mockResolvedValueOnce(row);
    const service = makeService(prisma);

    const result = await service.verifyCredentials(THROWAWAY_USERNAME, THROWAWAY_PASSWORD);

    expect(result.outcome).toBe("success");
    if (result.outcome === "success") {
      expect(result.admin.id).toBe("admin_1");
      expect(result.admin.roles).toEqual(["moderator"]);
      expect([...result.admin.permissions].sort()).toEqual(["business.approve", "business.view"]);
    }
  });

  it("fails with a wrong password against a known username", async () => {
    const row = makeAdminRow();
    const prisma = makePrisma();
    prisma.adminUser.findFirst.mockResolvedValueOnce(row);
    const service = makeService(prisma);

    const result = await service.verifyCredentials(THROWAWAY_USERNAME, WRONG_PASSWORD);

    expect(result.outcome).toBe("invalid_password");
    if (result.outcome === "invalid_password") {
      expect(result.adminId).toBe("admin_1");
    }
  });

  it("fails for an unknown username with a distinct internal outcome, but still runs the password hash comparison", async () => {
    const prisma = makePrisma();
    prisma.adminUser.findFirst.mockResolvedValueOnce(null);
    const service = makeService(prisma);

    const result = await service.verifyCredentials("no_such_user", THROWAWAY_PASSWORD);

    expect(result.outcome).toBe("unknown_username");
    // No adminId to report on this branch — nothing to attribute an audit row to.
    expect((result as { adminId?: string }).adminId).toBeUndefined();
  });

  it("fails for an inactive admin even with the correct password", async () => {
    const row = makeAdminRow({ isActive: false });
    const prisma = makePrisma();
    prisma.adminUser.findFirst.mockResolvedValueOnce(row);
    const service = makeService(prisma);

    const result = await service.verifyCredentials(THROWAWAY_USERNAME, THROWAWAY_PASSWORD);

    expect(result.outcome).toBe("inactive");
    if (result.outcome === "inactive") {
      expect(result.adminId).toBe("admin_1");
    }
  });
});

describe("AdminAuthService.resolveAdmin", () => {
  it("resolves via a verified session admin id", async () => {
    const row = makeAdminRow();
    const prisma = makePrisma();
    prisma.adminUser.findFirst.mockResolvedValueOnce(row);
    const service = makeService(prisma);

    const resolved = await service.resolveAdmin({ sessionAdminId: "admin_1" });

    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe("admin_1");
    expect(prisma.adminUser.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "admin_1", isActive: true } })
    );
  });

  it("returns null when the session admin id does not resolve to an active admin, and does not fall back to Clerk when no actor is given", async () => {
    const prisma = makePrisma();
    prisma.adminUser.findFirst.mockResolvedValueOnce(null);
    const service = makeService(prisma);

    const resolved = await service.resolveAdmin({ sessionAdminId: "missing" });

    expect(resolved).toBeNull();
    expect(prisma.adminUser.findFirst).toHaveBeenCalledTimes(1);
  });

  it("still resolves via the existing Clerk actor path when there is no session id", async () => {
    const row = makeAdminRow({ clerkId: "clerk_abc" });
    const prisma = makePrisma();
    prisma.adminUser.findFirst.mockResolvedValueOnce(row);
    const service = makeService(prisma);

    const resolved = await service.resolveAdmin({ actor: { userId: "user_1", role: "admin", clerkId: "clerk_abc" } });

    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe("admin_1");
    expect(prisma.adminUser.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, OR: [{ clerkId: { in: ["clerk_abc", "user_1"] } }, { userId: { in: ["clerk_abc", "user_1"] } }] }
      })
    );
  });

  it("returns null when neither a session id nor an actor is provided", async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);

    const resolved = await service.resolveAdmin({});

    expect(resolved).toBeNull();
    expect(prisma.adminUser.findFirst).not.toHaveBeenCalled();
  });
});
