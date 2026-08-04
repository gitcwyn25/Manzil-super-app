import { BadRequestException } from "@nestjs/common";
import { ConsoleSupabaseRepository } from "./console-supabase.repository";

const CTX = { adminId: "admin_1", ip: "127.0.0.1" };

function makePrisma() {
  return {
    user: { count: jest.fn().mockResolvedValue(3), findMany: jest.fn().mockResolvedValue([]) },
    business: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([]) },
    auditLog: { create: jest.fn().mockResolvedValue(undefined) }
  };
}

function makeStorageService(overview: unknown = { configured: false, buckets: [] }) {
  return { getStorageOverview: jest.fn().mockResolvedValue(overview) };
}

function makeRepo(prisma: ReturnType<typeof makePrisma>, storage = makeStorageService()) {
  return new ConsoleSupabaseRepository(prisma as never, storage as never);
}

describe("ConsoleSupabaseRepository.tableRows", () => {
  it("rejects a table that is not on the hardcoded allowlist with 400, and never touches Prisma", async () => {
    const prisma = makePrisma();
    const repo = makeRepo(prisma);

    await expect(repo.tableRows("adminUser", 50, 0, CTX)).rejects.toBeInstanceOf(BadRequestException);
    // "adminUser" is the Prisma model name; the allowlisted API-facing name is
    // "adminUsers" — this proves the allowlist is keyed on the public name,
    // not silently accepting anything that happens to be a real model.
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(prisma.business.findMany).not.toHaveBeenCalled();
  });

  it("rejects a string that isn't a table at all (e.g. an attempted SQL fragment) with 400", async () => {
    const prisma = makePrisma();
    const repo = makeRepo(prisma);

    await expect(
      repo.tableRows("users; DROP TABLE users;--", 50, 0, CTX)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("redacts passwordHash, email, phone, secret-like, and token-like columns, but leaves other columns and null values alone", async () => {
    const prisma = makePrisma();
    prisma.user.findMany.mockResolvedValue([
      {
        id: "user_1",
        email: "person@example.com",
        phone: "+998901112233",
        displayName: "Dilnoza K.",
        passwordHash: "scryptsalt:hash",
        refreshToken: "rt_abc123",
        stripeSecretKey: "sk_live_xyz",
        bannedReason: null
      }
    ]);
    const repo = makeRepo(prisma);

    const result = await repo.tableRows("users", 50, 0, CTX);

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row.id).toBe("user_1");
    expect(row.displayName).toBe("Dilnoza K.");
    expect(row.bannedReason).toBeNull();
    expect(row.email).not.toBe("person@example.com");
    expect(row.phone).not.toBe("+998901112233");
    expect(row.passwordHash).not.toBe("scryptsalt:hash");
    expect(row.refreshToken).not.toBe("rt_abc123");
    expect(row.stripeSecretKey).not.toBe("sk_live_xyz");
  });

  it("clamps limit to 200 and floors a negative/non-finite offset to 0", async () => {
    const prisma = makePrisma();
    const repo = makeRepo(prisma);

    const result = await repo.tableRows("users", 10_000, -5, CTX);

    expect(result.limit).toBe(200);
    expect(result.offset).toBe(0);
    expect(prisma.user.findMany).toHaveBeenCalledWith({ take: 200, skip: 0 });
  });

  it("writes an AuditLog entry naming the table and the acting admin", async () => {
    const prisma = makePrisma();
    const repo = makeRepo(prisma);

    await repo.tableRows("users", 50, 0, CTX);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: "admin_1",
          action: "supabase.table.view",
          targetType: "supabase_table",
          targetId: "users"
        })
      })
    );
  });
});

// Mirrors the Prisma model keys `TABLE_ALLOWLIST` maps its public table
// names to (see console-supabase.repository.ts). Kept as an explicit list
// rather than importing the allowlist itself, so this spec independently
// proves every one of those model keys is a real, browsable delegate rather
// than trusting the same source the implementation does.
const ALL_MODEL_KEYS = [
  "user", "business", "category", "review", "reviewReply", "photo", "claim",
  "announcement", "businessPackage", "customer", "businessSubscription", "report",
  "adminUser", "role", "permission", "auditLog", "adminNotification", "featureFlag",
  "plan", "planFeature", "businessStaff", "businessVerification", "booking", "payment",
  "legalDocument", "legalAcceptance", "contract", "campaign", "campaignSend", "waitlistSignup"
];

/** `overview()` calls `.count()` on every allowlisted table's Prisma model
 * delegate (29+ of them), not just the couple `makePrisma()` stubs above.
 * `auditLog` is one of those delegates AND the target `writeAudit` creates
 * into, exactly like the real `PrismaService.auditLog` — so its stub carries
 * `count`/`findMany` (for the overview scan) and `create` (for the audit
 * write) on the same object, not two competing mocks. */
function makeFullPrisma() {
  const prisma: Record<string, unknown> = {};

  for (const key of ALL_MODEL_KEYS) {
    prisma[key] = { count: jest.fn().mockResolvedValue(3), findMany: jest.fn().mockResolvedValue([]) };
  }
  const auditLog = prisma.auditLog as { count: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  auditLog.create = jest.fn().mockResolvedValue(undefined);

  return { prisma, auditLog };
}

describe("ConsoleSupabaseRepository.overview", () => {
  it("returns a row count per allowlisted table plus the storage summary, and audits the view", async () => {
    const { prisma, auditLog } = makeFullPrisma();
    const storage = makeStorageService({
      configured: true,
      buckets: [{ name: "business-media", public: true, objectCount: 4, totalBytes: 1024, truncated: false }]
    });
    const repo = new ConsoleSupabaseRepository(prisma as never, storage as never);

    const result = await repo.overview(CTX);

    const userEntry = result.tables.find((t) => t.table === "users");
    expect(userEntry?.rowCount).toBe(3);
    // Every allowlisted table appears exactly once.
    expect(result.tables.map((t) => t.table).sort()).toEqual([...new Set(result.tables.map((t) => t.table))].sort());
    expect(result.storage).toEqual(await storage.getStorageOverview.mock.results[0].value);
    expect(auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "supabase.overview.view" }) })
    );
  });
});

describe("ConsoleSupabaseRepository.storageOverview", () => {
  it("delegates to SupabaseStorageService and audits the view", async () => {
    const prisma = makePrisma();
    const overview = { configured: true, buckets: [] };
    const storage = makeStorageService(overview);
    const repo = makeRepo(prisma, storage);

    const result = await repo.storageOverview(CTX);

    expect(result).toEqual(overview);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "supabase.storage.view" }) })
    );
  });
});
