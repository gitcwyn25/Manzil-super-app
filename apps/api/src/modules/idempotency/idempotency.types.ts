/**
 * Epic 18 — API idempotency: the vocabulary.
 *
 * The header, the window, and the shapes a store and an interceptor agree on.
 * Everything here is data; no I/O, no Nest.
 */

/**
 * The header, lower-cased.
 *
 * Node lower-cases every incoming header name, so this is the form a lookup
 * must use. The wire spelling is `Idempotency-Key` — the Stripe convention —
 * and it is what `apps/web/app/lib/pxs/idempotency.ts` already sends
 * (`IDEMPOTENCY_HEADER`), as specified in
 * `docs/design/PRODUCT-EXPERIENCE-SYSTEM.md` § "Server-side contract required".
 * The name is not ours to choose: the client shipped first (Epic 17,
 * commit 6f01a6e) and the server must meet it.
 */
export const IDEMPOTENCY_HEADER = "idempotency-key";

/** The wire spelling, for documentation and for responses that echo it. */
export const IDEMPOTENCY_HEADER_WIRE = "Idempotency-Key";

/**
 * How long a recorded outcome stays replayable — 24h, the industry norm and
 * the floor the PXS contract states ("a TTL of at least 24h").
 *
 * Long enough to cover a mobile client that reconnects the next morning still
 * holding the key it minted; short enough that the store is bounded.
 */
export const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Response header naming which of the two paths produced this response.
 *
 * `original` for the request that did the work, `replay` for one that got a
 * recorded outcome back. Diagnostic only — no client behaviour depends on it —
 * but without it a replay is indistinguishable from a fresh success in a log,
 * which is exactly the thing an operator needs to see when auditing a
 * duplicate.
 */
export const IDEMPOTENCY_REPLAY_HEADER = "Idempotency-Replayed";

/**
 * Who a key belongs to.
 *
 * Keys are scoped so that one caller's key can never collide with, or read the
 * response of, another's. `authenticated` is carried alongside the scope
 * because an anonymous scope is a weaker guarantee and callers that log or
 * reason about it must be able to tell the difference — see
 * `principalFor()` for the full tradeoff.
 */
export interface IdempotencyPrincipal {
  /** Opaque, stable scope string: `user:…`, `admin:…` or `anon:…`. */
  readonly scope: string;
  /** True only when the scope came from a verified identity. */
  readonly authenticated: boolean;
}

/** A recorded HTTP outcome: exactly what the first request returned. */
export interface StoredResponse {
  readonly status: number;
  readonly body: unknown;
}

/** State of one key within its window. */
export type IdempotencyState = "in_flight" | "completed";

/**
 * One row of the store.
 *
 * `fingerprint` is what makes a reused key detectable: same key + different
 * request is a client bug, and returning the original response to it would
 * swallow a user's corrected resubmission while reporting success.
 */
export interface IdempotencyRecord {
  readonly scope: string;
  readonly key: string;
  /** `POST /v1/crm/register` — human-readable, for audit. */
  readonly route: string;
  /** Hash of method + path + query + body. Never the body itself. */
  readonly fingerprint: string;
  readonly state: IdempotencyState;
  /** Present only once `state === "completed"`. */
  readonly response: StoredResponse | null;
  /** Epoch ms. */
  readonly createdAt: number;
  /** Epoch ms; `createdAt + IDEMPOTENCY_WINDOW_MS`. */
  readonly expiresAt: number;
}

/** What a caller must supply to attempt a claim. */
export interface IdempotencyClaimRequest {
  readonly scope: string;
  readonly key: string;
  readonly route: string;
  readonly fingerprint: string;
  /** Epoch ms — injected rather than read, so TTL is testable. */
  readonly now: number;
  readonly ttlMs: number;
}

/**
 * The four things that can happen when a request presents a key.
 *
 * `claimed` is the only one that runs the handler. The store decides which of
 * the four applies; the interceptor only translates them into HTTP.
 */
export type IdempotencyClaimOutcome =
  /** This caller owns the key and must execute, then `complete()` or `release()`. */
  | { readonly outcome: "claimed" }
  /** A completed record with a matching fingerprint — return it verbatim. */
  | { readonly outcome: "replay"; readonly record: IdempotencyRecord }
  /** Another request holds the key and has not finished. */
  | { readonly outcome: "in_flight"; readonly record: IdempotencyRecord }
  /** Same key, different request. Loud failure, never a silent replay. */
  | { readonly outcome: "fingerprint_mismatch"; readonly record: IdempotencyRecord };

/** Machine-readable codes on the two error bodies this layer can produce. */
export const IDEMPOTENCY_ERROR_CODES = {
  /** Same key, different payload. */
  reused: "IDEMPOTENCY_KEY_REUSED",
  /** The original request is still running. */
  inProgress: "IDEMPOTENCY_REQUEST_IN_PROGRESS",
  /** The key itself is unusable. */
  invalid: "IDEMPOTENCY_KEY_INVALID"
} as const;
