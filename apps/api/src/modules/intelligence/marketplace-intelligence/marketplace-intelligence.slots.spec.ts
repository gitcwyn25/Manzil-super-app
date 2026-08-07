import {
  demandSubjectId,
  isSummaryKind,
  neighborhoodId,
  parseDemandSubjectId,
  parseNeighborhoodId,
  parseServiceKeyId,
  serviceKeyId,
  summaryId,
  summarySlotKey,
  SUMMARY_KINDS
} from "./marketplace-intelligence.slots";
import { parseTrendSubjectId, trendSubjectId } from "./trend-summarizer.service";
// Layer 2 may not import Layer 3 at runtime — this import exists only to pin
// the two layers' id formats against each other, which is precisely the drift
// a duplicated convention invites.
import { neighborhoodGraphId } from "../knowledge-graph/knowledge-graph.ids";

describe("neighborhood ids", () => {
  it("is byte-identical to the knowledge graph's, without importing it at runtime", () => {
    for (const district of ["Yunusobod", "Mirzo Ulug'bek", "Chilonzor"]) {
      expect(neighborhoodId("Tashkent", district)).toBe(
        neighborhoodGraphId("Tashkent", district)
      );
    }
  });

  it("round-trips a district whose name contains spaces and apostrophes", () => {
    const id = neighborhoodId("Tashkent", "Mirzo Ulug'bek");

    expect(id).toBe("neighborhood:Tashkent:Mirzo%20Ulug'bek");
    expect(parseNeighborhoodId(id)).toEqual({ city: "Tashkent", district: "Mirzo Ulug'bek" });
  });

  it("returns null for anything that is not one", () => {
    expect(parseNeighborhoodId("business:clx1")).toBeNull();
    expect(parseNeighborhoodId("neighborhood:Tashkent")).toBeNull();
    expect(parseNeighborhoodId("neighborhood:Tashkent:%E0%A4%A")).toBeNull();
  });
});

describe("service ids", () => {
  it("names a service by its normalized name, reversibly", () => {
    const id = serviceKeyId("beard trim");

    expect(id).toBe("service-market:beard%20trim");
    expect(parseServiceKeyId(id)).toBe("beard trim");
  });

  it("returns null for anything that is not one", () => {
    expect(parseServiceKeyId("service:clx1")).toBeNull();
    expect(parseServiceKeyId("service-market:")).toBeNull();
  });
});

describe("composite subjects", () => {
  it("keeps a trend's metric and entity in one subject, and recovers both", () => {
    const id = trendSubjectId("bookings", "biz_1");

    expect(id).toBe("bookings@biz_1");
    expect(parseTrendSubjectId(id)).toEqual({ metric: "bookings", entityId: "biz_1" });
    expect(parseTrendSubjectId("bookings@")).toBeNull();
    expect(parseTrendSubjectId("bookings")).toBeNull();
  });

  it("stores each metric in its own slot, so one cannot overwrite another", () => {
    expect(trendSubjectId("bookings", "biz_1")).not.toBe(trendSubjectId("views", "biz_1"));
  });

  it("keeps a demand question's what and where together", () => {
    expect(demandSubjectId("category:florist", "neighborhood:Tashkent:Yunusobod")).toBe(
      "category:florist@neighborhood:Tashkent:Yunusobod"
    );
    expect(parseDemandSubjectId("category:florist@neighborhood:Tashkent:Yunusobod")).toEqual({
      serviceOrCategoryId: "category:florist",
      areaId: "neighborhood:Tashkent:Yunusobod"
    });
    expect(parseDemandSubjectId("category:florist")).toEqual({
      serviceOrCategoryId: "category:florist",
      areaId: null
    });
  });
});

describe("summary identity", () => {
  it("derives the id from the slot, so it survives every recompute", () => {
    expect(summaryId({ kind: "business", subjectId: "biz_1" })).toBe("summary:business:biz_1");
    expect(summarySlotKey({ kind: "business", subjectId: "biz_1" })).toBe("business:biz_1");
  });

  it("knows every kind this build understands, and no others", () => {
    for (const kind of SUMMARY_KINDS) {
      expect(isSummaryKind(kind)).toBe(true);
    }

    expect(isSummaryKind("something_a_newer_build_wrote")).toBe(false);
    expect(isSummaryKind("toString")).toBe(false);
  });

  it("covers the seven summarizers and the three feature vectors", () => {
    expect(SUMMARY_KINDS).toEqual(
      expect.arrayContaining([
        "business",
        "customer",
        "neighborhood",
        "service",
        "trend",
        "campaign",
        "workspace",
        "business_features",
        "customer_features",
        "neighborhood_features"
      ])
    );
  });
});
