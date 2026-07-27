import { resolveCorsOrigins } from "./cors.config";

/**
 * The wildcard cases matter most: `main.ts` refuses to boot when
 * `isWildcard` is true in production, and credentialed CORS with a wildcard
 * would let any website drive authenticated requests on a user's behalf.
 */
describe("resolveCorsOrigins", () => {
  it("parses a comma-separated allowlist and trims whitespace", () => {
    const result = resolveCorsOrigins("https://a.example , https://b.example", "production");

    expect(result.origins).toEqual(["https://a.example", "https://b.example"]);
    expect(result.isWildcard).toBe(false);
  });

  it("flags a literal wildcard as wildcard in production", () => {
    expect(resolveCorsOrigins("*", "production").isWildcard).toBe(true);
  });

  it("flags an unset origin as wildcard in production, so boot fails closed", () => {
    // An unset WEB_ORIGIN in production is a misconfiguration, not a reason to
    // fall back to permissive localhost defaults.
    expect(resolveCorsOrigins(undefined, "production").isWildcard).toBe(true);
    expect(resolveCorsOrigins("", "production").isWildcard).toBe(true);
  });

  it("does not flag a wildcard outside production, so local dev still runs", () => {
    expect(resolveCorsOrigins("*", "development").isWildcard).toBe(false);
    expect(resolveCorsOrigins(undefined, "development").isWildcard).toBe(false);
  });

  it("falls back to localhost when unset outside production", () => {
    expect(resolveCorsOrigins(undefined, "development").origins).toEqual([
      "http://localhost:3000",
      "http://localhost:3001"
    ]);
  });

  it("treats the string 'true' as a wildcard", () => {
    // A misconfigured env var set to "true" would otherwise be read as a
    // hostname and silently allow nothing, or worse, be passed to enableCors.
    expect(resolveCorsOrigins("true", "production").isWildcard).toBe(true);
  });
});
