import { GurmanV0ResponseComposer } from "./gurman-v0.response-composer";
import { GurmanV0ScoringService } from "./gurman-v0.scoring.service";

describe("Gurman V0 end-to-end planning flow", () => {
  it("turns a structured real-catalog intent into a composed user response", async () => {
    const prisma = {
      business: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "b1",
            slug: "quiet-restaurant",
            name: "Quiet Restaurant",
            lat: null,
            lng: null,
            priceTier: "$$",
            avgRating: 4.7,
            reviewCount: 24,
            category: { slug: "restaurant", nameUz: "Restoran", nameRu: "Ресторан", nameEn: "Restaurant" }
          }
        ])
      }
    };
    const provider = { complete: jest.fn().mockResolvedValue("Quiet Restaurant mos keladi.") };
    const decision = await new GurmanV0ScoringService(prisma as never).score({
      category: "restaurant",
      budget: 2,
      occasion: "dinner",
      groupSize: 2,
      limit: 3
    });
    const result = await new GurmanV0ResponseComposer(provider).compose(decision, "uz");

    expect(decision.selectedPlan?.name).toBe("Quiet Restaurant");
    expect(decision.selectedPlan?.reasonCodes.length).toBeGreaterThan(0);
    expect(result.available).toBe(true);
    expect(result.response).toContain("Quiet Restaurant");
    expect(provider.complete).toHaveBeenCalledWith(
      expect.stringContaining("Do not rank, select, score"),
      expect.stringContaining("Quiet Restaurant")
    );
  });
});
