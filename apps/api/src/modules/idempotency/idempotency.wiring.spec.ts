/**
 * Boot-time wiring.
 *
 * `IdempotencyInterceptor` takes three `@Optional()` constructor arguments
 * whose types (`() => number`, `number`) are not injectable tokens. If those
 * were ever declared as required, Nest would fail to resolve them — and it
 * would fail at *bootstrap*, taking the whole API down, not at the first
 * request. That is a failure no unit test of the interceptor's logic can catch,
 * so it gets one of its own.
 */
import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";
import { IdempotencyInterceptor } from "./idempotency.interceptor";
import { IDEMPOTENCY_PROVIDERS } from "./idempotency.providers";
import { IDEMPOTENCY_STORE } from "./idempotency.tokens";
import type { IdempotencyStore } from "./idempotency.store";

/** Stand-ins: neither opens a connection, which is the point of overriding. */
const prismaDouble = {} as PrismaService;
const cacheDouble = { client: null, markUnhealthy: () => undefined } as unknown as CacheService;

// PrismaService and CacheService stand in for what AppModule supplies (the
// latter via the global CacheModule); both are overridden below so neither
// constructor runs and no connection is opened.
@Module({
  providers: [PrismaService, CacheService, IdempotencyInterceptor, ...IDEMPOTENCY_PROVIDERS]
})
class WiringModule {}

describe("IDEMPOTENCY_PROVIDERS", () => {
  it("resolves the interceptor and the store from the module graph", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [WiringModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaDouble)
      .overrideProvider(CacheService)
      .useValue(cacheDouble)
      .compile();

    const store = moduleRef.get<IdempotencyStore>(IDEMPOTENCY_STORE);
    // Listed explicitly above as well as behind APP_INTERCEPTOR, because Nest
    // rewrites enhancer tokens during scanning and they are not addressable by
    // class. Constructor resolution is identical either way, and that is what
    // this asserts.
    const interceptor = moduleRef.get(IdempotencyInterceptor);

    expect(store.backend).toBe("memory");
    expect(interceptor).toBeInstanceOf(IdempotencyInterceptor);

    await moduleRef.close();
  });

  it("registers the interceptor globally, not per-controller", () => {
    // Global registration is what makes a newly added POST protected by
    // default. A provider list that lost this entry would leave every future
    // create endpoint silently unguarded.
    expect(
      IDEMPOTENCY_PROVIDERS.some(
        (provider) =>
          typeof provider === "object" && "provide" in provider && provider.provide === APP_INTERCEPTOR
      )
    ).toBe(true);
  });
});
