import { Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "../cache/cache.service";
import { groundSuggestions } from "./gurman.grounding";
import { GURMAN_LLM, type GurmanLlm } from "./gurman.llm";
import { buildChatPrompt, parseModelReply } from "./gurman.prompt";
import { isGurmanConfigured } from "./gurman.provider";
import { GURMAN_RETRIEVER, type GurmanRetriever } from "./gurman.retriever";
import type { GurmanAskResult, GurmanLocale, ModelReply } from "./gurman.types";

export const GURMAN_CACHE_NS = "gurman";

/**
 * 15 minutes. A cost and freshness knob only — correctness does not depend
 * on it, because grounding re-runs on every serve, cache hit or miss.
 */
export const GURMAN_CACHE_TTL = 900;

/**
 * Returned whenever Gurman cannot produce a real, grounded answer — for any
 * reason. Never carries a business, and never carries invented prose. A
 * broken or unconfigured AI must look broken, not quietly degrade to a
 * canned answer.
 */
const UNAVAILABLE_RESULT: GurmanAskResult = { text: "", businesses: [], available: false };

@Injectable()
export class GurmanService {
  private readonly logger = new Logger(GurmanService.name);

  constructor(
    @Inject(GURMAN_RETRIEVER) private readonly retriever: GurmanRetriever,
    @Inject(GURMAN_LLM) private readonly llm: GurmanLlm,
    private readonly cache: CacheService
  ) {}

  async ask(query: string, locale: GurmanLocale): Promise<GurmanAskResult> {
    // Detected here, at call time — never at boot. A missing key must not
    // crash an API that is otherwise healthy and serving every other route;
    // it should only ever surface as this one endpoint reporting itself
    // unavailable. Checking before touching the cache, retriever, or LLM
    // also means this path never issues a database query or a network call.
    // Either vendor key satisfies this; which one is chosen is `GurmanLlm`'s
    // business, not the service's.
    if (!isGurmanConfigured()) {
      this.logger.warn("Gurman AI requested but neither OPENAI_API_KEY nor ANTHROPIC_API_KEY is configured");
      return UNAVAILABLE_RESULT;
    }

    try {
      const cached = await this.cache.getOrSet<ModelReply>(
        GURMAN_CACHE_NS,
        this.cacheKey(query, locale),
        GURMAN_CACHE_TTL,
        async () => {
          const context = await this.retriever.retrieve(query, locale);
          const { system, user } = buildChatPrompt(context, query, locale);
          return this.generate(system, user);
        }
      );

      // Grounding runs here, outside the cache loader, so it applies to
      // cache hits too. A business suspended after this entry was written
      // disappears from the very next response rather than lingering until
      // the entry expires.
      const businesses = await this.ground(cached.suggestions);

      return { text: cached.reply, businesses, available: true };
    } catch (error) {
      // Any failure along this path — a provider error, a response that
      // stayed unparseable after one retry, a retriever/database error —
      // degrades to the same honest result. There is no fallback to a
      // keyword-matched canned answer: a concierge that invents places is
      // worse than one that says it is unavailable.
      this.logger.error(`Gurman ask failed: ${(error as Error).message}`);
      return UNAVAILABLE_RESULT;
    }
  }

  /**
   * Validates model-supplied ids against rows visible right now and hydrates
   * display fields from those rows. The model never supplies a name or slug —
   * only an id — so it cannot spoof a business identity.
   */
  private async ground(raw: Array<{ businessId: string; reason: string }>) {
    const ids = raw.map((item) => item.businessId).filter(Boolean);
    const live = await this.retriever.liveBusinesses(ids);
    const { suggestions, droppedIds } = groundSuggestions(raw, live);

    if (droppedIds.length > 0) {
      // Worth a warning either way: a hallucinated id is a model problem, an
      // id that was valid at generation time is a business that has since
      // been unpublished.
      this.logger.warn(`Dropped ungrounded business ids: ${droppedIds.join(", ")}`);
    }

    return suggestions;
  }

  /**
   * One retry on a malformed response. Models occasionally wrap the JSON in
   * prose or truncate it; a single retry recovers most of those cheaply. A
   * second failure throws, which `ask()` turns into the unavailable result —
   * and because `CacheService.getOrSet` only writes on a successful loader,
   * the bad response never enters the cache.
   */
  private async generate(system: string, user: string): Promise<ModelReply> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const raw = await this.llm.complete(system, user);

      try {
        return parseModelReply(raw);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Unparseable model response (attempt ${attempt + 1}): ${lastError.message}`);
      }
    }

    throw lastError ?? new Error("Gurman AI returned a response we could not read.");
  }

  /** Case- and whitespace-insensitive, and always locale-scoped so uz/ru/en never share an entry. */
  private cacheKey(query: string, locale: GurmanLocale): string {
    const normalized = query.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200);
    return `ask:${locale}:${normalized}`;
  }
}
