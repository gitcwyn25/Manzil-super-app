import {
  canonicalJson,
  fingerprintRequest,
  isValidIdempotencyKey,
  principalFor,
  readIdempotencyKey,
  routeOf,
  scopedKey
} from "./idempotency.fingerprint";

describe("readIdempotencyKey", () => {
  it("reads the header the web client sends", () => {
    // Node lower-cases incoming header names; the wire spelling is
    // `Idempotency-Key`, set by apps/web/app/lib/pxs/idempotency.ts.
    expect(readIdempotencyKey({ "idempotency-key": "abc-123-def" })).toBe("abc-123-def");
  });

  it("collapses the array form Node can produce", () => {
    expect(readIdempotencyKey({ "idempotency-key": ["first", "second"] })).toBe("first");
  });

  it("treats absent, empty and whitespace-only as no key at all", () => {
    expect(readIdempotencyKey({})).toBeNull();
    expect(readIdempotencyKey(undefined)).toBeNull();
    expect(readIdempotencyKey({ "idempotency-key": "" })).toBeNull();
    expect(readIdempotencyKey({ "idempotency-key": "   " })).toBeNull();
  });
});

describe("isValidIdempotencyKey", () => {
  it("accepts a UUID v4, which is what the client mints", () => {
    expect(isValidIdempotencyKey("6f1a2c4e-1c2b-4f3a-9d4e-5a6b7c8d9e0f")).toBe(true);
  });

  it("rejects keys too short to distinguish two intents", () => {
    expect(isValidIdempotencyKey("abc")).toBe(false);
  });

  it("rejects control characters, which end up in store keys and logs", () => {
    expect(isValidIdempotencyKey("abcdefgh\nij")).toBe(false);
    expect(isValidIdempotencyKey("abcd efgh")).toBe(false);
  });

  it("rejects an absurdly long key", () => {
    expect(isValidIdempotencyKey("a".repeat(256))).toBe(false);
  });
});

describe("canonicalJson", () => {
  it("orders object keys, so serialization order cannot change a fingerprint", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });

  it("orders nested keys too", () => {
    expect(canonicalJson({ x: { b: 1, a: 2 } })).toBe(canonicalJson({ x: { a: 2, b: 1 } }));
  });

  it("keeps array order, because [a, b] is not [b, a]", () => {
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
  });

  it("drops undefined exactly as JSON.stringify does", () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe(canonicalJson({ a: 1 }));
  });

  it("survives a circular structure instead of overflowing", () => {
    const node: Record<string, unknown> = { name: "a" };
    node.self = node;

    expect(() => canonicalJson(node)).not.toThrow();
  });
});

describe("fingerprintRequest", () => {
  const base = { method: "POST", originalUrl: "/v1/crm/register", body: { name: "A" } };

  it("is stable across key order", () => {
    expect(fingerprintRequest({ ...base, body: { name: "A", district: "B" } })).toBe(
      fingerprintRequest({ ...base, body: { district: "B", name: "A" } })
    );
  });

  it("changes when the body changes", () => {
    expect(fingerprintRequest(base)).not.toBe(
      fingerprintRequest({ ...base, body: { name: "B" } })
    );
  });

  it("changes when the URL changes", () => {
    expect(fingerprintRequest(base)).not.toBe(
      fingerprintRequest({ ...base, originalUrl: "/v1/waitlist" })
    );
  });

  it("distinguishes a query string", () => {
    expect(fingerprintRequest({ ...base, originalUrl: "/v1/x?a=1" })).not.toBe(
      fingerprintRequest({ ...base, originalUrl: "/v1/x?a=2" })
    );
  });

  it("never contains the body it hashed", () => {
    // The store holds a fingerprint for 24h, not a copy of every registration
    // payload, contact address and campaign draft that passed through.
    const secretish = fingerprintRequest({ ...base, body: { taxId: "123456789" } });

    expect(secretish).toMatch(/^[0-9a-f]{64}$/);
    expect(secretish).not.toContain("123456789");
  });
});

describe("routeOf", () => {
  it("drops the query string, which belongs to the fingerprint not the label", () => {
    expect(routeOf({ method: "post", originalUrl: "/v1/crm/register?x=1" })).toBe(
      "POST /v1/crm/register"
    );
  });
});

describe("principalFor", () => {
  it("uses the verified user id when a guard resolved one", () => {
    expect(principalFor({ manzilActor: { userId: "user_42" } })).toEqual({
      scope: "user:user_42",
      authenticated: true
    });
  });

  it("falls back to the resolved admin for a console credential session", () => {
    expect(principalFor({ adminUser: { id: "admin_7" } })).toEqual({
      scope: "admin:admin_7",
      authenticated: true
    });
  });

  it("never derives identity from the body", () => {
    const spoofed = principalFor({
      body: { userId: "user_victim" },
      ip: "203.0.113.1",
      headers: { "user-agent": "curl/8" }
    });

    expect(spoofed.scope).not.toContain("user_victim");
    expect(spoofed.authenticated).toBe(false);
  });

  it("scopes an anonymous caller by client address and user agent", () => {
    const facts = { ip: "203.0.113.1", headers: { "user-agent": "Mozilla/5.0" } };

    expect(principalFor(facts).scope).toBe(principalFor({ ...facts }).scope);
    expect(principalFor(facts).scope).not.toBe(
      principalFor({ ...facts, ip: "203.0.113.2" }).scope
    );
    expect(principalFor(facts).scope).not.toBe(
      principalFor({ ...facts, headers: { "user-agent": "curl/8" } }).scope
    );
  });

  it("prefers the proxied client address, matching the rate limiter", () => {
    // `main.ts` sets `trust proxy` to one hop, so `ips[0]` is the real client
    // and `ip` would be Railway's edge — bucketing every anonymous caller
    // together.
    expect(principalFor({ ips: ["198.51.100.9"], ip: "10.0.0.1" }).scope).not.toBe(
      principalFor({ ip: "10.0.0.1" }).scope
    );
  });

  it("hashes rather than stores the address", () => {
    expect(principalFor({ ip: "203.0.113.1" }).scope).not.toContain("203.0.113.1");
  });
});

describe("scopedKey", () => {
  it("cannot be spelled two ways", () => {
    // A key is printable ASCII with no space, so the separator is unambiguous:
    // no (scope, key) pair can collide with a different one.
    expect(scopedKey("user:a", "b")).not.toBe(scopedKey("user:a b", ""));
  });
});
