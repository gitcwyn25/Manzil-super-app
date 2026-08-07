/**
 * Epic 18 — wiring.
 *
 * A `*_PROVIDERS` array rather than a NestJS module, matching Epics 04–07:
 * `AppModule` spreads it and gets the store, the global interceptor, and
 * nothing else. One import line, no module graph to reason about.
 */
import type { Provider } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";
import { IdempotencyInterceptor } from "./idempotency.interceptor";
import { RedisIdempotencyStore } from "./idempotency.redis.store";
import {
  InProcessIdempotencyStore,
  PrismaIdempotencyStore,
  resolveIdempotencyDelegate,
  type IdempotencyStore
} from "./idempotency.store";
import { IDEMPOTENCY_STORE } from "./idempotency.tokens";

/** Env var that opts a deployment into the durable store after M1. */
export const IDEMPOTENCY_STORE_ENV = "API_IDEMPOTENCY_STORE";

/**
 * Chooses the store.
 *
 * Postgres requires **two** independent signals, for the reason every gated
 * store in this codebase requires two: `prisma generate` runs on every image
 * build and would mint an `idempotencyRecord` delegate the moment the model
 * appears in `schema.prisma` — while the migration is still gated and the
 * table still absent. Selecting on the delegate alone would switch the store
 * on at build time and fail at query time, on the write path, which is the
 * worst possible place to discover it. So the delegate must exist *and* the
 * deployment must say `API_IDEMPOTENCY_STORE=prisma`.
 *
 * Otherwise Redis, if the shared cache connection is configured. It arbitrates
 * across replicas today — pre-M1 — which matters because a double-click that
 * lands on two different API instances is not a hypothetical once more than
 * one instance is running.
 *
 * Otherwise in process: correct, bounded, and honest about protecting only the
 * replica that received the request.
 */
export function selectIdempotencyStore(
  prisma: PrismaService,
  cache: CacheService | null,
  env: NodeJS.ProcessEnv = process.env
): IdempotencyStore {
  if (env[IDEMPOTENCY_STORE_ENV] === "prisma") {
    const delegate = resolveIdempotencyDelegate(prisma);
    if (delegate) return new PrismaIdempotencyStore(delegate);
  }

  const fallback = new InProcessIdempotencyStore();

  // `REDIS_URL` rather than `cache.client`: the connection is lazy and may not
  // be ready at boot, so asking for the client here would pick the in-process
  // store on every cold start. The Redis store checks liveness per call and
  // degrades into the same fallback instance when the connection is down.
  return cache && process.env.REDIS_URL ? new RedisIdempotencyStore(cache, fallback) : fallback;
}

export const IDEMPOTENCY_PROVIDERS: Provider[] = [
  {
    provide: IDEMPOTENCY_STORE,
    useFactory: (prisma: PrismaService, cache: CacheService): IdempotencyStore =>
      selectIdempotencyStore(prisma, cache),
    inject: [PrismaService, CacheService]
  },
  // Global: a POST is replay-safe unless it opts out, so a newly added create
  // endpoint is never silently unprotected. Same reasoning as the global rate
  // limiter it sits beside.
  { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor }
];
