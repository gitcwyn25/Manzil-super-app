import { CatalogRetriever, VISIBLE_BUSINESS_WHERE } from "./gurman.retriever";

type FakePrisma = {
  business: {
    findMany: jest.Mock;
  };
};

function makePrisma(rows: unknown[]): FakePrisma {
  return { business: { findMany: jest.fn().mockResolvedValue(rows) } };
}

const row = {
  id: "biz-1",
  slug: "caravan-coffee",
  name: "Caravan Coffee",
  district: "Mirzo Ulugbek",
  priceTier: "$$",
  avgRating: { toString: () => "4.50" },
  reviewCount: 3,
  descriptionUz: "Sokin muhit",
  descriptionRu: null,
  descriptionEn: null,
  category: { nameUz: "Qahvaxona", nameRu: "Кофейня", nameEn: "Coffee" },
  reviews: [{ text: "Juda yaxshi" }]
};

describe("CatalogRetriever", () => {
  it("excludes suspended and merged businesses", () => {
    expect(VISIBLE_BUSINESS_WHERE).toEqual({
      status: { not: "suspended" },
      mergedIntoId: null
    });
  });

  it("maps a row without inventing missing translations", async () => {
    const prisma = makePrisma([row]);
    const retriever = new CatalogRetriever(prisma as never);

    const context = await retriever.retrieve("quiet cafe", "ru");

    expect(context.businesses).toHaveLength(1);
    expect(context.businesses[0].descriptions).toEqual({
      uz: "Sokin muhit",
      ru: null,
      en: null
    });
    expect(context.businesses[0].avgRating).toBe(4.5);
    // Retrieved in the asking locale: handing the model a category name in
    // another language invites it to translate, and a translated name no
    // longer matches anything the user can filter by on the site.
    expect(context.businesses[0].categoryName).toBe("Кофейня");
    expect(context.businesses[0].reviewSnippets).toEqual(["Juda yaxshi"]);
  });

  it("applies the visibility filter when retrieving", async () => {
    const prisma = makePrisma([]);
    const retriever = new CatalogRetriever(prisma as never);

    await retriever.retrieve("anything", "uz");

    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: VISIBLE_BUSINESS_WHERE })
    );
  });

  it("liveBusinesses returns an empty map for no ids without querying", async () => {
    const prisma = makePrisma([]);
    const retriever = new CatalogRetriever(prisma as never);

    const live = await retriever.liveBusinesses([]);

    expect(live.size).toBe(0);
    expect(prisma.business.findMany).not.toHaveBeenCalled();
  });

  it("liveBusinesses omits an id that is no longer visible", async () => {
    const prisma = makePrisma([{ id: "biz-1", slug: "caravan-coffee", name: "Caravan Coffee" }]);
    const retriever = new CatalogRetriever(prisma as never);

    const live = await retriever.liveBusinesses(["biz-1", "biz-suspended"]);

    expect(live.has("biz-1")).toBe(true);
    expect(live.has("biz-suspended")).toBe(false);
    expect(prisma.business.findMany).toHaveBeenCalledWith({
      where: { ...VISIBLE_BUSINESS_WHERE, id: { in: ["biz-1", "biz-suspended"] } },
      select: { id: true, slug: true, name: true }
    });
  });
});
