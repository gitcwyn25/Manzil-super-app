import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing for credential-based admin console login.
 *
 * Uses Node's built-in `crypto.scrypt` rather than bcrypt/argon2 — no new
 * dependency, no native addon to build on Windows/CI. Stored as
 * `<saltHex>:<hashHex>` in `AdminUser.passwordHash`. The plaintext password is
 * never persisted or logged; only this derived, salted hash is stored.
 */

/** scrypt derived-key length, in bytes. */
const KEY_LENGTH = 64;

/**
 * Fixed, non-secret filler used only to keep `verifyPassword` on the same
 * code path (and therefore roughly the same cost) when there is no real
 * stored hash to compare against — see `verifyPassword` for why that matters.
 * These are not credentials and grant no access; they never match a real
 * scrypt output.
 */
const DUMMY_SALT = "00000000000000000000000000000000";
const DUMMY_HASH = "0".repeat(KEY_LENGTH * 2);

/** Hashes a plaintext password with a fresh random salt. Returns `salt:hash`, both hex. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored `salt:hash` value.
 *
 * Always performs a full scrypt derivation, even when `stored` is missing or
 * malformed (e.g. the username did not match any admin). Returning early in
 * that case would make an unknown-username login noticeably faster than a
 * known-username-wrong-password one, turning response timing into a way to
 * enumerate valid usernames. Comparison of the derived key against the
 * expected one uses `timingSafeEqual` for the same reason — a plain `===`
 * on hash bytes/strings short-circuits on the first differing byte.
 */
export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  const [salt, expectedHex] = splitStored(stored);
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHex, "hex");

  if (candidate.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(candidate, expected);
}

function splitStored(stored: string | null | undefined): [salt: string, hashHex: string] {
  if (stored) {
    const separatorIndex = stored.indexOf(":");
    if (separatorIndex > 0 && separatorIndex < stored.length - 1) {
      const salt = stored.slice(0, separatorIndex);
      const hash = stored.slice(separatorIndex + 1);
      if (salt.length > 0 && hash.length === KEY_LENGTH * 2) {
        return [salt, hash];
      }
    }
  }

  return [DUMMY_SALT, DUMMY_HASH];
}
