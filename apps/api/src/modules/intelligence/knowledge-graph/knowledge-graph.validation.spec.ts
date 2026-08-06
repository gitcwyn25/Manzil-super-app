import {
  isValidConfidence,
  sanitizeGraphEntity,
  screenRelationships,
  validateGraphEntity,
  validateRelationship
} from "./knowledge-graph.validation";
import { KNOWN_RELATIONSHIP_KINDS, relationship } from "./knowledge-graph.relationships";
import type { AnyRelationship } from "../relationship-engine";
import type { BusinessEntity } from "./knowledge-graph.entities";

const AT = "2026-08-01T10:00:00.000Z";

function edge(overrides: Partial<AnyRelationship> = {}): AnyRelationship {
  return {
    ...relationship({
      kind: "belongs_to",
      fromId: "business:b1",
      toId: "category:k1",
      attributes: { primary: true },
      source: "merchant_input",
      confidence: 1,
      updatedAt: AT
    }),
    ...overrides
  } as AnyRelationship;
}

function business(relationships: readonly AnyRelationship[]): BusinessEntity {
  return {
    id: "business:b1",
    type: "business",
    relationships,
    metadata: {
      name: "Caravan Coffee",
      slug: "caravan-coffee",
      categoryId: "category:k1",
      neighborhoodId: "neighborhood:Tashkent:Chilonzor",
      priceTier: "$$",
      capabilities: [],
      openingHours: [],
      verified: true
    },
    confidence: 1,
    updatedAt: AT
  };
}

describe("confidence", () => {
  it("is a probability, not a number", () => {
    expect(isValidConfidence(0)).toBe(true);
    expect(isValidConfidence(1)).toBe(true);
    expect(isValidConfidence(1.01)).toBe(false);
    expect(isValidConfidence(-0.1)).toBe(false);
    expect(isValidConfidence(Number.NaN)).toBe(false);
  });
});

describe("validateRelationship", () => {
  it("accepts a well-formed projected edge", () => {
    expect(validateRelationship(edge())).toEqual([]);
  });

  it("reports every defect as a typed cause with a precise key", () => {
    const errors = validateRelationship(edge({ confidence: 7, toId: "not-a-graph-id" }));

    expect(errors.map((error) => error.kind)).toEqual(["knowledge_missing", "knowledge_missing"]);
    expect(errors.map((error) => (error as { missingKey: string }).missingKey)).toEqual([
      "relationship.toId",
      "relationship.confidence"
    ]);
  });

  it("rejects a self-edge, which carries no information", () => {
    const errors = validateRelationship(edge({ toId: "business:b1" }));

    expect(errors.map((error) => (error as { missingKey: string }).missingKey)).toContain(
      "relationship.distinct_endpoints"
    );
  });

  it("rejects a dangling edge when the known ids are supplied", () => {
    const errors = validateRelationship(edge(), { knownIds: new Set(["business:b1"]) });

    expect(errors.map((error) => (error as { missingKey: string }).missingKey)).toEqual([
      "relationship.toId.entity"
    ]);
  });

  it("rejects a kind this build cannot traverse", () => {
    const errors = validateRelationship(edge({ kind: "teleports_to" as never }), {
      knownKinds: KNOWN_RELATIONSHIP_KINDS
    });

    expect(errors.map((error) => (error as { missingKey: string }).missingKey)).toEqual([
      "relationship.kind.unknown"
    ]);
  });

  it("rejects an unparseable timestamp", () => {
    const errors = validateRelationship(edge({ updatedAt: "yesterday" }));

    expect(errors.map((error) => (error as { missingKey: string }).missingKey)).toEqual([
      "relationship.updatedAt"
    ]);
  });
});

describe("validateGraphEntity", () => {
  it("accepts a node whose edges touch it", () => {
    expect(validateGraphEntity(business([edge()]))).toEqual([]);
  });

  it("rejects an edge between two other nodes", () => {
    const errors = validateGraphEntity(
      business([edge({ fromId: "business:b9", toId: "category:k9" })])
    );

    expect(errors.map((error) => (error as { missingKey: string }).missingKey)).toEqual([
      "entity.relationships.incident"
    ]);
  });

  it("rejects an id whose prefix disagrees with the node type", () => {
    const errors = validateGraphEntity({ ...business([]), id: "category:k1" });

    expect(errors.map((error) => (error as { missingKey: string }).missingKey)).toEqual([
      "entity.id.type"
    ]);
  });
});

describe("sanitizeGraphEntity", () => {
  it("drops the bad edge and still serves the node", () => {
    const sanitized = sanitizeGraphEntity(business([edge(), edge({ confidence: 4 })]));

    expect(sanitized.entity?.relationships).toHaveLength(1);
    expect(sanitized.droppedEdges).toBe(1);
    expect(sanitized.errors).not.toHaveLength(0);
  });

  it("withholds a node whose own fields break the contract", () => {
    const sanitized = sanitizeGraphEntity({ ...business([]), confidence: 12 });

    expect(sanitized.entity).toBeNull();
  });
});

describe("screenRelationships", () => {
  it("splits a batch into what the graph serves and what it drops", () => {
    const result = screenRelationships([edge(), edge({ fromId: "nonsense" })]);

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.errors[0]?.kind).toBe("knowledge_missing");
  });
});
