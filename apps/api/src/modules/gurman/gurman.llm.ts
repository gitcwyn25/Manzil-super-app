import { Injectable, Logger, Optional } from "@nestjs/common";
import {
  GurmanUnavailableError,
  selectGurmanProvider,
  type GurmanChatProvider
} from "./gurman.provider";

/** DI token. Lets a provider swap in without touching `GurmanService`. */
export const GURMAN_LLM = "GURMAN_LLM";

/**
 * What `GurmanService` depends on. Note it says nothing about a vendor: the
 * service has never known which model answers, and still does not.
 */
export interface GurmanLlm {
  complete(system: string, user: string): Promise<string>;
}

/**
 * The `GurmanLlm` implementation wired in `app.module.ts`. It owns exactly one
 * decision — which vendor answers this request — and delegates the call itself
 * to the `GurmanChatProvider` it picks.
 *
 * Fail-closed by construction rather than via a separate "unconfigured" class:
 * the provider is resolved lazily, inside `complete()`, and never in the
 * constructor. This matters because building a vendor client with no key
 * throws immediately (the Anthropic SDK's own guard) — if that happened
 * eagerly while Nest wires providers at boot, a deployment with no key would
 * crash the entire API, not just the one feature that needs it. Resolving here
 * instead means such a deployment still boots and serves every other route;
 * only a Gurman request ever discovers the gap, and it discovers it as a clean
 * `GurmanUnavailableError`.
 */
@Injectable()
export class GurmanLlmRouter implements GurmanLlm {
  private readonly logger = new Logger(GurmanLlmRouter.name);

  /** Only ever supplied by tests. Production DI always uses the zero-arg constructor. */
  constructor(@Optional() private provider?: GurmanChatProvider) {}

  async complete(system: string, user: string): Promise<string> {
    const provider = this.provider ?? this.resolveProvider();

    return provider.complete(system, user);
  }

  /**
   * Detects a missing/empty key here, at call time — never at boot. Caches the
   * resolved provider for reuse across requests once one has been seen, which
   * also pins the vendor for the life of the process: precedence is decided
   * once, so a single deployment cannot silently answer half its traffic from
   * one vendor and half from another.
   */
  private resolveProvider(): GurmanChatProvider {
    const provider = selectGurmanProvider();

    if (!provider) {
      throw new GurmanUnavailableError(
        "Gurman AI is not configured (set OPENAI_API_KEY or ANTHROPIC_API_KEY)."
      );
    }

    this.logger.log(`Gurman AI using ${provider.name} (${provider.model})`);
    this.provider = provider;
    return provider;
  }
}

/**
 * Back-compat alias for the `app.module.ts` wiring
 * (`{ provide: GURMAN_LLM, useClass: AnthropicLlm }`), which predates
 * multi-provider support.
 *
 * @deprecated Prefer `GurmanLlmRouter`. This name no longer describes what the
 * class does — it routes to OpenAI or Anthropic depending on which key is set.
 */
export const AnthropicLlm = GurmanLlmRouter;
export type AnthropicLlm = GurmanLlmRouter;
