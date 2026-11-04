import { DatabaseRepository } from "./database.repository";

const identity = { subject: "ed06986c-3e08-4cc1-86ac-e05e6a56ad94", email: "member@example.org", displayName: "Member" };
const actor = { userId: "member", role: "consumer" as const };
const business = { id: "b1", slug: "cafe", name: "Cafe", descriptionUz: "Cafe", address: "Tashkent", district: "Center", category: { slug: "cafes", nameUz: "Kafe" }, avgRating: 5, reviewCount: 99, status: "claimed" };
function setup() {
  const prisma = { user: { findUnique: jest.fn(), create: jest.fn() }, business: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    review: { findMany: jest.fn(), groupBy: jest.fn(), upsert: jest.fn(), aggregate: jest.fn() },
    savedPlace: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() } };
  const cache = { invalidate: jest.fn() };
  return { prisma, repo: new DatabaseRepository(prisma as never, cache as never) };
}

describe("Reviews identity and data boundaries", () => {
  it("does not link a matching seeded/admin email to a new Supabase subject", async () => {
    const { prisma, repo } = setup();
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "admin", role: "admin" });
    await expect(repo.syncSupabaseUser(identity)).rejects.toMatchObject({ status: 409 });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
  it("creates only a consumer under the verified provider namespace", async () => {
    const { prisma, repo } = setup();
    prisma.user.findUnique.mockResolvedValue(null); prisma.user.create.mockResolvedValue({ id: "member", role: "consumer" });
    await repo.syncSupabaseUser(identity);
    expect(prisma.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({ role: "consumer", clerkId: `supabase:${identity.subject}` }) });
  });
  it("rejects a suspended persisted subject", async () => {
    const { prisma, repo } = setup(); prisma.user.findUnique.mockResolvedValue({ id: "member", status: "suspended" });
    await expect(repo.syncSupabaseUser(identity)).rejects.toMatchObject({ status: 403 });
  });
  it("resolves a concurrent create only through the same verified subject", async () => {
    const { prisma, repo } = setup();
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "raced", status: "active", role: "consumer" });
    prisma.user.create.mockRejectedValue({ code: "P2002" });
    await expect(repo.syncSupabaseUser(identity)).resolves.toMatchObject({ id: "raced" });
  });
  it("returns no seeded rating when no genuine approved review exists", async () => {
    const { prisma, repo } = setup(); prisma.business.findFirst.mockResolvedValue(business);
    prisma.review.groupBy.mockResolvedValue([]); prisma.review.findMany.mockResolvedValue([]);
    const result = await repo.getReviewsDirectoryBusiness("cafe");
    expect(result.business).toMatchObject({ avgRating: 0, reviewCount: 0 });
    expect(prisma.review.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ moderationStatus: "approved", user: expect.any(Object) }) }));
    expect(prisma.business.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: { in: ["unclaimed", "claimed"] }, mergedIntoId: null }) }));
  });
  it.each([null, "premium", "not recorded"])("leaves an unsupported price (%s) and unsupplied weekend hours unknown", async priceTier => {
    const { prisma, repo } = setup();
    prisma.business.findFirst.mockResolvedValue({ ...business, priceTier, hoursJson: { weekdays: "09:00-18:00", internal_note: "not a schedule", nested: {} } });
    prisma.review.groupBy.mockResolvedValue([]); prisma.review.findMany.mockResolvedValue([]);
    const result = await repo.getReviewsDirectoryBusiness("cafe");
    expect(result.business.priceTier).toBeUndefined();
    expect(result.business.hoursSchedule).toEqual({ weekdays: "09:00-18:00" });
  });
  it("keeps each saved-list mutation scoped to its authenticated owner", async () => {
    const { prisma, repo } = setup(); prisma.savedPlace.deleteMany.mockResolvedValue({ count: 1 });
    await repo.removeSavedPlace("b1", "favorites", actor);
    expect(prisma.savedPlace.deleteMany).toHaveBeenCalledWith({ where: { userId: "member", businessId: "b1", listType: "favorites" } });
    await expect(repo.removeSavedPlace("b1", "admin", actor)).rejects.toMatchObject({ status: 400 });
  });
  it("requeues an edited review instead of restoring its public approval", async () => {
    const { prisma, repo } = setup(); prisma.business.findFirst.mockResolvedValue(business);
    prisma.review.upsert.mockImplementation(async ({ update }) => ({ id: "r1", ...update, user: { displayName: "Member", role: "consumer", locale: "en" }, createdAt: new Date() }));
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } });
    const review = await repo.createReview({ businessSlug: "cafe", rating: 4, text: "Helpful update" }, actor);
    expect(review.moderationStatus).toBe("pending");
    expect(prisma.review.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ moderationStatus: "pending" }), create: expect.objectContaining({ moderationStatus: "pending" }) }));
  });
});
