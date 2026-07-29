import { hashPassword, verifyPassword } from "./admin-password.util";

// Throwaway credentials for exercising the hashing/verification contract only
// — never real ones, and never committed anywhere but this test file.
const THROWAWAY_PASSWORD = "correct horse battery staple";
const WRONG_PASSWORD = "incorrect horse battery staple";

describe("admin-password.util", () => {
  it("verifies the exact password that was hashed", () => {
    const stored = hashPassword(THROWAWAY_PASSWORD);
    expect(verifyPassword(THROWAWAY_PASSWORD, stored)).toBe(true);
  });

  it("rejects a wrong password against a real hash", () => {
    const stored = hashPassword(THROWAWAY_PASSWORD);
    expect(verifyPassword(WRONG_PASSWORD, stored)).toBe(false);
  });

  it("produces a different salt (and therefore a different stored value) on every call", () => {
    const first = hashPassword(THROWAWAY_PASSWORD);
    const second = hashPassword(THROWAWAY_PASSWORD);
    expect(first).not.toEqual(second);
    // Both still verify — the salt travels with the hash.
    expect(verifyPassword(THROWAWAY_PASSWORD, first)).toBe(true);
    expect(verifyPassword(THROWAWAY_PASSWORD, second)).toBe(true);
  });

  it("returns false (never throws) for a missing stored hash — the unknown-username case", () => {
    expect(() => verifyPassword(THROWAWAY_PASSWORD, undefined)).not.toThrow();
    expect(verifyPassword(THROWAWAY_PASSWORD, undefined)).toBe(false);
    expect(verifyPassword(THROWAWAY_PASSWORD, null)).toBe(false);
  });

  it("returns false (never throws) for a malformed stored hash", () => {
    expect(() => verifyPassword(THROWAWAY_PASSWORD, "not-a-real-hash")).not.toThrow();
    expect(verifyPassword(THROWAWAY_PASSWORD, "not-a-real-hash")).toBe(false);
    expect(verifyPassword(THROWAWAY_PASSWORD, "")).toBe(false);
  });

  it("stores the salt and hash separated by a single colon, both hex", () => {
    const stored = hashPassword(THROWAWAY_PASSWORD);
    const parts = stored.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^[0-9a-f]+$/);
    expect(parts[1]).toMatch(/^[0-9a-f]+$/);
  });
});
