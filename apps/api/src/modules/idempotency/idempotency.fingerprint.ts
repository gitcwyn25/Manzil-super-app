/**
 * Epic 18 — pure logic: reading the key, identifying the caller, and
 * fingerprinting the request.
 *
 * No Nest, no Prisma, no clock. Every function here is deterministic, which is
 * what lets the interesting cases (a reordered JSON body must fingerprint the
 * same; two users must never share a scope) be tested without a server.
 */
import { createHash } from "node:crypto";
import type { IdempotencyPrincipal } from "./idempotency.types";
import { IDEMPOTENCY_HEADER } from "./idempotency.types";

/** Minimum key length. Shorter than this is not a UUID and not worth trusting. */
export const MIN_KEY_LENGTH = 8;

/** Maximum key length — Stripe's limit, and generous for a UUID. */
export const MAX_KEY_LENGTH = 255;

/** Bound on nesting we will canonicalize; deeper structures hash as a marker. */
const MAX_CANONICAL_DEPTH = 24;

/** Header bag as Node presents it. */
export type HeaderBag = Record<string, string | string[] | undefined> | undefined;

/**
 * The request attributes this module reads.
 *
 * Structural rather than `express.Request` so the pure tests can construct one
 * literally, and so nothing here depends on the HTTP framework.
 */
export interface IdempotencyRequestFacts {
  readonly method?: string;
  readonly headers?: HeaderBag;
  readonly originalUrl?: string;
  readonly url?: string;
  readonly path?: string;
  readonly body?: unknown;
  /** Populated by ManzilAuthGuard on every authenticated route. */
  readonly manzilActor?: { userId?: string } | undefined;
  /** Populated by PermissionGuard on console routes. */
  readonly adminUser?: { id?: string } | undefined;
  /** Express, left-to-right with the client first, when `trust proxy` is set. */
  readonly ips?: readonly string[];
  readonly ip?: string;
}

/** Reads a header value, collapsing the array form Node can produce. */
function headerValue(headers: HeaderBag, name: string): string | null {
  const raw = headers?.[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value : null;
}

/**
 * The key this request presents, or null when it presents none.
 *
 * Null is not an error. A request without a key is the pre-Epic-17 behaviour
 * and must keep working exactly as before — every existing client, every
 * server-to-server caller, and every curl in a runbook.
 */
export function readIdempotencyKey(headers: HeaderBag): string | null {
  const value = headerValue(headers, IDEMPOTENCY_HEADER);
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Whether a presented key is usable.
 *
 * Deliberately stricter than "non-empty" and deliberately looser than "a UUID
 * v4". Stricter, because a 2-character key collides across a user's own
 * submissions and would make two genuinely different intents look like one —
 * the failure mode this whole epic exists to prevent, inverted. Looser,
 * because a server-to-server caller with its own key format is not wrong, and
 * rejecting it would be us legislating the client's ID scheme.
 *
 * Printable ASCII only: the key ends up in a store key and in logs, and a
 * control character in either is a problem with no upside.
 */
export function isValidIdempotencyKey(key: string): boolean {
  return (
    key.length >= MIN_KEY_LENGTH && key.length <= MAX_KEY_LENGTH && /^[\x21-\x7e]+$/.test(key)
  );
}

/**
 * JSON with object keys in a stable order.
 *
 * Two serializations of the same object can differ in key order — different
 * client versions, different serializers, a `JSON.parse`/`stringify` round
 * trip — and a fingerprint that changed with key order would turn a legitimate
 * retry into a 409. Arrays keep their order, because `[a, b]` and `[b, a]` are
 * genuinely different requests.
 *
 * `undefined` is dropped exactly as `JSON.stringify` drops it, so a body that
 * omits a field and one that sends `undefined` for it agree.
 */
export function canonicalJson(value: unknown, depth = 0): string {
  if (depth > MAX_CANONICAL_DEPTH) return '"__depth_limit__"';
  if (value === null) return "null";

  const type = typeof value;

  if (type === "number") return Number.isFinite(value as number) ? JSON.stringify(value) : "null";
  if (type === "boolean" || type === "string") return JSON.stringify(value);
  if (type === "bigint") return JSON.stringify((value as bigint).toString());
  if (type === "undefined" || type === "function" || type === "symbol") return "null";

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item, depth + 1)).join(",")}]`;
  }

  if (value instanceof Date) return JSON.stringify(value.toISOString());

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item, depth + 1)}`);

  return `{${entries.join(",")}}`;
}

/** The path portion of a URL, without the query string. */
export function pathOf(request: IdempotencyRequestFacts): string {
  const raw = request.originalUrl ?? request.url ?? request.path ?? "";
  const cut = raw.indexOf("?");
  return cut === -1 ? raw : raw.slice(0, cut);
}

/** `POST /v1/crm/register` — what the record stores as its route. */
export function routeOf(request: IdempotencyRequestFacts): string {
  return `${(request.method ?? "POST").toUpperCase()} ${pathOf(request)}`;
}

/**
 * A hash of everything that makes this request the request it is.
 *
 * Method, full URL (query included — a POST with a query string is a different
 * operation) and the parsed body. The hash rather than the body itself,
 * because the store would otherwise hold a copy of every create payload for
 * 24h: registration details, contact addresses, campaign copy. A fingerprint
 * answers the only question the store needs answered — "is this the same
 * request?" — and answers it without retaining anything.
 */
export function fingerprintRequest(request: IdempotencyRequestFacts): string {
  const canonical = canonicalJson({
    method: (request.method ?? "POST").toUpperCase(),
    url: request.originalUrl ?? request.url ?? request.path ?? "",
    body: request.body ?? null
  });

  return createHash("sha256").update(canonical).digest("hex");
}

/** Short, stable digest of an anonymous caller's identifying attributes. */
function anonymousDigest(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\n")).digest("hex").slice(0, 32);
}

/**
 * The scope a key belongs to.
 *
 * ## Authenticated callers
 *
 * The verified user id, or the resolved admin id for a console credential
 * session. Interceptors run *after* guards in Nest, so by the time this is
 * called `manzilActor` / `adminUser` are already populated by the same guards
 * that authorize the request — the identity is verified, never taken from the
 * URL, params or body (Definition of Done #11).
 *
 * ## Anonymous callers — and the honest tradeoff
 *
 * Public creates exist (`POST /v1/waitlist`, and business registration would
 * be one if it were not behind auth) and they are exactly the endpoints a
 * double-click hits hardest, so leaving them unprotected was not an option.
 * With no identity to scope by, the only stable attributes are the client
 * address and the user agent, so that is what the scope hashes.
 *
 * What that buys and what it does not:
 *
 * - **It deduplicates.** Two submissions of one form from one browser carry
 *   the same key from the same address, so the second is recognised. That is
 *   the goal, and it is met.
 * - **It is coarse.** Everyone behind one NAT or corporate proxy running the
 *   same browser build shares a scope. Two of them collide only if they
 *   present the *same key*, and keys are UUID v4 — 122 bits — so an accidental
 *   collision will not happen. A deliberate one requires an attacker to obtain
 *   another user's key *and* share their egress address and user agent, and
 *   the payoff is one waitlist confirmation.
 * - **It is not a security boundary**, and nothing treats it as one.
 *   Authorization is still enforced by the guards; a scope only decides whose
 *   recorded response a replay may see. Anonymous endpoints are therefore held
 *   to the rule that they must not return anything the caller did not already
 *   supply — which is true of the waitlist response (`{ ok, position }`)
 *   today, and is a constraint on any future public create.
 * - **It degrades with the address.** A mobile client that changes network
 *   between the original request and the retry lands in a different scope and
 *   its retry executes as a new request. That is the pre-existing behaviour,
 *   not a regression — but it is why an anonymous endpoint must not rely on
 *   this alone for correctness.
 */
export function principalFor(request: IdempotencyRequestFacts): IdempotencyPrincipal {
  const userId = request.manzilActor?.userId;
  if (typeof userId === "string" && userId.length > 0) {
    return { scope: `user:${userId}`, authenticated: true };
  }

  const adminId = request.adminUser?.id;
  if (typeof adminId === "string" && adminId.length > 0) {
    return { scope: `admin:${adminId}`, authenticated: true };
  }

  // `ips` is populated left-to-right (client first) only when Express trusts
  // the proxy chain, which `main.ts` sets to exactly one hop — so this is the
  // real client address and not a spoofable header. Mirrors the rate limiter's
  // resolution deliberately: two subsystems disagreeing about who a caller is
  // would be a bug waiting to be found in production.
  const address = request.ips?.length ? request.ips[0] : (request.ip ?? "unknown");
  const userAgent = headerValue(request.headers, "user-agent") ?? "unknown";

  return { scope: `anon:${anonymousDigest([address, userAgent])}`, authenticated: false };
}

/**
 * The store's primary key: scope and key together, never the key alone.
 *
 * ` ` as the separator because it cannot occur in a valid key (printable
 * ASCII only), so no scope/key pair can be spelled two ways.
 */
export function scopedKey(scope: string, key: string): string {
  return `${scope} ${key}`;
}
