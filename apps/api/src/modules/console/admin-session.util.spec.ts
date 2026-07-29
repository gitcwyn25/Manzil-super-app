import { createHmac } from "node:crypto";
import {
  parseCookieHeader,
  readCookieValue,
  signAdminSession,
  verifyAdminSession,
  ADMIN_SESSION_COOKIE_NAME
} from "./admin-session.util";

// Fabricated placeholder, used only in-memory for this test run — not the
// real ADMIN_SESSION_SECRET, which lives only in the gitignored root .env.
const TEST_SECRET = "unit-test-only-session-secret-not-real";

describe("admin-session.util", () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.ADMIN_SESSION_SECRET;
    } else {
      process.env.ADMIN_SESSION_SECRET = originalSecret;
    }
  });

  describe("with ADMIN_SESSION_SECRET configured", () => {
    beforeEach(() => {
      process.env.ADMIN_SESSION_SECRET = TEST_SECRET;
    });

    it("round-trips a signed session for the admin id that was signed", () => {
      const { value } = signAdminSession("admin_123");
      const verified = verifyAdminSession(value);
      expect(verified).toEqual({ adminId: "admin_123" });
    });

    it("rejects a cookie with a tampered signature", () => {
      const { value } = signAdminSession("admin_123");
      const [payload] = value.split(".");
      const tampered = `${payload}.${"0".repeat(64)}`;
      expect(verifyAdminSession(tampered)).toBeNull();
    });

    it("rejects a cookie whose payload was edited (adminId swapped) even though the trailing signature looks well-formed", () => {
      const { value } = signAdminSession("admin_123");
      const [, signature] = value.split(".");
      const forgedPayload = Buffer.from(JSON.stringify({ adminId: "admin_other", exp: Date.now() + 60_000 }), "utf8").toString(
        "base64url"
      );
      expect(verifyAdminSession(`${forgedPayload}.${signature}`)).toBeNull();
    });

    it("rejects a well-formed but already-expired session", () => {
      const expiredPayload = Buffer.from(JSON.stringify({ adminId: "admin_123", exp: Date.now() - 1000 }), "utf8").toString(
        "base64url"
      );
      const signature = createHmac("sha256", TEST_SECRET).update(expiredPayload).digest("hex");
      expect(verifyAdminSession(`${expiredPayload}.${signature}`)).toBeNull();
    });

    it("rejects garbage input without throwing", () => {
      expect(() => verifyAdminSession("not-a-real-cookie")).not.toThrow();
      expect(verifyAdminSession("not-a-real-cookie")).toBeNull();
      expect(verifyAdminSession(undefined)).toBeNull();
      expect(verifyAdminSession(null)).toBeNull();
      expect(verifyAdminSession("")).toBeNull();
    });

    it("a session signed under a different secret does not verify", () => {
      const { value } = signAdminSession("admin_123");
      process.env.ADMIN_SESSION_SECRET = "a-completely-different-secret";
      expect(verifyAdminSession(value)).toBeNull();
    });
  });

  describe("with ADMIN_SESSION_SECRET missing — fail closed", () => {
    beforeEach(() => {
      delete process.env.ADMIN_SESSION_SECRET;
    });

    it("signAdminSession refuses to issue a cookie", () => {
      expect(() => signAdminSession("admin_123")).toThrow();
    });

    it("verifyAdminSession rejects a cookie that would otherwise be valid, rather than accepting it unsigned", () => {
      process.env.ADMIN_SESSION_SECRET = TEST_SECRET;
      const { value } = signAdminSession("admin_123");
      delete process.env.ADMIN_SESSION_SECRET;

      expect(verifyAdminSession(value)).toBeNull();
    });
  });

  describe("cookie header parsing", () => {
    it("parses multiple cookies and extracts the named one", () => {
      const header = `foo=bar; ${ADMIN_SESSION_COOKIE_NAME}=abc.def; other=1`;
      expect(parseCookieHeader(header)).toMatchObject({ foo: "bar", [ADMIN_SESSION_COOKIE_NAME]: "abc.def", other: "1" });
      expect(readCookieValue(header, ADMIN_SESSION_COOKIE_NAME)).toBe("abc.def");
    });

    it("returns undefined/empty for a missing header", () => {
      expect(parseCookieHeader(undefined)).toEqual({});
      expect(readCookieValue(undefined, ADMIN_SESSION_COOKIE_NAME)).toBeUndefined();
    });
  });
});
