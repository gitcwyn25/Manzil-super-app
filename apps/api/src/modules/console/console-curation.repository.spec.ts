import { NotFoundException } from "@nestjs/common";
import { ConsoleCurationRepository } from "./console-curation.repository";

function makePrisma() {
  const prisma = {
    business: { findUnique: jest.fn() },
    customer: { findMany: jest.fn() },
    review: { findMany: jest.fn() }
  };
  return prisma;
}

function makeRepo(prisma: ReturnType<typeof makePrisma>) {
  const cache = { invalidate: jest.fn().mockResolvedValue(undefined) };
  return new ConsoleCurationRepository(prisma as never, cache as never);
}

describe("ConsoleCurationRepository.getBusinessConsumers", () => {
  it("throws NotFoundException for an unknown business", async () => {
    const prisma = makePrisma();
    prisma.business.findUnique.mockResolvedValue(null);
    const repo = makeRepo(prisma);

    await expect(repo.getBusinessConsumers("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("dedupes a person who is both a customer and a reviewer into one row with both sources", async () => {
    const prisma = makePrisma();
    prisma.business.findUnique.mockResolvedValue({ id: "biz_1" });
    prisma.customer.findMany.mockResolvedValue([
      {
        id: "cust_1",
        userId: "user_1",
        phone: "+998901112233",
        name: "Booking Name",
        visitCount: 3,
        totalSpend: 150000,
        loyaltyPoints: 30,
        lastVisitAt: new Date("2026-07-01T00:00:00.000Z"),
        tags: ["regular"],
        user: { id: "user_1", displayName: "Dilnoza K.", email: "dilnoza@example.com", phone: "+998901112233" }
      }
    ]);
    prisma.review.findMany.mockResolvedValue([
      {
        id: "rev_1",
        userId: "user_1",
        rating: 5,
        createdAt: new Date("2026-07-10T00:00:00.000Z"),
        user: { id: "user_1", displayName: "Dilnoza K.", email: "dilnoza@example.com", phone: "+998901112233" }
      }
    ]);
    const repo = makeRepo(prisma);

    const result = await repo.getBusinessConsumers("biz_1");

    expect(result.consumers).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    const merged = result.consumers[0];
    expect(merged.userId).toBe("user_1");
    expect(new Set(merged.sources)).toEqual(new Set(["customer", "reviewer"]));
    expect(merged.customer).toMatchObject({ id: "cust_1", visitCount: 3 });
    expect(merged.reviews).toMatchObject({ count: 1, avgRating: 5 });
  });

  it("keeps a customer-only walk-in and a reviewer-only account as two separate rows", async () => {
    const prisma = makePrisma();
    prisma.business.findUnique.mockResolvedValue({ id: "biz_1" });
    prisma.customer.findMany.mockResolvedValue([
      {
        id: "cust_walkin",
        userId: null,
        phone: "+998907776655",
        name: "Walk In",
        visitCount: 1,
        totalSpend: 20000,
        loyaltyPoints: 0,
        lastVisitAt: new Date("2026-06-01T00:00:00.000Z"),
        tags: [],
        user: null
      }
    ]);
    prisma.review.findMany.mockResolvedValue([
      {
        id: "rev_2",
        userId: "user_2",
        rating: 4,
        createdAt: new Date("2026-06-15T00:00:00.000Z"),
        user: { id: "user_2", displayName: "Reviewer Only", email: "r2@example.com", phone: null }
      }
    ]);
    const repo = makeRepo(prisma);

    const result = await repo.getBusinessConsumers("biz_1");

    expect(result.totalCount).toBe(2);
    const bySource = result.consumers.map((c) => c.sources);
    expect(bySource).toContainEqual(["customer"]);
    expect(bySource).toContainEqual(["reviewer"]);
  });

  it("never merges two different walk-in customers who happen to share no account", async () => {
    const prisma = makePrisma();
    prisma.business.findUnique.mockResolvedValue({ id: "biz_1" });
    prisma.customer.findMany.mockResolvedValue([
      {
        id: "cust_a",
        userId: null,
        phone: "+998900000001",
        name: "A",
        visitCount: 1,
        totalSpend: 0,
        loyaltyPoints: 0,
        lastVisitAt: null,
        tags: [],
        user: null
      },
      {
        id: "cust_b",
        userId: null,
        phone: "+998900000002",
        name: "B",
        visitCount: 1,
        totalSpend: 0,
        loyaltyPoints: 0,
        lastVisitAt: null,
        tags: [],
        user: null
      }
    ]);
    prisma.review.findMany.mockResolvedValue([]);
    const repo = makeRepo(prisma);

    const result = await repo.getBusinessConsumers("biz_1");

    expect(result.totalCount).toBe(2);
  });
});
