import {
  bookedEdges,
  businessCapabilities,
  businessOutgoingEdges,
  categoryParentEdge,
  customerIdentityKey,
  describesEdge,
  mapBookingStatus,
  mapPriceTier,
  matchServiceId,
  parseOpeningHours,
  promotesEdge,
  toBookingEntity,
  toBusinessEntity,
  toNeighborhoodEntity,
  toServiceEntity,
  visitedEdges,
  type BookingProjectionRow,
  type BusinessPackageRow,
  type BusinessProjectionRow
} from "./knowledge-graph.projection";
import { graphId, neighborhoodGraphId, parseGraphId, parseNeighborhoodGraphId } from "./knowledge-graph.ids";
import { PROJECTION_CONFIDENCE } from "./knowledge-graph.relationships";

const UPDATED_AT = new Date("2026-08-01T10:00:00.000Z");

const business: BusinessProjectionRow = {
  id: "biz_1",
  slug: "caravan-coffee",
  name: "Caravan Coffee",
  categoryId: "cat_1",
  city: "Tashkent",
  district: "Yunusobod tumani",
  address: "12 Amir Temur",
  lat: { toString: () => "41.311081" },
  lng: { toString: () => "69.240562" },
  phone: "+998901234567",
  website: null,
  telegram: "@caravan",
  hoursJson: { weekdays: "09:00-18:00", saturday: "10:00-16:00" },
  priceTier: "$$",
  verificationStatus: "verified",
  updatedAt: UPDATED_AT
};

const haircut: BusinessPackageRow = {
  id: "pkg_1",
  businessId: "biz_1",
  name: "Haircut",
  description: null,
  price: { toString: () => "150000.00" },
  currency: "UZS",
  isActive: true,
  updatedAt: UPDATED_AT
};

const retiredPackage: BusinessPackageRow = { ...haircut, id: "pkg_2", name: "Old Package", isActive: false };

describe("graph ids", () => {
  it("round-trips a neighborhood id through its city and district", () => {
    const id = neighborhoodGraphId("Tashkent", "Yunusobod tumani");

    expect(id).toBe("neighborhood:Tashkent:Yunusobod%20tumani");
    expect(parseNeighborhoodGraphId(id)).toEqual({ city: "Tashkent", district: "Yunusobod tumani" });
  });

  it("rejects strings that are not graph ids", () => {
    expect(parseGraphId("clx0000")).toBeNull();
    expect(parseGraphId("business:")).toBeNull();
    expect(parseGraphId("planet:mars")).toBeNull();
  });
});

describe("business projection", () => {
  it("projects the node with graph-scoped ids and full confidence", () => {
    const node = toBusinessEntity({ ...business, packages: [haircut] }, []);

    expect(node.id).toBe("business:biz_1");
    expect(node.type).toBe("business");
    expect(node.metadata.categoryId).toBe("category:cat_1");
    expect(node.metadata.neighborhoodId).toBe("neighborhood:Tashkent:Yunusobod%20tumani");
    expect(node.metadata.priceTier).toBe("$$");
    expect(node.metadata.verified).toBe(true);
    expect(node.confidence).toBe(PROJECTION_CONFIDENCE);
    expect(node.updatedAt).toBe("2026-08-01T10:00:00.000Z");
  });

  it("emits belongs_to, located_in and one provides edge per ACTIVE package", () => {
    const edges = businessOutgoingEdges({ ...business, packages: [haircut, retiredPackage] });

    expect(edges.map((edge) => edge.kind)).toEqual(["belongs_to", "located_in", "provides"]);
    expect(edges[0]).toMatchObject({
      fromId: "business:biz_1",
      toId: "category:cat_1",
      source: "merchant_input",
      confidence: 1
    });
    expect(edges[2]).toMatchObject({ toId: "service:pkg_1" });
    // A withdrawn package must not tell the reasoning layer the provider can
    // still do something it stopped offering.
    expect(edges.some((edge) => edge.toId === "service:pkg_2")).toBe(false);
  });

  it("derives only capabilities the record proves, never guesses", () => {
    const capabilities = businessCapabilities({ ...business, website: null });
    const byKey = new Map(capabilities.map((capability) => [capability.key, capability.fact.value]));

    expect(byKey.get("phone_contact")).toBe(true);
    expect(byKey.get("telegram_contact")).toBe(true);
    expect(byKey.get("web_presence")).toBe(false);
    expect(byKey.get("verified_business")).toBe(true);
    expect(byKey.get("geo_located")).toBe(true);
    // Nothing about capacity, parking or private rooms is invented.
    expect(byKey.has("capacity")).toBe(false);
    expect(byKey.has("parking")).toBe(false);
  });
});

describe("opening hours", () => {
  it("expands collective keys and keeps ISO day order", () => {
    const windows = parseOpeningHours({ saturday: "10:00-16:00", weekdays: "09:00-18:00" });

    expect(windows.map((window) => window.day)).toEqual([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ]);
    expect(windows[5]).toEqual({ day: "saturday", startLocalTime: "10:00", endLocalTime: "16:00" });
  });

  it("lets an explicit day win over a collective key", () => {
    const windows = parseOpeningHours({ weekdays: "09:00-18:00", monday: "11:00-15:00" });
    const monday = windows.find((window) => window.day === "monday");

    expect(monday).toEqual({ day: "monday", startLocalTime: "11:00", endLocalTime: "15:00" });
  });

  it("invents nothing from unparseable free text", () => {
    expect(parseOpeningHours({ weekdays: "Mon-Sun 9 till late" })).toEqual([]);
    expect(parseOpeningHours("09:00-18:00")).toEqual([]);
    expect(parseOpeningHours(null)).toEqual([]);
  });
});

describe("value mappings", () => {
  it("maps both symbol and word price tiers, and refuses to guess", () => {
    expect(mapPriceTier("$$")).toBe("$$");
    expect(mapPriceTier("premium")).toBe("$$$");
    expect(mapPriceTier("luxury")).toBe("$$$$");
    expect(mapPriceTier("mystery")).toBeNull();
    expect(mapPriceTier(null)).toBeNull();
  });

  it("resolves the canceled/cancelled spelling split once, in the mapper", () => {
    expect(mapBookingStatus("canceled")).toBe("cancelled");
    expect(mapBookingStatus("no_show")).toBe("no_show");
    expect(mapBookingStatus("something_new")).toBe("pending");
  });

  it("prices a package as a degenerate band in minor units", () => {
    const node = toServiceEntity(haircut, "cat_1", []);

    expect(node.metadata.typicalPrice).toEqual({
      min: { amountMinor: 15000000, currency: "UZS" },
      max: { amountMinor: 15000000, currency: "UZS" }
    });
    expect(node.metadata.typicalDurationMinutes).toBeNull();
  });
});

describe("behavioural projections", () => {
  const visits = [
    { customerId: "cus_1", businessId: "biz_1", occurredAt: new Date("2026-07-01T00:00:00.000Z") },
    { customerId: "cus_1", businessId: "biz_1", occurredAt: new Date("2026-07-20T00:00:00.000Z") },
    { customerId: "cus_1", businessId: "biz_2", occurredAt: new Date("2026-07-10T00:00:00.000Z") }
  ];

  it("aggregates CustomerVisit rows into one visited edge per business", () => {
    const edges = visitedEdges("cus_1", visits);

    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({
      kind: "visited",
      fromId: "customer:cus_1",
      toId: "business:biz_1",
      source: "visit",
      confidence: 1,
      attributes: { visitCount: 2, lastVisitAt: "2026-07-20T00:00:00.000Z" }
    });
  });

  it("joins a booking to a service only when the name matches an active package", () => {
    const booking: BookingProjectionRow = {
      id: "bk_1",
      businessId: "biz_1",
      customerId: "cus_1",
      serviceName: "  haircut ",
      startsAt: new Date("2026-07-15T09:00:00.000Z"),
      endsAt: null,
      status: "completed",
      updatedAt: UPDATED_AT
    };

    expect(matchServiceId(booking, [haircut])).toBe("pkg_1");
    expect(matchServiceId({ serviceName: "Massage" }, [haircut])).toBeNull();
    // An inactive package is not a service the business provides.
    expect(matchServiceId({ serviceName: "Old Package" }, [retiredPackage])).toBeNull();

    const edges = bookedEdges("cus_1", [booking, booking], new Map([["biz_1", [haircut]]]));
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      kind: "booked",
      fromId: "customer:cus_1",
      toId: "service:pkg_1",
      source: "booking",
      attributes: { bookingCount: 2 }
    });

    // A booking with no matching package yields no edge at all.
    expect(
      bookedEdges("cus_1", [{ ...booking, serviceName: "Massage" }], new Map([["biz_1", [haircut]]]))
    ).toEqual([]);
  });

  it("projects review and campaign edges with their own provenance", () => {
    const review = describesEdge({
      id: "rev_1",
      businessId: "biz_1",
      userId: "usr_1",
      rating: 5,
      bookingId: "bk_1",
      updatedAt: UPDATED_AT
    });

    expect(review).toMatchObject({
      kind: "describes",
      fromId: "review:rev_1",
      toId: "business:biz_1",
      source: "review",
      attributes: { rating: 5, verifiedVisit: true }
    });

    const campaign = promotesEdge({
      id: "cmp_1",
      businessId: "biz_1",
      name: "Win-back",
      channel: "telegram",
      isActive: true,
      createdAt: UPDATED_AT,
      updatedAt: UPDATED_AT
    });

    expect(campaign).toMatchObject({
      kind: "promotes",
      fromId: "campaign:cmp_1",
      toId: "business:biz_1",
      source: "campaign",
      attributes: { channel: "telegram", active: true }
    });
  });

  it("walks the category tree with the frozen part_of kind", () => {
    const edge = categoryParentEdge(
      { id: "cat_2", slug: "cafes", nameUz: "Kafelar", parentId: "cat_1" },
      "2026-08-01T10:00:00.000Z"
    );

    expect(edge).toMatchObject({ kind: "part_of", fromId: "category:cat_2", toId: "category:cat_1" });
    expect(categoryParentEdge({ id: "cat_1", slug: "food", nameUz: "Ovqat", parentId: null }, "x")).toBeNull();
  });
});

describe("neighborhood projection", () => {
  it("averages the located businesses into a centroid", () => {
    const node = toNeighborhoodEntity(
      { city: "Tashkent", district: "Yunusobod tumani" },
      [
        { lat: { toString: () => "41.0" }, lng: { toString: () => "69.0" } },
        { lat: { toString: () => "43.0" }, lng: { toString: () => "71.0" } },
        { lat: null, lng: null }
      ],
      [],
      "2026-08-01T10:00:00.000Z"
    );

    expect(node.id).toBe("neighborhood:Tashkent:Yunusobod%20tumani");
    expect(node.metadata.centroid).toEqual({ latitude: 42, longitude: 70 });
  });

  it("has no centroid when nothing in the area publishes coordinates", () => {
    const node = toNeighborhoodEntity(
      { city: "Tashkent", district: "Chilonzor" },
      [{ lat: null, lng: null }],
      [],
      "2026-08-01T10:00:00.000Z"
    );

    expect(node.metadata.centroid).toBeNull();
  });
});

describe("booking node", () => {
  it("degenerates an open-ended window instead of inventing a duration", () => {
    const node = toBookingEntity(
      {
        id: "bk_1",
        businessId: "biz_1",
        customerId: "cus_1",
        serviceName: "Haircut",
        startsAt: new Date("2026-07-15T09:00:00.000Z"),
        endsAt: null,
        status: "canceled",
        updatedAt: UPDATED_AT
      },
      "pkg_1",
      []
    );

    expect(node.metadata.window).toEqual({
      start: "2026-07-15T09:00:00.000Z",
      end: "2026-07-15T09:00:00.000Z"
    });
    expect(node.metadata.status).toBe("cancelled");
    expect(node.metadata.serviceId).toBe(graphId("service", "pkg_1"));
    expect(node.metadata.experienceId).toBeNull();
  });
});

describe("cross-business identity", () => {
  it("prefers the account id and falls back to the phone", () => {
    expect(customerIdentityKey({ userId: "usr_1", phone: "+998 90 123 45 67" })).toBe("user:usr_1");
    expect(customerIdentityKey({ userId: null, phone: "+998 90 123 45 67" })).toBe("phone:+998901234567");
  });
});
