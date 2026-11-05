import { CrmRepository } from "./crm.repository";
import type { AuthActor } from "../repositories/database.repository";

const actor: AuthActor = { userId: "user_1", role: "business_owner" } as AuthActor;

const validInput = {
  name: "Caravan Coffee",
  categorySlug: "cafe",
  descriptionUz: "Sokin muhitli qahvaxona",
  address: "Amir Temur 12",
  district: "Chilonzor"
};

/**
 * Only the collaborators `registerBusiness` reaches before it decides whether
 * this is a duplicate. If the guard works, geocoding and the transaction are
 * never touched — which is what these tests assert.
 */
function makeRepo(existingBusiness: unknown | null) {
  const prisma = {
    business: {
      findFirst: jest.fn().mockResolvedValue(existingBusiness),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn()
    },
    category: {
      findUnique: jest.fn().mockResolvedValue({ id: "cat_1", slug: "cafe" })
    },
    user: { upsert: jest.fn().mockResolvedValue({ id: "user_1" }) },
    claim: { create: jest.fn().mockResolvedValue({ id: "claim_1", status: "pending" }) },
    $transaction: jest.fn()
  };
  prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma));
  prisma.business.create.mockImplementation(async ({ data }: { data: object }) => ({ id: "new_biz", ...data }));

  const geocoding = { geocode: jest.fn().mockResolvedValue({ lat: 41.3, lng: 69.2 }) };
  const cache = { invalidate: jest.fn().mockResolvedValue(undefined) };
  const alerts = { dispatch: jest.fn() };
  const legal = {
    resolveCurrentDocuments: jest.fn().mockResolvedValue(null),
    recordAcceptance: jest.fn()
  };

  const repo = new CrmRepository(
    prisma as never,
    cache as never,
    geocoding as never,
    alerts as never,
    legal as never
  );

  return { repo, prisma, geocoding, alerts };
}

describe("CrmRepository.registerBusiness — duplicate guard", () => {
  it("queues a new submission without assigning verified ownership or a public claimed badge", async () => {
    const { repo, prisma, alerts } = makeRepo(null);
    const result = await repo.registerBusiness(validInput, { userId: "user_1", role: "consumer" }, undefined, { approvalRequired: true });
    expect(result.status).toBe("pending_claim");
    const listing = prisma.business.create.mock.calls[0][0].data;
    expect(listing).toMatchObject({ status: "pending_claim", createdByUserId: "user_1", priceTier: null });
    expect(listing).not.toHaveProperty("claimedByUserId");
    expect(listing).not.toHaveProperty("claimedAt");
    expect(prisma.claim.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: "user_1", businessId: "new_biz", status: "pending", verificationMethod: "registration" }) });
    expect(alerts.dispatch).toHaveBeenCalledWith(expect.objectContaining({ kind: "business_awaiting_approval", businessId: "new_biz" }));
  });

  it("does not elevate a Reviews consumer while preserving an existing admin role", async () => {
    const consumer = makeRepo(null);
    await consumer.repo.registerBusiness(validInput, { userId: "user_1", role: "consumer" }, undefined, { approvalRequired: true });
    expect(consumer.prisma.user.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {}, create: expect.objectContaining({ role: "consumer" }) }));
    const admin = makeRepo(null);
    await admin.repo.registerBusiness(validInput, { userId: "user_1", role: "admin" }, undefined, { approvalRequired: true });
    expect(admin.prisma.user.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {} }));
    expect(admin.prisma.business.create.mock.calls[0][0].data).toMatchObject({ status: "pending_claim" });
  });

  it("preserves immediate self-registration for the existing CRM flow", async () => {
    const { repo, prisma } = makeRepo(null);
    const result = await repo.registerBusiness(validInput, { userId: "user_1", role: "consumer" });
    expect(result.status).toBe("claimed");
    expect(prisma.business.create.mock.calls[0][0].data).toMatchObject({ claimedByUserId: "user_1", claimedAt: expect.any(Date) });
    expect(prisma.claim.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: "approved" }) });
    expect(prisma.user.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { role: "business_owner" } }));
  });

  it("returns the existing business instead of creating a second one", async () => {
    const { repo, prisma, geocoding } = makeRepo({
      id: "biz_1",
      slug: "caravan-coffee",
      name: "Caravan Coffee",
      status: "pending_claim",
      lat: 41.3,
      lng: 69.2
    });

    const result = await repo.registerBusiness(validInput as never, actor);

    expect(result).toEqual({
      id: "biz_1",
      slug: "caravan-coffee",
      name: "Caravan Coffee",
      status: "pending_claim",
      geocoded: true,
      lat: 41.3,
      lng: 69.2
    });

    // The whole point: the second submit must not repeat the slow or
    // side-effecting work. A duplicate registration previously created a
    // second business, a second claim and a second contract.
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(geocoding.geocode).not.toHaveBeenCalled();
  });

  it("matches an existing name case-insensitively", async () => {
    const { repo, prisma } = makeRepo(null);

    await repo
      .registerBusiness({ ...validInput, name: "caravan coffee" } as never, actor)
      .catch(() => undefined);

    expect(prisma.business.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdByUserId: "user_1",
          name: { equals: "caravan coffee", mode: "insensitive" }
        })
      })
    );
  });

  it("scopes the guard to the registering owner, not the whole platform", async () => {
    const { repo, prisma } = makeRepo(null);

    await repo.registerBusiness(validInput as never, actor).catch(() => undefined);

    // Two unrelated owners may legitimately register businesses with the same
    // name; only the same owner submitting twice is a duplicate.
    const where = prisma.business.findFirst.mock.calls[0][0].where;
    expect(where.createdByUserId).toBe("user_1");
  });

  it("reports geocoded:false when the stored business has no coordinates", async () => {
    const { repo } = makeRepo({
      id: "biz_2",
      slug: "no-geo",
      name: "Caravan Coffee",
      status: "pending_claim",
      lat: null,
      lng: null
    });

    const result = await repo.registerBusiness(validInput as never, actor);

    expect(result.geocoded).toBe(false);
    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
  });

  it("still rejects invalid input before reaching the duplicate check", async () => {
    const { repo, prisma } = makeRepo(null);

    await expect(
      repo.registerBusiness({ ...validInput, name: "x" } as never, actor)
    ).rejects.toThrow();

    expect(prisma.business.findFirst).not.toHaveBeenCalled();
  });
});
