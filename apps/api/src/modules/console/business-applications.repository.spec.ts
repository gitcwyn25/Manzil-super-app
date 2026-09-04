import { BusinessApplicationsRepository } from "./business-applications.repository";

const ctx = { adminId: "admin_1", ip: "127.0.0.1" };

const applicant = {
  id: "user_1",
  email: "owner@example.com",
  displayName: "Business Owner",
  phone: "+998901234567"
};

const baseApplication = {
  id: "application_1",
  applicantUserId: "user_1",
  businessId: null as string | null,
  status: "submitted" as string,
  name: "Rayhon Cafe",
  categorySlug: "cafe",
  descriptionUz: "A welcoming neighborhood cafe with fresh meals.",
  address: "12 Amir Temur street",
  district: "Yunusobod",
  city: "Tashkent",
  phone: "+998901234567",
  email: "owner@example.com",
  website: null,
  telegram: "@rayhon",
  workingHours: "Mon-Sun: 09:00 - 23:00",
  acceptedTermsVersion: "2026-08",
  acceptedTermsAt: new Date("2026-09-04T07:00:00.000Z"),
  acceptedTermsIp: "127.0.0.1",
  acceptedTermsUserAgent: "test-agent",
  submittedAt: new Date("2026-09-04T07:00:00.000Z"),
  reviewedByUserId: null,
  reviewNote: null,
  createdAt: new Date("2026-09-04T07:00:00.000Z"),
  updatedAt: new Date("2026-09-04T07:00:00.000Z")
};

function withRelations(application = baseApplication) {
  return {
    ...application,
    applicant,
    business: application.businessId ? { id: application.businessId, slug: "rayhon-cafe", name: application.name, status: "claimed" } : null,
    reviewer: null
  };
}

function makePrisma() {
  const prisma = {
    businessApplication: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    legalDocument: { findFirst: jest.fn() },
    category: { findUnique: jest.fn() },
    business: { findUnique: jest.fn(), create: jest.fn() },
    user: { update: jest.fn() },
    claim: { create: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn()
  };

  prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma));
  return prisma;
}

describe("BusinessApplicationsRepository", () => {
  it("lists applications with lifecycle counts and applicant context", async () => {
    const prisma = makePrisma();
    prisma.businessApplication.findMany.mockResolvedValue([withRelations()]);
    prisma.businessApplication.count.mockResolvedValue(1);
    prisma.businessApplication.groupBy.mockResolvedValue([
      { status: "submitted", _count: { _all: 1 } }
    ]);
    const repo = new BusinessApplicationsRepository(
      prisma as never,
      { invalidate: jest.fn().mockResolvedValue(undefined) } as never,
      { getCurrent: jest.fn() } as never
    );

    const result = await repo.listApplications({ status: "submitted", q: "owner" });

    expect(prisma.businessApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "submitted" }) })
    );
    expect(result).toMatchObject({ total: 1, counts: { submitted: 1 } });
    expect(result.applications[0]).toMatchObject({ id: "application_1", applicant });
  });

  it("requires a reason for requesting changes or rejecting an application", async () => {
    const prisma = makePrisma();
    const repo = new BusinessApplicationsRepository(
      prisma as never,
      { invalidate: jest.fn().mockResolvedValue(undefined) } as never,
      { getCurrent: jest.fn() } as never
    );

    await expect(repo.transitionApplication("application_1", "changes_requested", "short", ctx)).rejects.toThrow(
      "at least 10 characters"
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("audits a review transition", async () => {
    const prisma = makePrisma();
    prisma.businessApplication.findUnique.mockResolvedValue(baseApplication);
    prisma.businessApplication.update.mockResolvedValue(withRelations({ ...baseApplication, status: "under_review", updatedAt: new Date("2026-09-04T08:00:00.000Z") }));
    prisma.auditLog.create.mockResolvedValue({ id: "audit_1" });
    const repo = new BusinessApplicationsRepository(
      prisma as never,
      { invalidate: jest.fn().mockResolvedValue(undefined) } as never,
      { getCurrent: jest.fn() } as never
    );

    const result = await repo.transitionApplication("application_1", "under_review", undefined, ctx);

    expect(prisma.businessApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "under_review", businessId: null }) })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "business_application.under_review", targetId: "application_1" }) })
    );
    expect(result).toMatchObject({ id: "application_1", status: "under_review" });
  });

  it("creates the connected business, claim, legal records, and audit row exactly once on approval", async () => {
    const prisma = makePrisma();
    const legal = {
      getCurrent: jest.fn().mockImplementation(async (kind: string) =>
        kind === "privacy_policy"
          ? { id: "privacy_1", kind, version: "2026-08", body: "privacy" }
          : { id: "template_1", kind, version: "2026-08", body: "contract" }
      ),
      recordAcceptance: jest.fn().mockResolvedValue({ contractNo: "MZ-2026-TEST", acceptedVersions: [] })
    };
    prisma.businessApplication.findUnique
      .mockResolvedValueOnce({ acceptedTermsVersion: "2026-08" })
      .mockResolvedValueOnce(baseApplication);
    prisma.legalDocument.findFirst.mockResolvedValue({ id: "terms_1", kind: "terms_of_service", version: "2026-08", body: "terms" });
    prisma.category.findUnique.mockResolvedValue({ id: "category_1", slug: "cafe" });
    prisma.business.findUnique.mockResolvedValue(null);
    prisma.business.create.mockResolvedValue({
      id: "business_1",
      slug: "rayhon-cafe",
      name: "Rayhon Cafe",
      status: "claimed",
      legalName: null,
      taxId: null
    });
    prisma.user.update.mockResolvedValue({});
    prisma.claim.create.mockResolvedValue({});
    prisma.businessApplication.update.mockResolvedValue(
      withRelations({ ...baseApplication, status: "approved", businessId: "business_1", updatedAt: new Date("2026-09-04T08:00:00.000Z") })
    );
    prisma.auditLog.create.mockResolvedValue({ id: "audit_1" });
    const cache = { invalidate: jest.fn().mockResolvedValue(undefined) };
    const repo = new BusinessApplicationsRepository(prisma as never, cache as never, legal as never);

    const result = await repo.transitionApplication("application_1", "approved", "Approved after review", ctx);

    expect(prisma.business.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "claimed", claimedByUserId: "user_1" }) })
    );
    expect(prisma.claim.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ businessId: "business_1", status: "approved" }) })
    );
    expect(legal.recordAcceptance).toHaveBeenCalledTimes(1);
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    expect(cache.invalidate).toHaveBeenCalledWith("businesses", "admin", "home");
    expect(result).toMatchObject({ status: "approved", businessId: "business_1", businessSlug: "rayhon-cafe" });
  });

  it("does not reopen an already approved application", async () => {
    const prisma = makePrisma();
    prisma.businessApplication.findUnique.mockResolvedValue({ ...baseApplication, status: "approved", businessId: "business_1" });
    const repo = new BusinessApplicationsRepository(
      prisma as never,
      { invalidate: jest.fn().mockResolvedValue(undefined) } as never,
      { getCurrent: jest.fn() } as never
    );

    await expect(repo.transitionApplication("application_1", "approved", undefined, ctx)).resolves.toMatchObject({
      alreadyApplied: true,
      businessId: "business_1"
    });
    expect(prisma.business.create).not.toHaveBeenCalled();
  });
});
