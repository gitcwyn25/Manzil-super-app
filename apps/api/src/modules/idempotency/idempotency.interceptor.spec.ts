/**
 * Epic 18 — the behaviour that matters, proven end to end through the
 * interceptor with a real store behind it.
 *
 * The headline case is `concurrent duplicates`: two requests that overlap in
 * time, one resource, two identical responses. Everything else in this file
 * exists because it is a way the feature could be wrong in a way that would
 * look right in production.
 */
import { BadRequestException, ConflictException, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { firstValueFrom, from, type Observable } from "rxjs";
import {
  DEFAULT_IN_FLIGHT_WAIT_MS,
  IdempotencyInterceptor,
  jsonClone,
  resolveStatusCode
} from "./idempotency.interceptor";
import { InProcessIdempotencyStore } from "./idempotency.store";
import { IDEMPOTENCY_ERROR_CODES, IDEMPOTENCY_WINDOW_MS } from "./idempotency.types";
import { NO_IDEMPOTENCY_KEY } from "./no-idempotency.decorator";

const KEY = "6f1a2c4e-0000-4000-8000-000000000001";

/** A response double that records what the interceptor did to it. */
function makeResponse() {
  const headers: Record<string, string> = {};
  let statusCode: number | undefined;

  return {
    get statusCode() {
      return statusCode;
    },
    set statusCode(value: number | undefined) {
      statusCode = value;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    headers
  };
}

interface RequestOptions {
  key?: string | null;
  body?: unknown;
  userId?: string | null;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
}

function makeRequest(options: RequestOptions = {}) {
  const headers: Record<string, string> = {};
  if (options.key !== null) headers["idempotency-key"] = options.key ?? KEY;
  if (options.userAgent) headers["user-agent"] = options.userAgent;

  return {
    method: options.method ?? "POST",
    originalUrl: options.url ?? "/v1/crm/register",
    headers,
    body: options.body ?? { name: "Ravotsoy", district: "Yunusobod" },
    manzilActor: options.userId === null ? undefined : { userId: options.userId ?? "user_a" },
    ip: options.ip ?? "203.0.113.7"
  };
}

class FakeController {}

function makeContext(
  request: unknown,
  response: unknown,
  handler: (...args: unknown[]) => unknown = function handle() {}
): ExecutionContext {
  return {
    getType: () => "http",
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    getHandler: () => handler,
    getClass: () => FakeController
  } as unknown as ExecutionContext;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A create handler that appends to `created` — the stand-in for a row in the
 * catalogue. Counting it is how "exactly one resource exists" is asserted.
 */
function makeCreateHandler(created: string[], delayMs = 0) {
  return {
    handle: () =>
      from(
        (async () => {
          if (delayMs > 0) await wait(delayMs);
          created.push(`business-${created.length + 1}`);
          return { data: { slug: created[created.length - 1] } };
        })()
      )
  };
}

function makeInterceptor(store: InProcessIdempotencyStore, clock: () => number = Date.now) {
  return new IdempotencyInterceptor(
    store,
    new Reflector(),
    clock,
    IDEMPOTENCY_WINDOW_MS,
    DEFAULT_IN_FLIGHT_WAIT_MS
  );
}

async function run(
  interceptor: IdempotencyInterceptor,
  context: ExecutionContext,
  handler: { handle: () => Observable<unknown> }
) {
  return firstValueFrom(await interceptor.intercept(context, handler));
}

describe("IdempotencyInterceptor", () => {
  describe("concurrent duplicates — the case this epic exists for", () => {
    it("creates exactly one resource and returns two identical responses", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created, 25);

      const first = makeResponse();
      const second = makeResponse();

      // Both in flight at once: the second is issued before the first has
      // resolved, exactly as a double-clicked form produces them.
      const [a, b] = await Promise.all([
        run(interceptor, makeContext(makeRequest(), first), handler),
        run(interceptor, makeContext(makeRequest(), second), handler)
      ]);

      expect(created).toHaveLength(1);
      expect(a).toEqual(b);
      expect(a).toEqual({ data: { slug: "business-1" } });

      // Same status, too — the replay is told to send the 201 the original
      // produced, not a fresh default.
      expect(second.statusCode).toBe(201);
      expect(second.headers["Idempotency-Replayed"]).toBe("replay");
      expect(first.headers["Idempotency-Replayed"]).toBe("original");
    });

    it("holds under a five-way pile-up", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created, 15);

      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          run(interceptor, makeContext(makeRequest(), makeResponse()), handler)
        )
      );

      expect(created).toHaveLength(1);
      for (const response of responses) {
        expect(response).toEqual({ data: { slug: "business-1" } });
      }
    });
  });

  describe("replay", () => {
    it("returns the original status and body, without re-running the handler", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      const original = await run(interceptor, makeContext(makeRequest(), makeResponse()), handler);

      const replayResponse = makeResponse();
      const replayed = await run(
        interceptor,
        makeContext(makeRequest(), replayResponse),
        handler
      );

      expect(created).toHaveLength(1);
      expect(replayed).toEqual(original);
      expect(replayResponse.statusCode).toBe(201);
    });

    it("replays the declared @HttpCode rather than assuming 201", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const handler = makeCreateHandler([]);

      function decorated() {}
      Reflect.defineMetadata("__httpCode__", 200, decorated);

      await run(
        interceptor,
        makeContext(makeRequest(), makeResponse(), decorated),
        handler
      );

      const replayResponse = makeResponse();
      await run(interceptor, makeContext(makeRequest(), replayResponse, decorated), handler);

      expect(replayResponse.statusCode).toBe(200);
    });
  });

  describe("a key reused for a different request", () => {
    it("fails with 409 rather than silently returning the original", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      await run(
        interceptor,
        makeContext(makeRequest({ body: { name: "Ravotsoy" } }), makeResponse()),
        handler
      );

      // The user noticed a typo and resubmitted — with the key the form still
      // held. Returning the first response here would tell them the correction
      // saved when it did not.
      await expect(
        run(
          interceptor,
          makeContext(makeRequest({ body: { name: "Ravot Soy" } }), makeResponse()),
          handler
        )
      ).rejects.toBeInstanceOf(ConflictException);

      expect(created).toHaveLength(1);
    });

    it("carries a machine-readable code", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const handler = makeCreateHandler([]);

      await run(interceptor, makeContext(makeRequest({ body: { a: 1 } }), makeResponse()), handler);

      const error = await run(
        interceptor,
        makeContext(makeRequest({ body: { a: 2 } }), makeResponse()),
        handler
      ).catch((thrown: ConflictException) => thrown);

      expect((error as ConflictException).getResponse()).toMatchObject({
        code: IDEMPOTENCY_ERROR_CODES.reused
      });
    });

    it("treats a reordered body as the same request", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      await run(
        interceptor,
        makeContext(makeRequest({ body: { name: "A", district: "B" } }), makeResponse()),
        handler
      );

      // Same fields, different serialization order. A fingerprint that changed
      // with key order would 409 a perfectly good retry.
      await expect(
        run(
          interceptor,
          makeContext(makeRequest({ body: { district: "B", name: "A" } }), makeResponse()),
          handler
        )
      ).resolves.toEqual({ data: { slug: "business-1" } });

      expect(created).toHaveLength(1);
    });
  });

  describe("TTL", () => {
    it("stops replaying once the 24h window has passed", async () => {
      const store = new InProcessIdempotencyStore();
      let now = 1_000_000;
      const interceptor = makeInterceptor(store, () => now);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      await run(interceptor, makeContext(makeRequest(), makeResponse()), handler);
      expect(created).toHaveLength(1);

      now += IDEMPOTENCY_WINDOW_MS + 1;

      await run(interceptor, makeContext(makeRequest(), makeResponse()), handler);

      // The window is over: the key means nothing any more, so this is a new
      // operation and creates. Anything else would be an unbounded store.
      expect(created).toHaveLength(2);
    });

    it("still replays just inside the window", async () => {
      const store = new InProcessIdempotencyStore();
      let now = 1_000_000;
      const interceptor = makeInterceptor(store, () => now);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      await run(interceptor, makeContext(makeRequest(), makeResponse()), handler);
      now += IDEMPOTENCY_WINDOW_MS - 1000;
      await run(interceptor, makeContext(makeRequest(), makeResponse()), handler);

      expect(created).toHaveLength(1);
    });
  });

  describe("scoping", () => {
    it("keeps two users' identical keys apart", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      const a = await run(
        interceptor,
        makeContext(makeRequest({ userId: "user_a" }), makeResponse()),
        handler
      );
      const b = await run(
        interceptor,
        makeContext(makeRequest({ userId: "user_b" }), makeResponse()),
        handler
      );

      // Both created, and neither saw the other's response — the failure this
      // guards against is one user's key returning another user's resource.
      expect(created).toHaveLength(2);
      expect(a).not.toEqual(b);
    });

    it("scopes anonymous callers by address and user agent", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      const anon = { userId: null, userAgent: "Mozilla/5.0 (Manzil test)", ip: "198.51.100.4" };

      await run(interceptor, makeContext(makeRequest(anon), makeResponse()), handler);
      await run(interceptor, makeContext(makeRequest(anon), makeResponse()), handler);

      expect(created).toHaveLength(1);

      // A different address is a different scope, so the same key executes.
      await run(
        interceptor,
        makeContext(makeRequest({ ...anon, ip: "198.51.100.9" }), makeResponse()),
        handler
      );

      expect(created).toHaveLength(2);
    });

    it("does not let an anonymous key replay an authenticated one", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      await run(interceptor, makeContext(makeRequest({ userId: "user_a" }), makeResponse()), handler);
      await run(interceptor, makeContext(makeRequest({ userId: null }), makeResponse()), handler);

      expect(created).toHaveLength(2);
    });

    it("separates routes carrying the same key", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      await run(interceptor, makeContext(makeRequest(), makeResponse()), handler);

      // Same key, different operation. The fingerprint covers the URL, so this
      // is caught as a reuse — which is the right answer: replaying a
      // registration's response onto a waitlist call would be worse than
      // either creating or refusing, and one key means one intent.
      await expect(
        run(interceptor, makeContext(makeRequest({ url: "/v1/waitlist" }), makeResponse()), handler)
      ).rejects.toBeInstanceOf(ConflictException);

      expect(created).toHaveLength(1);
    });
  });

  describe("backward compatibility", () => {
    it("passes a POST without the header straight through", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      await run(interceptor, makeContext(makeRequest({ key: null }), makeResponse()), handler);
      await run(interceptor, makeContext(makeRequest({ key: null }), makeResponse()), handler);

      expect(created).toHaveLength(2);
      // Nothing recorded: a caller that does not participate costs no storage.
      expect(store.size).toBe(0);
    });

    it("ignores non-POST methods", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      await run(interceptor, makeContext(makeRequest({ method: "PATCH" }), makeResponse()), handler);
      await run(interceptor, makeContext(makeRequest({ method: "PATCH" }), makeResponse()), handler);

      expect(created).toHaveLength(2);
      expect(store.size).toBe(0);
    });

    it("respects @NoIdempotency", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      const created: string[] = [];
      const handler = makeCreateHandler(created);

      function optedOut() {}
      Reflect.defineMetadata(NO_IDEMPOTENCY_KEY, true, optedOut);

      await run(interceptor, makeContext(makeRequest(), makeResponse(), optedOut), handler);
      await run(interceptor, makeContext(makeRequest(), makeResponse(), optedOut), handler);

      expect(created).toHaveLength(2);
      expect(store.size).toBe(0);
    });

    it("rejects an unusable key loudly", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);

      await expect(
        run(interceptor, makeContext(makeRequest({ key: "ab" }), makeResponse()), makeCreateHandler([]))
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("failures", () => {
    it("releases the key when the handler throws, so a retry can succeed", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      let attempt = 0;

      const flaky = {
        handle: () =>
          from(
            (async () => {
              attempt += 1;
              if (attempt === 1) throw new Error("geocoding timed out");
              return { data: { slug: "business-1" } };
            })()
          )
      };

      await expect(
        run(interceptor, makeContext(makeRequest(), makeResponse()), flaky)
      ).rejects.toThrow("geocoding timed out");

      // A failure is not an outcome worth replaying — the same key must be
      // usable again, which is exactly what a client retrying a lost request
      // will do.
      await expect(
        run(interceptor, makeContext(makeRequest(), makeResponse()), flaky)
      ).resolves.toEqual({ data: { slug: "business-1" } });

      expect(attempt).toBe(2);
    });

    it("lets a duplicate proceed when the original failed while it waited", async () => {
      const store = new InProcessIdempotencyStore();
      const interceptor = makeInterceptor(store);
      let attempt = 0;

      const handler = {
        handle: () =>
          from(
            (async () => {
              attempt += 1;
              await wait(10);
              if (attempt === 1) throw new Error("transient");
              return { data: { slug: "business-1" } };
            })()
          )
      };

      const [failed, recovered] = await Promise.allSettled([
        run(interceptor, makeContext(makeRequest(), makeResponse()), handler),
        run(interceptor, makeContext(makeRequest(), makeResponse()), handler)
      ]);

      expect(failed.status).toBe("rejected");
      expect(recovered).toEqual({
        status: "fulfilled",
        value: { data: { slug: "business-1" } }
      });
    });

    it("returns 409 while the original is genuinely still running", async () => {
      const store = new InProcessIdempotencyStore();
      // A zero wait makes "still running" deterministic rather than timing-dependent.
      const interceptor = new IdempotencyInterceptor(
        store,
        new Reflector(),
        Date.now,
        IDEMPOTENCY_WINDOW_MS,
        0
      );
      const created: string[] = [];
      const handler = makeCreateHandler(created, 30);

      const [first, second] = await Promise.allSettled([
        run(interceptor, makeContext(makeRequest(), makeResponse()), handler),
        run(interceptor, makeContext(makeRequest(), makeResponse()), handler)
      ]);

      expect(first.status).toBe("fulfilled");
      expect(second.status).toBe("rejected");
      expect((second as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
      expect(created).toHaveLength(1);
    });
  });
});

describe("resolveStatusCode", () => {
  it("prefers a declared @HttpCode", () => {
    expect(resolveStatusCode(202, "POST", 200)).toBe(202);
  });

  it("defaults a POST to 201, matching Nest", () => {
    // `res.statusCode` is still Express's default 200 when an interceptor
    // runs — Nest applies the real status afterwards — so 200 must not be
    // mistaken for a deliberate choice.
    expect(resolveStatusCode(undefined, "POST", 200)).toBe(201);
  });

  it("respects a status a handler already set", () => {
    expect(resolveStatusCode(undefined, "POST", 207)).toBe(207);
  });
});

describe("jsonClone", () => {
  it("detaches the stored body from the handler's object", () => {
    const body = { data: { slug: "a" } };
    const stored = jsonClone(body) as { data: { slug: string } };
    body.data.slug = "mutated";

    expect(stored.data.slug).toBe("a");
  });

  it("turns undefined into null so a replay is still valid JSON", () => {
    expect(jsonClone(undefined)).toBeNull();
  });

  it("records nothing for a value that could not have been sent", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(jsonClone(circular)).toBeNull();
  });
});
