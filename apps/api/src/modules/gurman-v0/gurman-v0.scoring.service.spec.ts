import { GurmanV0ScoringService } from "./gurman-v0.scoring.service";

describe("GurmanV0ScoringService", () => {
  it("ranks real catalog rows and explains the selected result", async () => {
    const prisma = {
      business: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "b1",
            slug: "quiet-place",
            name: "Quiet Place",
            lat: null,
            lng: null,
            priceTier: "$$",
            avgRating: 4.8,
            reviewCount: 12,
            category: { slug: "restaurant", nameUz: "Restoran", nameRu: "Ресторан", nameEn: "Restaurant" }
          },
          {
            id: "b2",
            slug: "other",
            name: "Other",
            lat: null,
            lng: null,
            priceTier: "$$$",
            avgRating: 4.2,
            reviewCount: 3,
            category: { slug: "restaurant", nameUz: "Restoran", nameRu: "Ресторан", nameEn: "Restaurant" }
          }
        ])
      }
    };
    const decision = await new GurmanV0ScoringService(prisma as never).score({ category: "restaurant", budget: 2 });
    expect(decision.selectedPlan?.businessId).toBe("b1");
    expect(decision.selectedPlan?.explanation.factors.length).toBeGreaterThan(0);
    expect(decision.explanation.whyRejected[0]?.reasonCodes[0].code).toBe("over_budget");
  });

  it("returns typed insufficientData without inventing a result", async () => {
    const prisma = { business: { findMany: jest.fn().mockResolvedValue([]) } };
    const decision = await new GurmanV0ScoringService(prisma as never).score({ category: "restaurant" });
    expect(decision.status).toBe("insufficientData");
    expect(decision.selectedPlan).toBeNull();
    expect(decision.candidatePlans).toEqual([]);
  });
});
