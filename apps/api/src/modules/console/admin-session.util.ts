import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed session cookie for credential-based admin console login.
 *
 * The cookie carries `{ adminId, exp }` as a base64url JSON payload plus an
 * HMAC-SHA256 signature over that payload, keyed by `ADMIN_SESSION_SECRET`.
 * There is no server-side session store — the signature is what stops the
 * payload being forged or edited client-side.
 *
 * Fails closed: with no `ADMIN_SESSION_SECRET` configured, `signAdminSession`
 * refuses to issue a cookie and `verifyAdminSession` refuses to accept one.
 * Neither ever falls back to an unsigned or weakly-signed cookie.
 */

export const ADMIN_SESSION_COOKIE_NAME = "manzil_admin_session";

/** Cookie path — covers the login/logout/session routes and every other
 * `/console/*` route the cookie needs to be sent on, and nothing outside it. */
export const ADMIN_SESSION_COOKIE_PATH = "/v1/console";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type AdminSessionPayload = {
  adminId: string;
};

function getSecret(): string | undefined {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length > 0 ? secret : undefined;
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("hex");
}

/**
 * Signs a new admin session for `adminId`.
 * Throws if `ADMIN_SESSION_SECRET` is not configured — callers must let this
 * fail the request rather than catching it and issuing an unsigned cookie.
 */
export function signAdminSession(adminId: string): { value: string; maxAgeMs: number } {
  const secret = getSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured; refusing to issue an admin session cookie");
  }

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payloadB64 = Buffer.from(JSON.stringify({ adminId, exp: expiresAt }), "utf8").toString("base64url");
  const signature = sign(payloadB64, secret);

  return { value: `${payloadB64}.${signature}`, maxAgeMs: SESSION_TTL_MS };
}

/**
 * Verifies a cookie value produced by `signAdminSession`. Returns `null` for
 * anything missing, malformed, tampered, expired, or signed under a different
 * (or absent) secret — never throws, so callers can treat "no session" and
 * "bad session" identically.
 */
export function verifyAdminSession(cookieValue: string | null | undefined): AdminSessionPayload | null {
  const secret = getSecret();
  if (!secret || !cookieValue) return null;

  const separatorIndex = cookieValue.lastIndexOf(".");
  if (separatorIndex <= 0 || separatorIndex >= cookieValue.length - 1) return null;

  const payloadB64 = cookieValue.slice(0, separatorIndex);
  const providedSignature = cookieValue.slice(separatorIndex + 1);
  const expectedSignature = sign(payloadB64, secret);

  const providedBuf = Buffer.from(providedSignature, "hex");
  const expectedBuf = Buffer.from(expectedSignature, "hex");
  if (providedBuf.length === 0 || providedBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(providedBuf, expectedBuf)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as Record<string, unknown>).adminId !== "string" ||
    typeof (payload as Record<string, unknown>).exp !== "number"
  ) {
    return null;
  }

  const { adminId, exp } = payload as { adminId: string; exp: number };
  if (adminId.length === 0 || Date.now() > exp) return null;

  return { adminId };
}

/** Parses a raw `Cookie` request header into a name→value map. Deliberately
 * hand-rolled instead of pulling in `cookie-parser` — the API needs exactly
 * one cookie, so a tiny parser is less surface than a new dependency. */
export function parseCookieHeader(header: string | undefined | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;

  for (const part of header.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex < 0) continue;
    const name = part.slice(0, eqIndex).trim();
    if (!name) continue;
    const value = part.slice(eqIndex + 1).trim();
    try {
      result[name] = decodeURIComponent(value);
    } catch {
      result[name] = value;
    }
  }

  return result;
}

/** Reads a single named cookie out of a raw `Cookie` header value. */
export function readCookieValue(header: string | undefined | null, name: string): string | undefined {
  return parseCookieHeader(header)[name];
}
