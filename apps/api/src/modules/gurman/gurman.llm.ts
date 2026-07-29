import { Injectable, Logger, Optional } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";

/** DI token. Lets a future provider swap in without touching `GurmanService`. */
export const GURMAN_LLM = "GURMAN_LLM";

/**
 * Pinned exactly, per the design spec — never a dated snapshot alias.
 * Matches the model this session itself runs on (`claude-sonnet-5`).
 */
export const GURMAN_MODEL = "claude-sonnet-5";

/** Bounds the cost of a single call. A recommendation needs prose plus a small JSON array. */
export const GURMAN_MAX_TOKENS = 700;

export interface GurmanLlm {
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
type AnthropicLike = {
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
 * The only `GurmanLlm` implementation. Fail-closed by construction rather
 * than via a separate "unconfigured" class: the Anthropic client is built
 * lazily, inside `complete()`, and never in the constructor.
 *
 * This matters because `new Anthropic()` with no key throws immediately (the
 * SDK's own guard) — if that construction happened eagerly while Nest wires
 * providers at boot, a missing `ANTHROPIC_API_KEY` would crash the entire API,
 * not just the one feature that needs it. Checking here instead means a
 * deployment with no key still boots and serves every other route; only a
 * Gurman request ever discovers the gap, and it discovers it as a clean
 * `GurmanUnavailableError` rather than a startup crash.
 */
@Injectable()
export class AnthropicLlm implements GurmanLlm {
  private readonly logger = new Logger(AnthropicLlm.name);

  /** Only ever supplied by tests. Production DI always uses the zero-arg constructor. */
  constructor(@Optional() private client?: AnthropicLike) {}

  async complete(system: string, user: string): Promise<string> {
    const client = this.client ?? this.buildClient();

    let message: { content: Array<{ type: string; text?: string }> };

    try {
      message = await client.messages.create({
        model: GURMAN_MODEL,
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

  /**
   * Detects a missing/empty key here, at call time — never at boot. Caches
   * the constructed client for reuse across requests once a valid key has
   * been seen.
   */
  private buildClient(): AnthropicLike {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (!apiKey) {
      throw new GurmanUnavailableError("Gurman AI is not configured (ANTHROPIC_API_KEY is missing).");
    }

    const client = new Anthropic({ apiKey }) as unknown as AnthropicLike;
    this.client = client;
    return client;
  }
}
