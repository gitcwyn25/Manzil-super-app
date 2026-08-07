import {
  AnthropicProvider,
  GURMAN_MAX_TOKENS,
  GURMAN_MODEL,
  GURMAN_OPENAI_MODEL,
  GurmanUnavailableError,
  isGurmanConfigured,
  OPENAI_CHAT_URL,
  OpenAiProvider,
  selectGurmanProvider,
  type FetchLike
} from "./gurman.provider";

const REPLY = '{"reply":"hi","suggestions":[]}';

/** Minimal OpenAI success body. */
function okResponse(content: string) {
  return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) };
}

describe("AnthropicProvider", () => {
  it("is pinned to the exact model from the design spec by default", () => {
    expect(GURMAN_MODEL).toBe("claude-sonnet-5");
    expect(new AnthropicProvider("test-key").model).toBe(GURMAN_MODEL);
  });

  it("sends the pinned model and token cap, and returns the text block", async () => {
    const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: REPLY }] });
    const provider = new AnthropicProvider("test-key", GURMAN_MODEL, { messages: { create } });

    const result = await provider.complete("SYSTEM", "USER");

    expect(result).toBe(REPLY);
    expect(create).toHaveBeenCalledWith({
      model: GURMAN_MODEL,
      max_tokens: GURMAN_MAX_TOKENS,
      system: "SYSTEM",
      messages: [{ role: "user", content: "USER" }]
    });
  });

  it("sends an operator-supplied model override", async () => {
    const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: REPLY }] });
    const provider = new AnthropicProvider("test-key", "claude-haiku-4-5", { messages: { create } });

    await provider.complete("s", "u");

    expect(create.mock.calls[0][0].model).toBe("claude-haiku-4-5");
  });

  it("throws when the response carries no text block", async () => {
    const create = jest.fn().mockResolvedValue({ content: [] });
    const provider = new AnthropicProvider("test-key", GURMAN_MODEL, { messages: { create } });

    await expect(provider.complete("s", "u")).rejects.toBeInstanceOf(GurmanUnavailableError);
  });

  it("translates an SDK failure into GurmanUnavailableError rather than leaking it", async () => {
    const create = jest.fn().mockRejectedValue(new Error("connection reset"));
    const provider = new AnthropicProvider("test-key", GURMAN_MODEL, { messages: { create } });

    await expect(provider.complete("s", "u")).rejects.toBeInstanceOf(GurmanUnavailableError);
  });
});

describe("OpenAiProvider", () => {
  it("defaults to the current chat model and posts the documented shape", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(okResponse(REPLY));
    const provider = new OpenAiProvider("test-key", undefined, fetchImpl as unknown as FetchLike);

    const result = await provider.complete("SYSTEM", "USER");

    expect(result).toBe(REPLY);
    expect(provider.model).toBe(GURMAN_OPENAI_MODEL);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(OPENAI_CHAT_URL);
    expect(init.method).toBe("POST");
    expect(init.headers.authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toEqual({
      model: GURMAN_OPENAI_MODEL,
      max_completion_tokens: GURMAN_MAX_TOKENS,
      messages: [
        { role: "system", content: "SYSTEM" },
        { role: "user", content: "USER" }
      ]
    });
  });

  it("sends an operator-supplied model override", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(okResponse(REPLY));
    const provider = new OpenAiProvider("test-key", "gpt-4o", fetchImpl as unknown as FetchLike);

    await provider.complete("s", "u");

    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).model).toBe("gpt-4o");
  });

  it("translates a non-2xx response into GurmanUnavailableError", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    const provider = new OpenAiProvider("test-key", undefined, fetchImpl as unknown as FetchLike);

    await expect(provider.complete("s", "u")).rejects.toBeInstanceOf(GurmanUnavailableError);
  });

  it("translates a network failure into GurmanUnavailableError rather than leaking it", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("ECONNRESET"));
    const provider = new OpenAiProvider("test-key", undefined, fetchImpl as unknown as FetchLike);

    await expect(provider.complete("s", "u")).rejects.toBeInstanceOf(GurmanUnavailableError);
  });

  it("throws on an empty or malformed body instead of returning a blank answer", async () => {
    const bodies = [{ choices: [] }, { choices: [{ message: { content: "   " } }] }, {}, null];

    for (const body of bodies) {
      const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body });
      const provider = new OpenAiProvider("test-key", undefined, fetchImpl as unknown as FetchLike);

      await expect(provider.complete("s", "u")).rejects.toBeInstanceOf(GurmanUnavailableError);
    }
  });
});

describe("selectGurmanProvider", () => {
  it("prefers OpenAI when both keys are present", () => {
    const provider = selectGurmanProvider({ OPENAI_API_KEY: "test-openai", ANTHROPIC_API_KEY: "test-anthropic" });

    expect(provider).toBeInstanceOf(OpenAiProvider);
    expect(provider?.name).toBe("openai");
    expect(provider?.model).toBe(GURMAN_OPENAI_MODEL);
  });

  it("falls back to Anthropic when only that key is present", () => {
    const provider = selectGurmanProvider({ ANTHROPIC_API_KEY: "test-anthropic" });

    expect(provider).toBeInstanceOf(AnthropicProvider);
    expect(provider?.name).toBe("anthropic");
    expect(provider?.model).toBe(GURMAN_MODEL);
  });

  it("returns null — never throws — when neither key is present", () => {
    expect(selectGurmanProvider({})).toBeNull();
  });

  it("treats blank/whitespace keys the same as missing ones", () => {
    expect(selectGurmanProvider({ OPENAI_API_KEY: "   ", ANTHROPIC_API_KEY: "  " })).toBeNull();
    expect(selectGurmanProvider({ OPENAI_API_KEY: " ", ANTHROPIC_API_KEY: "test-anthropic" })?.name).toBe("anthropic");
  });

  it("honours model overrides per vendor", () => {
    expect(selectGurmanProvider({ OPENAI_API_KEY: "test-openai", OPENAI_MODEL: "gpt-4o" })?.model).toBe("gpt-4o");
    expect(
      selectGurmanProvider({ ANTHROPIC_API_KEY: "test-anthropic", ANTHROPIC_MODEL: "claude-haiku-4-5" })?.model
    ).toBe("claude-haiku-4-5");
  });

  it("ignores a blank model override in favour of the default", () => {
    expect(selectGurmanProvider({ OPENAI_API_KEY: "test-openai", OPENAI_MODEL: "  " })?.model).toBe(
      GURMAN_OPENAI_MODEL
    );
  });
});

describe("isGurmanConfigured", () => {
  it("is true for either key and false for neither", () => {
    expect(isGurmanConfigured({ OPENAI_API_KEY: "test-openai" })).toBe(true);
    expect(isGurmanConfigured({ ANTHROPIC_API_KEY: "test-anthropic" })).toBe(true);
    expect(isGurmanConfigured({ OPENAI_API_KEY: "test-openai", ANTHROPIC_API_KEY: "test-anthropic" })).toBe(true);
    expect(isGurmanConfigured({})).toBe(false);
    expect(isGurmanConfigured({ OPENAI_API_KEY: "  ", ANTHROPIC_API_KEY: "" })).toBe(false);
  });
});
