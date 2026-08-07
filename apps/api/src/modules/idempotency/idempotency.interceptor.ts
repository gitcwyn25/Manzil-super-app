/**
 * Epic 18 — the interceptor: the only place idempotency touches HTTP.
 *
 * It runs after the guards (Nest's order is middleware → guards → interceptors
 * → pipes → handler), which is what lets it scope a key to a *verified*
 * principal rather than to anything the client asserted.
 *
 * ## The five paths
 *
 * | Situation | Result |
 * |---|---|
 * | No key, or not a POST | handler runs, nothing recorded — byte-identical to pre-Epic-18 behaviour |
 * | Key, first use | handler runs; its status + body are recorded |
 * | Key, completed, same request | the recorded status + body, verbatim |
 * | Key, in flight, same request | wait briefly, then the recorded response; 409 if it is still running |
 * | Key, different request | **409** — never a silent replay |
 *
 * That last row is the one worth defending. Silently returning the original
 * response to a *changed* payload would tell a user their correction succeeded
 * while discarding it — a worse outcome than the duplicate this epic exists to
 * prevent, because the duplicate is at least visible.
 */
import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  Optional
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, from, of, throwError } from "rxjs";
import { catchError, concatMap } from "rxjs/operators";
import {
  fingerprintRequest,
  isValidIdempotencyKey,
  principalFor,
  readIdempotencyKey,
  routeOf,
  type IdempotencyRequestFacts
} from "./idempotency.fingerprint";
import {
  IDEMPOTENCY_CLOCK,
  IDEMPOTENCY_IN_FLIGHT_WAIT_MS,
  IDEMPOTENCY_STORE,
  IDEMPOTENCY_TTL_MS
} from "./idempotency.tokens";
import type { IdempotencyStore } from "./idempotency.store";
import {
  IDEMPOTENCY_ERROR_CODES,
  IDEMPOTENCY_REPLAY_HEADER,
  IDEMPOTENCY_WINDOW_MS,
  type IdempotencyRecord
} from "./idempotency.types";
import { NO_IDEMPOTENCY_KEY } from "./no-idempotency.decorator";

/**
 * Nest's `@HttpCode` metadata key (`HTTP_CODE_METADATA` in
 * `@nestjs/common/constants`).
 *
 * Copied rather than deep-imported: the constant lives outside the package's
 * public entry point, and a build that resolves subpath exports differently
 * would break on the import while this string cannot break at all. Read
 * because the status Nest will send is decided *after* the interceptor chain —
 * `res.statusCode` is still the default 200 at the moment we record — so
 * asking the metadata is the only way to record the status the client will
 * actually see.
 */
export const NEST_HTTP_CODE_METADATA = "__httpCode__";

/** How long a duplicate waits for the original to finish before giving up. */
export const DEFAULT_IN_FLIGHT_WAIT_MS = 5000;

/** The response object surface this interceptor uses. */
interface ResponseFacts {
  statusCode?: number;
  status?: (code: number) => unknown;
  setHeader?: (name: string, value: string) => unknown;
}

/**
 * The status Nest will send for this handler.
 *
 * `@HttpCode(n)` wins; otherwise a status already set on the response (by a
 * handler that reached for it) is respected; otherwise Nest's defaults — 201
 * for POST, 200 for everything else.
 */
export function resolveStatusCode(
  declaredHttpCode: unknown,
  method: string | undefined,
  currentStatus: number | undefined
): number {
  if (typeof declaredHttpCode === "number") return declaredHttpCode;
  if (typeof currentStatus === "number" && currentStatus !== 200) return currentStatus;
  return (method ?? "").toUpperCase() === "POST" ? 201 : 200;
}

/**
 * A JSON-safe copy of a handler's return value.
 *
 * The stored body must not alias anything the handler still holds: a record
 * that mutated after it was stored would replay something that was never sent.
 * A round trip through JSON is also exactly the transformation the response
 * itself undergoes, so what is stored is what the first caller received —
 * `undefined` fields dropped, `Date`s already strings.
 */
export function jsonClone(value: unknown): unknown {
  if (value === undefined) return null;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    // Circular or non-serializable: it could not have been sent as JSON
    // either, so there is nothing meaningful to record.
    return null;
  }
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    @Inject(IDEMPOTENCY_STORE) private readonly store: IdempotencyStore,
    private readonly reflector: Reflector,
    // The three below are `@Optional()` with defaults rather than required
    // providers: nothing in production overrides them, and making the app
    // module declare a clock provider just so a test can advance time would
    // put test scaffolding into the runtime wiring.
    /** Injected so TTL expiry is provable without waiting a day. */
    @Optional() @Inject(IDEMPOTENCY_CLOCK) private readonly clock: () => number = () => Date.now(),
    @Optional() @Inject(IDEMPOTENCY_TTL_MS) private readonly ttlMs: number = IDEMPOTENCY_WINDOW_MS,
    @Optional()
    @Inject(IDEMPOTENCY_IN_FLIGHT_WAIT_MS)
    private readonly inFlightWaitMs: number = DEFAULT_IN_FLIGHT_WAIT_MS
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (context.getType() !== "http") return next.handle();

    const http = context.switchToHttp();
    const request = http.getRequest<IdempotencyRequestFacts>();

    // POST only. PUT/PATCH/DELETE against a specific resource URL are already
    // idempotent by construction, and GET has nothing to deduplicate — the
    // same reasoning the client half states.
    if ((request?.method ?? "").toUpperCase() !== "POST") return next.handle();

    if (
      this.reflector.getAllAndOverride<boolean>(NO_IDEMPOTENCY_KEY, [
        context.getHandler(),
        context.getClass()
      ])
    ) {
      return next.handle();
    }

    const key = readIdempotencyKey(request?.headers);

    // No key: the pre-Epic-18 path, unchanged. Backward compatibility is not a
    // courtesy here — the header only started shipping with Epic 17, so every
    // other caller in existence takes this branch.
    if (key === null) return next.handle();

    if (!isValidIdempotencyKey(key)) {
      throw new BadRequestException({
        message: "Idempotency-Key must be 8–255 printable characters (a UUID v4 is expected).",
        code: IDEMPOTENCY_ERROR_CODES.invalid
      });
    }

    const principal = principalFor(request);
    const route = routeOf(request);
    const fingerprint = fingerprintRequest(request);
    const response = http.getResponse<ResponseFacts>();

    // At most two claim attempts: the second exists for the case where the
    // original request failed and released the key while this one was waiting
    // on it. Retrying then is right — nothing was created — and bounding it at
    // two keeps a pathological loop impossible.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const now = this.clock();
      const claim = await this.store.claim({
        scope: principal.scope,
        key,
        route,
        fingerprint,
        now,
        ttlMs: this.ttlMs
      });

      if (claim.outcome === "fingerprint_mismatch") {
        throw this.reusedKeyError(route);
      }

      if (claim.outcome === "replay") {
        return of(this.replay(response, claim.record));
      }

      if (claim.outcome === "in_flight") {
        const settled = await this.store.awaitSettled(
          principal.scope,
          key,
          this.inFlightWaitMs
        );

        if (settled?.state === "completed" && settled.response) {
          // The winner may have been running a different request under the
          // same key; that is still a reused key, not a replay.
          if (settled.fingerprint !== fingerprint) throw this.reusedKeyError(route);
          return of(this.replay(response, settled));
        }

        // Released (the original failed) — loop and try to claim it ourselves.
        if (settled === null && attempt === 0) continue;

        throw new ConflictException({
          message:
            "A request with this Idempotency-Key is still being processed. Retry with the same key.",
          code: IDEMPOTENCY_ERROR_CODES.inProgress
        });
      }

      return this.runAndRecord(context, next, principal.scope, key, request.method);
    }

    // Unreachable: every branch above returns or throws.
    return next.handle();
  }

  /**
   * Runs the handler and records what it produced.
   *
   * Only 2xx is recorded. An error is not an outcome worth replaying — a
   * validation failure should be re-run once the client fixes the payload, and
   * a 500 should be retryable rather than frozen for 24h. So a non-2xx and a
   * thrown exception both release the claim, leaving the key exactly as
   * available as it was before.
   */
  private runAndRecord(
    context: ExecutionContext,
    next: CallHandler,
    scope: string,
    key: string,
    method: string | undefined
  ): Observable<unknown> {
    const response = context.switchToHttp().getResponse<ResponseFacts>();
    const declared = this.reflector.get<unknown>(NEST_HTTP_CODE_METADATA, context.getHandler());

    return next.handle().pipe(
      concatMap(async (body) => {
        const status = resolveStatusCode(declared, method, response?.statusCode);

        if (status >= 200 && status < 300) {
          await this.store.complete(scope, key, { status, body: jsonClone(body) }, this.clock());
        } else {
          await this.store.release(scope, key);
        }

        response?.setHeader?.(IDEMPOTENCY_REPLAY_HEADER, "original");
        return body;
      }),
      catchError((error: unknown) =>
        from(this.store.release(scope, key)).pipe(concatMap(() => throwError(() => error)))
      )
    );
  }

  /** Returns the recorded outcome verbatim, status included. */
  private replay(response: ResponseFacts, record: IdempotencyRecord): unknown {
    const status = record.response?.status ?? 200;

    if (typeof response?.status === "function") {
      response.status(status);
    } else if (response) {
      response.statusCode = status;
    }

    response?.setHeader?.(IDEMPOTENCY_REPLAY_HEADER, "replay");
    this.logger.log(`idempotent replay of ${record.route} (${status})`);

    return record.response?.body ?? null;
  }

  /**
   * 409 for a key reused with a different payload.
   *
   * Note for anyone reconciling the docs: `PRODUCT-EXPERIENCE-SYSTEM.md`
   * § "Server-side contract required" writes this case as 422 while the Epic 18
   * brief writes it as 409. 409 is implemented, because both statuses are
   * loud, the client treats neither as retryable, and 409 is what the binding
   * brief and the Stripe convention this header comes from both use. The
   * machine-readable `code` is the field a client should branch on.
   */
  private reusedKeyError(route: string): ConflictException {
    this.logger.warn(`Idempotency-Key reused with a different payload on ${route}`);

    return new ConflictException({
      message:
        "This Idempotency-Key was already used for a different request. Use a new key for a new operation.",
      code: IDEMPOTENCY_ERROR_CODES.reused
    });
  }
}
