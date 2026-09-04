import { ConflictException } from "@nestjs/common";
import { ActivationRepository } from "./activation.repository";

const ctx = { adminId: "admin_1", ip: "127.0.0.1" };
const previousActivationFlag = process.env.ACTIVATION_CONTRACT_ENABLED;

beforeAll(() => {
  process.env.ACTIVATION_CONTRACT_ENABLED = "true";
});

afterAll(() => {
  if (previousActivationFlag === undefined) delete process.env.ACTIVATION_CONTRACT_ENABLED;
  else process.env.ACTIVATION_CONTRACT_ENABLED = previousActivationFlag;
});

const activeSignature = {
  id: "signature_1",
  adminUserId: "admin_1",
  version: 3,
  displayName: "Operator One",
  title: "Merchant Success",
  status: "active" as const,
  createdAt: new Date("2026-09-04T08:00:00.000Z"),
  revokedAt: null
};

function makePrisma() {
  const prisma = {
    waitlistSignup: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    },
    adminUser: { findFirst: jest.fn() },
    business: { findUnique: jest.fn() },
    adminSignature: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn()
    },
    outboxMessage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    auditLog: { create: jest.fn() },
    operationalSignature: { create: jest.fn() },
    $transaction: jest.fn()
  };

  prisma.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => unknown)(prisma);
    }
    return Promise.all(arg as Promise<unknown>[]);
  });

  return prisma;
}

function makeRepo(prisma: ReturnType<typeof makePrisma>) {
  return new ActivationRepository(prisma as never);
}

const baseSignup = {
  id: "signup_1",
  topic: "gurman" as const,
  email: "person@example.com",
  locale: "en",
  city: null,
  businessName: null,
  source: "gurman_waitlist",
  status: "new" as const,
  assignedAdminId: null,
  reviewedByAdminId: null,
  decisionReason: null,
  contactedAt: null,
  reviewedAt: null,
  connectedBusinessId: null,
  connectedAt: null,
  connectedByAdminId: null,
  createdAt: new Date("2026-09-04T07:00:00.000Z"),
  updatedAt: new Date("2026-09-04T07:00:00.000Z")
};

describe("ActivationRepository rollout gate", () => {
  it("does not query activation tables when the contract is disabled", async () => {
    const previous = process.env.ACTIVATION_CONTRACT_ENABLED;
    delete process.env.ACTIVATION_CONTRACT_ENABLED;
    const prisma = makePrisma();
    const repo = makeRepo(prisma);

    try {
      await expect(repo.listWaitlist({})).rejects.toMatchObject({
        message: "Merchant activation is gated until its M1 database migration is applied"
      });
      expect(prisma.waitlistSignup.findMany).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.ACTIVATION_CONTRACT_ENABLED;
      else process.env.ACTIVATION_CONTRACT_ENABLED = previous;
    }
  });
});

describe("ActivationRepository.transitionWaitlist", () => {
  const previousSecret = process.env.ADMIN_OPERATION_SIGNATURE_SECRET;

  beforeEach(() => {
    process.env.ADMIN_OPERATION_SIGNATURE_SECRET = "unit-test-operation-key";
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.ADMIN_OPERATION_SIGNATURE_SECRET;
    else process.env.ADMIN_OPERATION_SIGNATURE_SECRET = previousSecret;
  });

  it("changes state only with a reasoned, signed audit event", async () => {
    const prisma = makePrisma();
    prisma.waitlistSignup.findUnique.mockResolvedValue({ ...baseSignup, status: "qualified" as const });
    prisma.waitlistSignup.update.mockResolvedValue({
      ...baseSignup,
      status: "accepted",
      reviewedByAdminId: "admin_1",
      reviewedAt: new Date("2026-09-04T08:10:00.000Z"),
      decisionReason: "Accepted for the first mobile cohort"
    });
    prisma.adminSignature.findFirst.mockResolvedValue(activeSignature);
    prisma.auditLog.create.mockResolvedValue({ id: "audit_1" });
    prisma.operationalSignature.create.mockResolvedValue({ id: "op_sig_1" });
    const repo = makeRepo(prisma);

    const result = await repo.transitionWaitlist(
      "signup_1",
      "accepted",
      "Accepted for the first mobile cohort",
      ctx
    );

    expect(prisma.waitlistSignup.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "signup_1" },
        data: expect.objectContaining({
          status: "accepted",
          reviewedByAdminId: "admin_1",
          decisionReason: "Accepted for the first mobile cohort"
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    expect(prisma.operationalSignature.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          auditLogId: "audit_1",
          adminSignatureId: "signature_1",
          action: "waitlist.accepted",
          algorithm: "hmac-sha256"
        })
      })
    );
    expect(result).toMatchObject({ status: "accepted", signatureVersion: 3, auditId: "audit_1" });
  });

  it("fails closed when the operator has no active signature", async () => {
    const prisma = makePrisma();
    prisma.waitlistSignup.findUnique.mockResolvedValue(baseSignup);
    prisma.adminSignature.findFirst.mockResolvedValue(null);
    const repo = makeRepo(prisma);

    await expect(repo.transitionWaitlist("signup_1", "contacted", undefined, ctx)).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(prisma.waitlistSignup.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects a transition from a stale admin screen", async () => {
    const prisma = makePrisma();
    prisma.waitlistSignup.findUnique.mockResolvedValue(baseSignup);
    const repo = makeRepo(prisma);

    await expect(
      repo.transitionWaitlist("signup_1", "contacted", undefined, ctx, "2026-09-04T08:00:00.000Z")
    ).rejects.toMatchObject({ message: expect.stringContaining("STALE_STATE") });
    expect(prisma.waitlistSignup.update).not.toHaveBeenCalled();
  });
});

describe("ActivationRepository.connectCompany", () => {
  const previousSecret = process.env.ADMIN_OPERATION_SIGNATURE_SECRET;

  beforeEach(() => {
    process.env.ADMIN_OPERATION_SIGNATURE_SECRET = "unit-test-operation-key";
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.ADMIN_OPERATION_SIGNATURE_SECRET;
    else process.env.ADMIN_OPERATION_SIGNATURE_SECRET = previousSecret;
  });

  it("creates a CRM link without mutating business ownership or public status", async () => {
    const prisma = makePrisma();
    prisma.waitlistSignup.findUnique.mockResolvedValue({ ...baseSignup, status: "qualified" });
    prisma.business.findUnique.mockResolvedValue({
      id: "business_1",
      slug: "example-place",
      name: "Example Place",
      status: "unclaimed",
      mergedIntoId: null
    });
    prisma.waitlistSignup.findFirst.mockResolvedValue(null);
    prisma.waitlistSignup.update.mockResolvedValue({
      ...baseSignup,
      status: "connected",
      connectedBusinessId: "business_1",
      connectedAt: new Date("2026-09-04T08:20:00.000Z"),
      connectedByAdminId: "admin_1",
      reviewedByAdminId: "admin_1",
      reviewedAt: new Date("2026-09-04T08:20:00.000Z"),
      decisionReason: "The request matches the existing business record"
    });
    prisma.adminSignature.findFirst.mockResolvedValue(activeSignature);
    prisma.auditLog.create.mockResolvedValue({ id: "audit_2" });
    prisma.operationalSignature.create.mockResolvedValue({ id: "op_sig_2" });
    const repo = makeRepo(prisma);

    const result = await repo.connectCompany(
      "signup_1",
      "business_1",
      "The request matches the existing business record",
      ctx
    );

    expect(prisma.business.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.business.findUnique.mock.calls[0][0]).toMatchObject({ where: { id: "business_1" } });
    expect(prisma.waitlistSignup.update).toHaveBeenCalledTimes(1);
    expect(prisma.business).not.toHaveProperty("update");
    expect(result).toMatchObject({
      status: "connected",
      connectedBusiness: { id: "business_1", status: "unclaimed" },
      ownershipChanged: false,
      publicVisibilityChanged: false,
      signatureVersion: 3
    });
  });
});

describe("ActivationRepository.queueEmailDraft", () => {
  const previousSecret = process.env.ADMIN_OPERATION_SIGNATURE_SECRET;

  beforeEach(() => {
    process.env.ADMIN_OPERATION_SIGNATURE_SECRET = "unit-test-operation-key";
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.ADMIN_OPERATION_SIGNATURE_SECRET;
    else process.env.ADMIN_OPERATION_SIGNATURE_SECRET = previousSecret;
  });

  it("queues once for the same generated draft and does not send it", async () => {
    const prisma = makePrisma();
    const acceptedSignup = { ...baseSignup, status: "accepted" as const };
    const queued = {
      id: "outbox_1",
      status: "pending" as const,
      channel: "email" as const,
      kind: "waitlist_onboarding",
      recipient: acceptedSignup.email,
      subject: "Gurman is getting ready — you’re on the list",
      body: "queued body\n\n— Operator One\nMerchant Success\nManzil Group\nOperational message · signature v3",
      payload: { signatureVersion: 3 },
      idempotencyKey: "waitlist-onboarding:signup_1:v1",
      attempts: 0,
      availableAt: new Date("2026-09-04T08:30:00.000Z"),
      lockedAt: null,
      sentAt: null,
      lastError: null,
      waitlistSignupId: "signup_1",
      createdByAdminId: "admin_1",
      createdAt: new Date("2026-09-04T08:30:00.000Z"),
      updatedAt: new Date("2026-09-04T08:30:00.000Z")
    };
    prisma.waitlistSignup.findUnique.mockResolvedValue(acceptedSignup);
    prisma.adminSignature.findFirst.mockResolvedValue(activeSignature);
    prisma.outboxMessage.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(queued);
    prisma.outboxMessage.create.mockResolvedValue(queued);
    prisma.auditLog.create.mockResolvedValue({ id: "audit_3" });
    prisma.operationalSignature.create.mockResolvedValue({ id: "op_sig_3" });
    const repo = makeRepo(prisma);

    const first = await repo.queueEmailDraft(
      "signup_1",
      { subject: "Gurman is getting ready — you’re on the list", body: "queued body" },
      ctx
    );
    const second = await repo.queueEmailDraft(
      "signup_1",
      { subject: "Gurman is getting ready — you’re on the list", body: "queued body" },
      ctx
    );

    expect(first).toMatchObject({ id: "outbox_1", status: "pending", alreadyQueued: false });
    expect(second).toMatchObject({ id: "outbox_1", status: "pending", alreadyQueued: true });
    expect(prisma.outboxMessage.create).toHaveBeenCalledTimes(1);
    expect(prisma.operationalSignature.create).toHaveBeenCalledTimes(1);
    expect(prisma.outboxMessage.update).not.toHaveBeenCalled();
  });

  it("rejects changed content for an existing idempotency key", async () => {
    const prisma = makePrisma();
    const acceptedSignup = { ...baseSignup, status: "accepted" as const };
    prisma.waitlistSignup.findUnique.mockResolvedValue(acceptedSignup);
    prisma.adminSignature.findFirst.mockResolvedValue(activeSignature);
    prisma.outboxMessage.findUnique.mockResolvedValue({
      id: "outbox_1",
      status: "pending" as const,
      subject: "Original subject",
      body: "Original body",
      idempotencyKey: "waitlist-onboarding:signup_1:v1",
      payload: { signatureVersion: 3 }
    });
    const repo = makeRepo(prisma);

    await expect(
      repo.queueEmailDraft("signup_1", { subject: "Changed subject", body: "Changed body" }, ctx)
    ).rejects.toMatchObject({ message: expect.stringContaining("IDEMPOTENCY_CONFLICT") });
    expect(prisma.outboxMessage.create).not.toHaveBeenCalled();
  });
});

describe("ActivationRepository contract safety", () => {
  it("does not use the session secret as an operational signing key", async () => {
    const previousOperationSecret = process.env.ADMIN_OPERATION_SIGNATURE_SECRET;
    const previousSessionSecret = process.env.ADMIN_SESSION_SECRET;
    delete process.env.ADMIN_OPERATION_SIGNATURE_SECRET;
    process.env.ADMIN_SESSION_SECRET = "session-only-secret";

    const prisma = makePrisma();
    prisma.waitlistSignup.findUnique.mockResolvedValue(baseSignup);
    prisma.adminSignature.findFirst.mockResolvedValue(activeSignature);
    const repo = makeRepo(prisma);

    try {
      await expect(repo.transitionWaitlist("signup_1", "contacted", undefined, ctx)).rejects.toMatchObject({
        message: expect.stringContaining("SIGNATURE_KEY_MISSING")
      });
      expect(prisma.waitlistSignup.update).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    } finally {
      if (previousOperationSecret === undefined) delete process.env.ADMIN_OPERATION_SIGNATURE_SECRET;
      else process.env.ADMIN_OPERATION_SIGNATURE_SECRET = previousOperationSecret;
      if (previousSessionSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
      else process.env.ADMIN_SESSION_SECRET = previousSessionSecret;
    }
  });

  it("rejects direct API transitions that are outside the server-owned matrix", async () => {
    const prisma = makePrisma();
    prisma.waitlistSignup.findUnique.mockResolvedValue({ ...baseSignup, status: "accepted" as const });
    const repo = makeRepo(prisma);

    await expect(repo.transitionWaitlist("signup_1", "qualified", undefined, ctx)).rejects.toMatchObject({
      message: "Cannot move a accepted waitlist entry to qualified"
    });
    expect(prisma.waitlistSignup.update).not.toHaveBeenCalled();
  });

  it("rejects stale assignment and company-link submissions", async () => {
    const prisma = makePrisma();
    prisma.waitlistSignup.findUnique.mockResolvedValue({ ...baseSignup, status: "qualified" as const });
    const repo = makeRepo(prisma);

    await expect(
      repo.assignWaitlist("signup_1", "admin_2", ctx, "2026-09-04T08:00:00.000Z")
    ).rejects.toMatchObject({ message: expect.stringContaining("STALE_STATE") });
    await expect(
      repo.connectCompany("signup_1", "business_1", "The request matches the existing business record", ctx, "2026-09-04T08:00:00.000Z")
    ).rejects.toMatchObject({ message: expect.stringContaining("STALE_STATE") });
    expect(prisma.waitlistSignup.update).not.toHaveBeenCalled();
  });
});
