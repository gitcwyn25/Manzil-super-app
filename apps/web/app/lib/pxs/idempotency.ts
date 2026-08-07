/**
 * Idempotency keys — the client half of duplicate-write protection.
 *
 * ## The bug this exists to close
 *
 * A create form gives no feedback on click. The user, reasonably, clicks
 * again. Two HTTP requests leave the browser, the API has no way to tell they
 * were one intent, and the catalogue ends up with the same business listed
 * twice — with conflicting ratings, because the two rows then accumulate
 * separate reviews. That duplicate is visible in the live catalogue today
 * (docs/evidence/TRUST-AUDIT.md §6 recorded it as a data-integrity problem;
 * this is the write path that most plausibly produced it).
 *
 * PXS closes it from both ends:
 *   - **The interface** stops inviting the second click — `useMutation` and
 *     `MutationForm` disable the control and refuse re-entry while a request
 *     is in flight.
 *   - **The protocol** makes the second request harmless if it happens
 *     anyway — a retry after a lost response carries the same key, so the API
 *     can recognise it as the same intent rather than a new one.
 *
 * The second half matters even with a perfect UI: a request whose response was
 * lost to a dropped connection is genuinely ambiguous to the client, and the
 * only safe retry is an identified one.
 *
 * ## The contract
 *
 * Header: **`Idempotency-Key`** — the Stripe convention, chosen because it is
 * the one API authors and proxies already recognise. Value: a UUID v4.
 * Sent on **POST only**; PUT/PATCH/DELETE against a specific resource URL are
 * already idempotent by construction.
 *
 * Key lifetime — "one key per user intent":
 *   - minted when a create form mounts;
 *   - **kept across retries of the same attempt**, which is the entire point:
 *     retrying a submission whose outcome is unknown must be recognisable as
 *     the same operation;
 *   - rotated only after a confirmed success, or on an explicit `reset()`,
 *     because that is when the next submission becomes a genuinely new intent.
 *
 * ## Server-side contract required (NOT implemented here)
 *
 * `apps/api` is owned by a concurrent workstream, so the server half is a
 * separate task. Sending the header before the server honours it is harmless
 * and is the correct ordering. The behaviour this client expects is specified
 * in docs/design/PRODUCT-EXPERIENCE-SYSTEM.md under
 * "Server-side contract required".
 *
 * Server-safe: no browser-only API is used unconditionally, so both Server
 * Actions and client components can import this module.
 */

/** The header name. Import this rather than typing the string. */
export const IDEMPOTENCY_HEADER = "Idempotency-Key";

/**
 * Mints a UUID v4.
 *
 * `crypto.randomUUID` exists in every browser Manzil supports and in Node 19+,
 * but it is unavailable on insecure origins in some browsers. The fallback
 * uses `crypto.getRandomValues` and only falls back to `Math.random` if even
 * that is missing — which is not cryptographically strong, but a collision
 * between two independently generated 122-bit values is not the threat model
 * here. The key identifies one user's one submission; it is not a secret and
 * grants nothing.
 */
export function newIdempotencyKey(): string {
  const webCrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (webCrypto && typeof webCrypto.getRandomValues === "function") {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  // Version 4, variant 10xx — per RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Name of the hidden field that carries the key through a Server Action form.
 *
 * A Server Action receives `FormData`, not headers, so the key has to travel
 * as a field and be lifted back onto the header by the action. `MutationForm`
 * renders the field; `idempotencyKeyFrom()` reads it back.
 */
export const IDEMPOTENCY_FIELD = "idempotencyKey";

/**
 * Header object for a mutating request, or `{}` when no key was supplied.
 *
 * Returning nothing rather than minting a key server-side is deliberate. A key
 * generated per request on the server is different on every attempt, so it
 * provides no deduplication at all — it would look like protection while
 * offering none. Only a key that originates with the user's intent, in the
 * browser, and survives a retry does the job.
 */
export function idempotencyHeaders(key?: string | null): Record<string, string> {
  return key ? { [IDEMPOTENCY_HEADER]: key } : {};
}

/** Reads the key back out of a Server Action's `FormData`. */
export function idempotencyKeyFrom(formData: FormData): string | undefined {
  const value = formData.get(IDEMPOTENCY_FIELD);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
