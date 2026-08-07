import { Logger } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";

/** Bounds the cost of a single call. A recommendation needs prose plus a small JSON array. */
export const GURMAN_MAX_TOKENS = 700;

/**
 * Anthropic default. Pinned exactly, per the design spec — never a dated
 * snapshot alias. Overridable with `ANTHROPIC_MODEL` for an operator who
 * wants a cheaper or newer model without a deploy of new code.
 */
export const GURMAN_MODEL = "claude-sonnet-5";

/**
 * OpenAI default, overridable with `OPENAI_MODEL`.
 *
 * Deliberately a non-reasoning chat model. The GPT-5 family spends part of
 * its completion budget on hidden reasoning tokens, so under the 700-token
 * cap above it can return an empty `content` and look like an outage. A
 * straight chat model spends the whole budget on the answer, which is what
 * this pipeline needs: two sentences of prose plus a four-entry JSON array.
 */
export const GURMAN_OPENAI_MODEL = "gpt-4.1";

/** Chat Completions endpoint. Single call per request; no streaming. */
export const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

/** A hung upstream must not pin a request handler open indefinitely. */
export const GURMAN_HTTP_TIMEOUT_MS = 30_000;

export type GurmanProviderName = "openai" | "anthropic";

/**
 * The one thing Gurman needs from a model vendor: system prompt in, text out.
 *
 * Deliberately narrower than either vendor SDK. Everything that makes Gurman
 * trustworthy — retrieval, ranking, grounding, the honesty rules — lives
 * above this line and is provider-agnostic by construction. Swapping vendors
 * can change the prose; it cannot change which businesses are allowed to
 * appear, because a provider never sees the grounding layer.
 */
export interface GurmanChatProvider {
  readonly name: GurmanProviderName;
  readonly model: string;
  complete(system: string, user: string): Promise<string>;
}

/**
 * Thrown for every way Gurman can fail to produce a real answer — missing
 * key, upstream error, or an empty response. `GurmanService` catches this
 * (and any other error) and turns it into the honest `{ available: false }`
 * result; it is never allowed to propagate into a fabricated recommendation.
 */
export class GurmanUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GurmanUnavailableError";
  }
}

/** Minimal surface of the Anthropic client, so tests can substitute a double without touching the real SDK. */
export type AnthropicLike = {
  messages: {
    create(args: {
      model: string;
      max_tokens: number;
      system: string;
      messages: Array<{ role: "user"; content: string }>;
    }): Promise<{ content: Array<{ type: string; text?: string }> }>;
  };
};

/**
 * Structural stand-ins for `fetch`, declared locally rather than imported.
 *
 * Keeps the OpenAI provider testable with a plain `jest.fn()` and independent
 * of whether the DOM or Node lib supplies the global type in a given build.
 */
export type FetchResponseLike = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
  }
) => Promise<FetchResponseLike>;

/**
 * Anthropic implementation.
 *
 * The SDK client is built lazily, on first `complete()`, never in the
 * constructor: `new Anthropic()` with no key throws immediately (the SDK's
 * own guard), and a throw during Nest's provider wiring would take down an
 * API that is otherwise healthy. Everything here fails at call time so that
 * a deployment with no key still boots and serves every other route.
 */
export class AnthropicProvider implements GurmanChatProvider {
  readonly name = "anthropic" as const;

  private readonly logger = new Logger(AnthropicProvider.name);

  constructor(
    private readonly apiKey: string,
    readonly model: string = GURMAN_MODEL,
    /** Only ever supplied by tests. Production always lets the SDK client be built here. */
    private client?: AnthropicLike
  ) {}

  async complete(system: string, user: string): Promise<string> {
    const client = (this.client ??= new Anthropic({ apiKey: this.apiKey }) as unknown as AnthropicLike);

    let message: { content: Array<{ type: string; text?: string }> };

    try {
      message = await client.messages.create({
        model: this.model,
        max_tokens: GURMAN_MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }]
      });
    } catch (error) {
      // Logged in full, reported narrowly — the SDK error can carry request
      // internals that shouldn't reach a user-visible response.
      this.logger.error(`Anthropic request failed: ${(error as Error).message}`);
      throw new GurmanUnavailableError("Gurman AI is temporarily unavailable.");
    }

    const block = message.content.find((item) => item.type === "text");

    if (!block?.text) {
      this.logger.error("Anthropic response contained no text block");
      throw new GurmanUnavailableError("Gurman AI returned an empty response.");
    }

    return block.text;
  }
}

/**
 * OpenAI implementation, over the REST API with `fetch`.
 *
 * No SDK dependency: this is one unauthenticated-by-header POST to a single
 * endpoint with a JSON body, and the repo is conservative about adding
 * packages. The vendor abstraction above is what buys flexibility here, not
 * the client library.
 */
export class OpenAiProvider implements GurmanChatProvider {
  readonly name = "openai" as const;

  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(
    private readonly apiKey: string,
    readonly model: string = GURMAN_OPENAI_MODEL,
    /** Only ever supplied by tests. Production uses the global `fetch`. */
    private readonly fetchImpl: FetchLike = globalThis.fetch as unknown as FetchLike
  ) {}

  async complete(system: string, user: string): Promise<string> {
    let response: FetchResponseLike;

    try {
      response = await this.fetchImpl(OPENAI_CHAT_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          // Not `max_tokens`: that parameter is deprecated on Chat Completions
          // and is rejected outright by the newer models an operator may point
          // `OPENAI_MODEL` at. `max_completion_tokens` is accepted by both.
          max_completion_tokens: GURMAN_MAX_TOKENS,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ]
        }),
        signal: AbortSignal.timeout(GURMAN_HTTP_TIMEOUT_MS)
      });
    } catch (error) {
      this.logger.error(`OpenAI request failed: ${(error as Error).message}`);
      throw new GurmanUnavailableError("Gurman AI is temporarily unavailable.");
    }

    if (!response.ok) {
      // Status only, never the body. OpenAI's auth-failure message echoes a
      // partially redacted copy of the key that was sent; putting that in
      // application logs would leak key material.
      this.logger.error(`OpenAI request failed with status ${response.status}`);
      throw new GurmanUnavailableError("Gurman AI is temporarily unavailable.");
    }

    const text = extractOpenAiText(await response.json().catch(() => null));

    if (!text) {
      this.logger.error("OpenAI response contained no message content");
      throw new GurmanUnavailableError("Gurman AI returned an empty response.");
    }

    return text;
  }
}

/** Defensive read of `choices[0].message.content` — a malformed body must not throw a TypeError. */
function extractOpenAiText(payload: unknown): string | null {
  const choices = (payload as { choices?: unknown } | null)?.choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const content = (choices[0] as { message?: { content?: unknown } } | null)?.message?.content;

  return typeof content === "string" && content.trim().length > 0 ? content : null;
}

/**
 * Runtime provider selection, by key presence, in a fixed order:
 * `OPENAI_API_KEY` wins, then `ANTHROPIC_API_KEY`, then nothing.
 *
 * Env is read here rather than captured at boot so a key added in the
 * platform dashboard takes effect on the next process start without a code
 * change, and so a blank-string variable (a very common way to "unset" a
 * value in a hosting UI) is treated as absent rather than as a broken key.
 *
 * Returns `null` — it does not throw — because "no provider configured" is a
 * legitimate deployment state that must degrade to the honest unavailable
 * result, not to an exception.
 */
export function selectGurmanProvider(env: NodeJS.ProcessEnv = process.env): GurmanChatProvider | null {
  const openAiKey = env.OPENAI_API_KEY?.trim();

  if (openAiKey) {
    return new OpenAiProvider(openAiKey, env.OPENAI_MODEL?.trim() || GURMAN_OPENAI_MODEL);
  }

  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();

  if (anthropicKey) {
    return new AnthropicProvider(anthropicKey, env.ANTHROPIC_MODEL?.trim() || GURMAN_MODEL);
  }

  return null;
}

/**
 * Whether any provider is configured, without constructing one.
 *
 * `GurmanService` uses this to bail before touching the cache, the retriever,
 * or the network — an unconfigured deployment should never issue a database
 * query for an answer it cannot produce.
 */
export function isGurmanConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.OPENAI_API_KEY?.trim() || env.ANTHROPIC_API_KEY?.trim());
}
