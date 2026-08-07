/**
 * Epic 18 — API idempotency & mutation integrity.
 *
 * The public surface: wire `IDEMPOTENCY_PROVIDERS` into `AppModule` and every
 * POST carrying `Idempotency-Key` becomes replay-safe. See `IDEMPOTENCY.md`
 * for the contract, the storage design and the audit that motivated it.
 */
export {
  IDEMPOTENCY_HEADER,
  IDEMPOTENCY_HEADER_WIRE,
  IDEMPOTENCY_REPLAY_HEADER,
  IDEMPOTENCY_WINDOW_MS,
  IDEMPOTENCY_ERROR_CODES
} from "./idempotency.types";
export type {
  IdempotencyClaimOutcome,
  IdempotencyClaimRequest,
  IdempotencyPrincipal,
  IdempotencyRecord,
  IdempotencyState,
  StoredResponse
} from "./idempotency.types";

export {
  canonicalJson,
  fingerprintRequest,
  isValidIdempotencyKey,
  principalFor,
  readIdempotencyKey,
  routeOf,
  scopedKey
} from "./idempotency.fingerprint";
export type { IdempotencyRequestFacts } from "./idempotency.fingerprint";

export {
  InProcessIdempotencyStore,
  PrismaIdempotencyStore,
  classifyExisting,
  resolveIdempotencyDelegate
} from "./idempotency.store";
export type { IdempotencyStore } from "./idempotency.store";
export { RedisIdempotencyStore } from "./idempotency.redis.store";

export { IdempotencyInterceptor } from "./idempotency.interceptor";
export { NoIdempotency, NO_IDEMPOTENCY_KEY } from "./no-idempotency.decorator";
export {
  IDEMPOTENCY_CLOCK,
  IDEMPOTENCY_IN_FLIGHT_WAIT_MS,
  IDEMPOTENCY_STORE,
  IDEMPOTENCY_TTL_MS
} from "./idempotency.tokens";
export {
  IDEMPOTENCY_PROVIDERS,
  IDEMPOTENCY_STORE_ENV,
  selectIdempotencyStore
} from "./idempotency.providers";
