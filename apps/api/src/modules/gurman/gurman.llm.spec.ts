import { Test } from "@nestjs/testing";
import { AnthropicLlm, GURMAN_LLM, GurmanLlmRouter } from "./gurman.llm";
import * as gurmanProvider from "./gurman.provider";
import { GurmanUnavailableError, OPENAI_CHAT_URL, type GurmanChatProvider } from "./gurman.provider";

const REPLY = '{"reply":"hi","suggestions":[]}';

const ENV_KEYS = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "OPENAI_MODEL", "ANTHROPIC_MODEL"] as const;

/**
 * Reaches into the router's cached provider. Which vendor it landed on is the
 * whole point of this class, so the tests assert on that rather than only on
 * a call having succeeded.
 */
function selectedProvider(router: GurmanLlmRouter): GurmanChatProvider | undefined {
  return (router as unknown as { provider?: GurmanChatProvider }).provider;
}

function fakeProvider(name: "openai" | "anthropic" = "openai") {
  return { name, model: "test-model", complete: jest.fn().mockResolvedValue(REPLY) };
}

describe("GurmanLlmRouter", () => {
  const originalEnv = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // The host machine may legitimately export either key; every test here
    // states its own configuration so the outcome never depends on that.
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.fetch = originalFetch;

    for (const [key, value] of originalEnv) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("throws without ever attempting a request when no key is configured", async () => {
    const select = jest.spyOn(gurmanProvider, "selectGurmanProvider");
    const router = new GurmanLlmRouter();

    await expect(router.complete("system", "user")).rejects.toBeInstanceOf(GurmanUnavailableError);
    expect(select).toHaveReturnedWith(null);
    expect(selectedProvider(router)).toBeUndefined();
  });

  it("treats blank/whitespace keys the same as missing ones", async () => {
    process.env.OPENAI_API_KEY = "   ";
    process.env.ANTHROPIC_API_KEY = "   ";
    const router = new GurmanLlmRouter();

    await expect(router.complete("s", "u")).rejects.toBeInstanceOf(GurmanUnavailableError);
    expect(selectedProvider(router)).toBeUndefined();
  });

  it("delegates verbatim to the selected provider and returns its text unchanged", async () => {
    const provider = fakeProvider();
    jest.spyOn(gurmanProvider, "selectGurmanProvider").mockReturnValue(provider);
    const router = new GurmanLlmRouter();

    const result = await router.complete("SYSTEM", "USER");

    expect(result).toBe(REPLY);
    expect(provider.complete).toHaveBeenCalledWith("SYSTEM", "USER");
  });

  it("reuses the resolved provider across calls rather than re-selecting per request", async () => {
    const select = jest.spyOn(gurmanProvider, "selectGurmanProvider").mockReturnValue(fakeProvider());
    const router = new GurmanLlmRouter();

    await router.complete("s", "u");
    await router.complete("s", "u");

    expect(select).toHaveBeenCalledTimes(1);
  });

  it("uses an injected provider without consulting the environment at all", async () => {
    const select = jest.spyOn(gurmanProvider, "selectGurmanProvider");
    const provider = fakeProvider("anthropic");
    const router = new GurmanLlmRouter(provider);

    await router.complete("s", "u");

    expect(provider.complete).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();
  });

  it("selects OpenAI end to end when only OPENAI_API_KEY is set", async () => {
    const fetchMock = stubFetch();
    process.env.OPENAI_API_KEY = "test-openai-key";
    const router = new GurmanLlmRouter();

    await expect(router.complete("s", "u")).resolves.toBe(REPLY);

    expect(selectedProvider(router)).toBeInstanceOf(gurmanProvider.OpenAiProvider);
    expect(fetchMock.mock.calls[0][0]).toBe(OPENAI_CHAT_URL);
  });

  it("prefers OpenAI end to end when both keys are set", async () => {
    const fetchMock = stubFetch();
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    const router = new GurmanLlmRouter();

    await expect(router.complete("s", "u")).resolves.toBe(REPLY);

    // Proof it never touched Anthropic: the one outbound call is OpenAI's.
    expect(selectedProvider(router)).toBeInstanceOf(gurmanProvider.OpenAiProvider);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(OPENAI_CHAT_URL);
  });

  it("falls back to Anthropic when only ANTHROPIC_API_KEY is set", () => {
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";

    // Resolved through the same function the router calls, but without firing
    // the request: constructing the Anthropic SDK client is the only side
    // effect, and no network call is made here.
    expect(gurmanProvider.selectGurmanProvider()).toBeInstanceOf(gurmanProvider.AnthropicProvider);
  });

  /** Replaces the global `fetch` an `OpenAiProvider` picks up at construction. */
  function stubFetch() {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: REPLY } }] })
    });

    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    return fetchMock;
  }
});

describe("GurmanLlmRouter under real Nest dependency injection", () => {
  // Guards the exact failure mode this design exists to avoid: if the
  // `@Optional()` test-seam constructor parameter ever confused Nest's DI
  // container into treating it as a required, unresolvable dependency,
  // `compile()` would throw here — before any request, at module wiring
  // time. That would mean a boot-time crash, which is precisely what
  // fail-closed-at-call-time is supposed to prevent.
  it("resolves via `useClass` with no providers for the optional provider param", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [{ provide: GURMAN_LLM, useClass: GurmanLlmRouter }]
    }).compile();

    expect(moduleRef.get(GURMAN_LLM)).toBeInstanceOf(GurmanLlmRouter);
  });

  // `app.module.ts` still wires the pre-multi-provider name. Until that
  // one-line rename lands, the alias must keep resolving to the router.
  it("resolves the deprecated `AnthropicLlm` alias to the router", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [{ provide: GURMAN_LLM, useClass: AnthropicLlm }]
    }).compile();

    expect(moduleRef.get(GURMAN_LLM)).toBeInstanceOf(GurmanLlmRouter);
  });
});
