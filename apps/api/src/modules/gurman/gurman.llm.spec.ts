import { Test } from "@nestjs/testing";
import { AnthropicLlm, GURMAN_LLM, GURMAN_MAX_TOKENS, GURMAN_MODEL, GurmanUnavailableError } from "./gurman.llm";

describe("AnthropicLlm", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("is pinned to the exact model from the design spec", () => {
    expect(GURMAN_MODEL).toBe("claude-sonnet-5");
  });

  it("throws without ever attempting a request when the key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const llm = new AnthropicLlm();

    await expect(llm.complete("system", "user")).rejects.toBeInstanceOf(GurmanUnavailableError);
  });

  it("treats a blank/whitespace key the same as a missing one", async () => {
    process.env.ANTHROPIC_API_KEY = "   ";
    const llm = new AnthropicLlm();

    await expect(llm.complete("s", "u")).rejects.toBeInstanceOf(GurmanUnavailableError);
  });

  it("sends the pinned model and token cap, and returns the text block", async () => {
    const create = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: '{"reply":"hi","suggestions":[]}' }]
    });
    const llm = new AnthropicLlm({ messages: { create } } as never);

    const result = await llm.complete("SYSTEM", "USER");

    expect(result).toBe('{"reply":"hi","suggestions":[]}');
    expect(create).toHaveBeenCalledWith({
      model: GURMAN_MODEL,
      max_tokens: GURMAN_MAX_TOKENS,
      system: "SYSTEM",
      messages: [{ role: "user", content: "USER" }]
    });
  });

  it("throws when the response carries no text block", async () => {
    const create = jest.fn().mockResolvedValue({ content: [] });
    const llm = new AnthropicLlm({ messages: { create } } as never);

    await expect(llm.complete("s", "u")).rejects.toBeInstanceOf(GurmanUnavailableError);
  });

  it("translates an SDK failure into GurmanUnavailableError rather than leaking it", async () => {
    const create = jest.fn().mockRejectedValue(new Error("connection reset"));
    const llm = new AnthropicLlm({ messages: { create } } as never);

    await expect(llm.complete("s", "u")).rejects.toBeInstanceOf(GurmanUnavailableError);
  });
});

describe("AnthropicLlm under real Nest dependency injection", () => {
  // Guards the exact failure mode this design exists to avoid: if the
  // `@Optional()` test-seam constructor parameter ever confused Nest's DI
  // container into treating it as a required, unresolvable dependency,
  // `compile()` would throw here — before any request, at module wiring
  // time. That would mean a boot-time crash, which is precisely what
  // fail-closed-at-call-time is supposed to prevent.
  it("resolves via `useClass` with no providers for the optional client param", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [{ provide: GURMAN_LLM, useClass: AnthropicLlm }]
    }).compile();

    expect(moduleRef.get(GURMAN_LLM)).toBeInstanceOf(AnthropicLlm);
  });
});
