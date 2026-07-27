# Gurman AI Recommender + Package Maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the concierge's keyword-matched mock with a grounded assistant whose every suggestion traces to a business row that exists and is visible right now.

**Architecture:** A new NestJS module `gurman` retrieves the whole business catalog (16 rows — no vector search needed yet), asks Claude for structured JSON containing business *ids only*, then intersects those ids against currently-visible rows and hydrates names from the database. Validation runs on the serve path, so cached and freshly-generated responses pass through the identical check.

**Tech Stack:** NestJS 11, Prisma 6, `@anthropic-ai/sdk`, `class-validator`, existing Redis `CacheService`, Jest + ts-jest, Next.js 16 App Router.

## Global Constraints

- Model id is exactly `claude-sonnet-5`. Never `claude-3-*` or a dated alias.
- The model returns **`businessId` only** — never a name or slug. Names and slugs are hydrated from live database rows so the model cannot spoof a business identity.
- Grounding runs on **every serve**, cache hit or miss. Never only at generation time.
- The cache stores **structured** results (`reply` + `businessId` + `reason`), never rendered cards or hydrated names.
- Cache TTL is **900 seconds** (15 minutes) and is a cost knob, not a correctness control.
- `ThrottleGurman` is exactly `{ limit: 10, ttl: minutes(15), blockDuration: minutes(30) }`.
- Gurman visibility excludes `status: "suspended"` and any row with a non-null `mergedIntoId`. This is deliberately stricter than `DatabaseRepository.search()`, which filters neither.
- Never fall back to `getConciergeReply` on error. A broken AI must surface as an error, never as canned answers.
- No `ANTHROPIC_API_KEY` → 503 `AI_NOT_CONFIGURED`, never generated text.
- `descriptionUz` is required; `descriptionRu`/`descriptionEn` are null for 12 of 16 rows. Never invent a translation of a description that does not exist.
- All new API files live in `apps/api/src/modules/gurman/`.
- Run API tests with `npm test --workspace apps/api`.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/api/src/modules/gurman/gurman.types.ts` | Shared types. No logic. |
| `apps/api/src/modules/gurman/gurman.grounding.ts` | Pure validator: model ids → grounded suggestions + dropped ids. |
| `apps/api/src/modules/gurman/gurman.retriever.ts` | `GurmanRetriever` interface + `CatalogRetriever`. The pgvector swap point. |
| `apps/api/src/modules/gurman/gurman.llm.ts` | `GurmanLlm` interface + `AnthropicLlm` + `UnconfiguredLlm`. |
| `apps/api/src/modules/gurman/gurman.prompt.ts` | Prompt construction + JSON parsing. |
| `apps/api/src/modules/gurman/gurman.service.ts` | Orchestration + cache + serve-path grounding. |
| `apps/api/src/modules/gurman/gurman.dto.ts` | Input validation. |
| `apps/api/src/modules/gurman/gurman.controller.ts` | `POST /gurman/chat`, `POST /gurman/package`. |
| `apps/api/src/modules/gurman/gurman.module.ts` | Wiring + provider factory. |
| `apps/api/src/modules/security/throttle.config.ts` | *Modify:* add `ThrottleGurman`. |
| `apps/web/app/components/concierge-chat.tsx` | *Modify:* async states + real API call. |

---

### Task 1: Types and the grounding validator

The anchor task. Pure functions, no database, no network — so the guarantee the whole feature rests on is testable in isolation.

**Files:**
- Create: `apps/api/src/modules/gurman/gurman.types.ts`
- Create: `apps/api/src/modules/gurman/gurman.grounding.ts`
- Test: `apps/api/src/modules/gurman/gurman.grounding.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `GurmanLocale`, `RetrievedBusiness`, `RetrievedContext`, `ModelSuggestion`, `ModelReply`, `GroundedSuggestion`, `LiveBusiness`, `GurmanChatResult`, `GurmanPackageResult`, `groundSuggestions(suggestions, live)`, `MAX_SUGGESTIONS`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/gurman/gurman.grounding.spec.ts`:

```ts
import { groundSuggestions, MAX_SUGGESTIONS } from "./gurman.grounding";
import type { LiveBusiness } from "./gurman.types";

const live = new Map<string, LiveBusiness>([
  ["biz-1", { id: "biz-1", slug: "caravan-coffee", name: "Caravan Coffee" }],
  ["biz-2", { id: "biz-2", slug: "glow-beauty", name: "Glow Beauty" }]
]);

describe("groundSuggestions", () => {
  it("drops a business id that was never retrieved", () => {
    const result = groundSuggestions(
      [{ businessId: "biz-ghost", reason: "Invented by the model" }],
      live
    );

    expect(result.suggestions).toEqual([]);
    expect(result.droppedIds).toEqual(["biz-ghost"]);
  });

  it("keeps valid ids and hydrates name and slug from live rows", () => {
    const result = groundSuggestions(
      [{ businessId: "biz-1", reason: "Quiet, good Wi-Fi" }],
      live
    );

    expect(result.suggestions).toEqual([
      {
        businessId: "biz-1",
        slug: "caravan-coffee",
        name: "Caravan Coffee",
        reason: "Quiet, good Wi-Fi"
      }
    ]);
    expect(result.droppedIds).toEqual([]);
  });

  it("keeps the valid half of a mixed response", () => {
    const result = groundSuggestions(
      [
        { businessId: "biz-1", reason: "Real" },
        { businessId: "biz-ghost", reason: "Fake" },
        { businessId: "biz-2", reason: "Real" }
      ],
      live
    );

    expect(result.suggestions.map((s) => s.businessId)).toEqual(["biz-1", "biz-2"]);
    expect(result.droppedIds).toEqual(["biz-ghost"]);
  });

  it("deduplicates a repeated id, keeping the first reason", () => {
    const result = groundSuggestions(
      [
        { businessId: "biz-1", reason: "First" },
        { businessId: "biz-1", reason: "Second" }
      ],
      live
    );

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].reason).toBe("First");
  });

  it(`caps at ${MAX_SUGGESTIONS} suggestions`, () => {
    const many = new Map<string, LiveBusiness>();
    const input = [];
    for (let i = 0; i < 10; i += 1) {
      many.set(`b${i}`, { id: `b${i}`, slug: `s${i}`, name: `N${i}` });
      input.push({ businessId: `b${i}`, reason: "r" });
    }

    expect(groundSuggestions(input, many).suggestions).toHaveLength(MAX_SUGGESTIONS);
  });

  it("drops a suggestion with a blank or non-string reason", () => {
    const result = groundSuggestions(
      [
        { businessId: "biz-1", reason: "   " },
        { businessId: "biz-2", reason: 42 as unknown as string }
      ],
      live
    );

    expect(result.suggestions).toEqual([]);
  });

  it("returns empty for an empty model response rather than throwing", () => {
    expect(groundSuggestions([], live)).toEqual({ suggestions: [], droppedIds: [] });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test --workspace apps/api -- gurman.grounding`
Expected: FAIL — `Cannot find module './gurman.grounding'`

- [ ] **Step 3: Write the types**

Create `apps/api/src/modules/gurman/gurman.types.ts`:

```ts
export type GurmanLocale = "uz" | "ru" | "en";

/** A business as handed to the model. Ids are opaque to it; it may only echo them back. */
export type RetrievedBusiness = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  district: string;
  priceTier: string | null;
  avgRating: number;
  reviewCount: number;
  /** `uz` is always present; the others are null for most rows. Never synthesise a missing one. */
  descriptions: { uz: string; ru: string | null; en: string | null };
  reviewSnippets: string[];
};

export type RetrievedContext = {
  businesses: RetrievedBusiness[];
};

/**
 * The minimum needed to render a card. Deliberately excludes anything the model
 * supplied — name and slug come from the database at serve time.
 */
export type LiveBusiness = {
  id: string;
  slug: string;
  name: string;
};

/**
 * What the model is allowed to return per suggestion.
 *
 * Note there is no `name` or `slug` field: the schema itself prevents the model
 * from asserting a business identity. It can only point at an id, and an id it
 * invents is dropped.
 */
export type ModelSuggestion = {
  businessId: string;
  reason: string;
};

export type ModelReply = {
  reply: string;
  suggestions: ModelSuggestion[];
};

export type GroundedSuggestion = {
  businessId: string;
  slug: string;
  name: string;
  reason: string;
};

export type GurmanChatResult = {
  reply: string;
  suggestions: GroundedSuggestion[];
};

export type GurmanPackageResult = {
  title: string;
  reply: string;
  stops: GroundedSuggestion[];
};
```

- [ ] **Step 4: Write the grounding validator**

Create `apps/api/src/modules/gurman/gurman.grounding.ts`:

```ts
import type { GroundedSuggestion, LiveBusiness, ModelSuggestion } from "./gurman.types";

/** Upper bound on cards shown. More than this reads as a list, not a recommendation. */
export const MAX_SUGGESTIONS = 4;

export type GroundingOutcome = {
  suggestions: GroundedSuggestion[];
  droppedIds: string[];
};

/**
 * Intersects model-returned business ids with rows that exist and are visible.
 *
 * This is the mechanical form of "every claim traces to a retrieved row".
 * Instructing a model to cite only real businesses is a request; this is a
 * guarantee. Anything the model returns that is not a live id is discarded and
 * reported, so a hallucinated business can never reach a rendered card.
 *
 * `name` and `slug` are read from `live`, never from the model — which is why
 * `ModelSuggestion` has no such fields.
 */
export function groundSuggestions(
  suggestions: ModelSuggestion[],
  live: Map<string, LiveBusiness>
): GroundingOutcome {
  const grounded: GroundedSuggestion[] = [];
  const droppedIds: string[] = [];
  const seen = new Set<string>();

  for (const suggestion of suggestions) {
    const id = typeof suggestion?.businessId === "string" ? suggestion.businessId : "";
    const reason = typeof suggestion?.reason === "string" ? suggestion.reason.trim() : "";

    if (!id || seen.has(id)) {
      continue;
    }

    const row = live.get(id);
    if (!row) {
      // Unknown id: either a hallucination, or a business unpublished since the
      // response was generated. Both must be dropped, and both are worth logging.
      droppedIds.push(id);
      seen.add(id);
      continue;
    }

    seen.add(id);

    // A card with no reason is noise; drop rather than render an empty caption.
    if (!reason) {
      continue;
    }

    grounded.push({ businessId: row.id, slug: row.slug, name: row.name, reason });

    if (grounded.length === MAX_SUGGESTIONS) {
      break;
    }
  }

  return { suggestions: grounded, droppedIds };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test --workspace apps/api -- gurman.grounding`
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/gurman/gurman.types.ts apps/api/src/modules/gurman/gurman.grounding.ts apps/api/src/modules/gurman/gurman.grounding.spec.ts
git commit -m "feat(gurman): mechanical grounding validator for model suggestions"
```

---

### Task 2: Catalog retriever

**Files:**
- Create: `apps/api/src/modules/gurman/gurman.retriever.ts`
- Test: `apps/api/src/modules/gurman/gurman.retriever.spec.ts`

**Interfaces:**
- Consumes: `RetrievedBusiness`, `RetrievedContext`, `LiveBusiness`, `GurmanLocale` from `./gurman.types`.
- Produces: `GurmanRetriever` interface with `retrieve(query: string, locale: GurmanLocale): Promise<RetrievedContext>` and `liveBusinesses(ids: string[]): Promise<Map<string, LiveBusiness>>`; class `CatalogRetriever`; const `GURMAN_RETRIEVER` injection token; const `VISIBLE_BUSINESS_WHERE`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/gurman/gurman.retriever.spec.ts`:

```ts
import { CatalogRetriever, VISIBLE_BUSINESS_WHERE } from "./gurman.retriever";

type FakePrisma = {
  business: {
    findMany: jest.Mock;
  };
};

function makePrisma(rows: unknown[]): FakePrisma {
  return { business: { findMany: jest.fn().mockResolvedValue(rows) } };
}

const row = {
  id: "biz-1",
  slug: "caravan-coffee",
  name: "Caravan Coffee",
  district: "Mirzo Ulugbek",
  priceTier: "$$",
  avgRating: { toString: () => "4.50" },
  reviewCount: 3,
  descriptionUz: "Sokin muhit",
  descriptionRu: null,
  descriptionEn: null,
  category: { name: "Coffee" },
  reviews: [{ text: "Juda yaxshi" }]
};

describe("CatalogRetriever", () => {
  it("excludes suspended and merged businesses", () => {
    expect(VISIBLE_BUSINESS_WHERE).toEqual({
      status: { not: "suspended" },
      mergedIntoId: null
    });
  });

  it("maps a row without inventing missing translations", async () => {
    const prisma = makePrisma([row]);
    const retriever = new CatalogRetriever(prisma as never);

    const context = await retriever.retrieve("quiet cafe", "ru");

    expect(context.businesses).toHaveLength(1);
    expect(context.businesses[0].descriptions).toEqual({
      uz: "Sokin muhit",
      ru: null,
      en: null
    });
    expect(context.businesses[0].avgRating).toBe(4.5);
    expect(context.businesses[0].categoryName).toBe("Coffee");
    expect(context.businesses[0].reviewSnippets).toEqual(["Juda yaxshi"]);
  });

  it("applies the visibility filter when retrieving", async () => {
    const prisma = makePrisma([]);
    const retriever = new CatalogRetriever(prisma as never);

    await retriever.retrieve("anything", "uz");

    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: VISIBLE_BUSINESS_WHERE })
    );
  });

  it("liveBusinesses returns an empty map for no ids without querying", async () => {
    const prisma = makePrisma([]);
    const retriever = new CatalogRetriever(prisma as never);

    const live = await retriever.liveBusinesses([]);

    expect(live.size).toBe(0);
    expect(prisma.business.findMany).not.toHaveBeenCalled();
  });

  it("liveBusinesses omits an id that is no longer visible", async () => {
    const prisma = makePrisma([{ id: "biz-1", slug: "caravan-coffee", name: "Caravan Coffee" }]);
    const retriever = new CatalogRetriever(prisma as never);

    const live = await retriever.liveBusinesses(["biz-1", "biz-suspended"]);

    expect(live.has("biz-1")).toBe(true);
    expect(live.has("biz-suspended")).toBe(false);
    expect(prisma.business.findMany).toHaveBeenCalledWith({
      where: { ...VISIBLE_BUSINESS_WHERE, id: { in: ["biz-1", "biz-suspended"] } },
      select: { id: true, slug: true, name: true }
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test --workspace apps/api -- gurman.retriever`
Expected: FAIL — `Cannot find module './gurman.retriever'`

- [ ] **Step 3: Write the retriever**

Create `apps/api/src/modules/gurman/gurman.retriever.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  GurmanLocale,
  LiveBusiness,
  RetrievedBusiness,
  RetrievedContext
} from "./gurman.types";

/** DI token. Lets `VectorRetriever` replace this later without touching consumers. */
export const GURMAN_RETRIEVER = "GURMAN_RETRIEVER";

/**
 * What Gurman is allowed to recommend.
 *
 * Deliberately stricter than `DatabaseRepository.search()`, which filters
 * neither status nor merge state: a business the platform has suspended
 * appearing in typed search results is a pre-existing inconsistency, but an AI
 * actively recommending it is a different and worse thing.
 */
export const VISIBLE_BUSINESS_WHERE = {
  status: { not: "suspended" },
  mergedIntoId: null
} as const;

/** Keeps prompt size bounded as the catalog grows toward the pgvector threshold. */
const MAX_REVIEW_SNIPPETS = 3;

export interface GurmanRetriever {
  retrieve(query: string, locale: GurmanLocale): Promise<RetrievedContext>;
  liveBusinesses(ids: string[]): Promise<Map<string, LiveBusiness>>;
}

/**
 * Returns the entire visible catalog.
 *
 * At 16 businesses this is strictly more accurate than vector search — it
 * retrieves everything, so there is no recall loss. Replace with a
 * `VectorRetriever` behind this same interface when active businesses exceed
 * 200 or the serialised catalog exceeds ~30 KB per request.
 */
@Injectable()
export class CatalogRetriever implements GurmanRetriever {
  constructor(private readonly prisma: PrismaService) {}

  async retrieve(_query: string, _locale: GurmanLocale): Promise<RetrievedContext> {
    const rows = await this.prisma.business.findMany({
      where: VISIBLE_BUSINESS_WHERE,
      select: {
        id: true,
        slug: true,
        name: true,
        district: true,
        priceTier: true,
        avgRating: true,
        reviewCount: true,
        descriptionUz: true,
        descriptionRu: true,
        descriptionEn: true,
        category: { select: { name: true } },
        reviews: {
          where: { moderationStatus: "approved" },
          orderBy: { createdAt: "desc" },
          take: MAX_REVIEW_SNIPPETS,
          select: { text: true }
        }
      },
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }]
    });

    return { businesses: rows.map(toRetrievedBusiness) };
  }

  /**
   * Resolves ids to rows that are visible *now*.
   *
   * Called on every serve — including cache hits — so a business suspended
   * after a response was cached disappears from the next response rather than
   * lingering until the entry expires.
   */
  async liveBusinesses(ids: string[]): Promise<Map<string, LiveBusiness>> {
    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.business.findMany({
      where: { ...VISIBLE_BUSINESS_WHERE, id: { in: ids } },
      select: { id: true, slug: true, name: true }
    });

    return new Map(rows.map((row) => [row.id, row as LiveBusiness]));
  }
}

type PrismaBusinessRow = {
  id: string;
  slug: string;
  name: string;
  district: string;
  priceTier: string | null;
  avgRating: { toString(): string };
  reviewCount: number;
  descriptionUz: string;
  descriptionRu: string | null;
  descriptionEn: string | null;
  category: { name: string } | null;
  reviews: Array<{ text: string | null }>;
};

function toRetrievedBusiness(row: PrismaBusinessRow): RetrievedBusiness {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryName: row.category?.name ?? "",
    district: row.district,
    priceTier: row.priceTier,
    // Prisma returns Decimal; Number() here rather than in the prompt so the
    // serialised context never carries a Decimal's object form.
    avgRating: Number(row.avgRating.toString()),
    reviewCount: row.reviewCount,
    descriptions: {
      uz: row.descriptionUz,
      ru: row.descriptionRu,
      en: row.descriptionEn
    },
    reviewSnippets: row.reviews
      .map((review) => review.text?.trim() ?? "")
      .filter((text) => text.length > 0)
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test --workspace apps/api -- gurman.retriever`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/gurman/gurman.retriever.ts apps/api/src/modules/gurman/gurman.retriever.spec.ts
git commit -m "feat(gurman): catalog retriever with explicit visibility filter"
```

---

### Task 3: LLM provider, fail-closed by default

**Files:**
- Create: `apps/api/src/modules/gurman/gurman.llm.ts`
- Test: `apps/api/src/modules/gurman/gurman.llm.spec.ts`
- Modify: `apps/api/package.json` (add `@anthropic-ai/sdk`)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `GurmanLlm` interface with `complete(system: string, user: string): Promise<string>`; classes `UnconfiguredLlm`, `AnthropicLlm`; const `GURMAN_LLM` injection token; const `GURMAN_MODEL`, `GURMAN_MAX_TOKENS`.

- [ ] **Step 1: Install the SDK**

```bash
npm install @anthropic-ai/sdk --workspace apps/api
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/modules/gurman/gurman.llm.spec.ts`:

```ts
import { ServiceUnavailableException, BadGatewayException } from "@nestjs/common";
import { AnthropicLlm, GURMAN_MAX_TOKENS, GURMAN_MODEL, UnconfiguredLlm } from "./gurman.llm";

describe("UnconfiguredLlm", () => {
  it("throws 503 rather than returning text", async () => {
    const llm = new UnconfiguredLlm();

    await expect(llm.complete("system", "user")).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });

  it("reports a machine-readable code so the UI can distinguish it from an outage", async () => {
    const llm = new UnconfiguredLlm();

    await expect(llm.complete("s", "u")).rejects.toMatchObject({
      response: { code: "AI_NOT_CONFIGURED" }
    });
  });
});

describe("AnthropicLlm", () => {
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

  it("throws 502 when the response carries no text block", async () => {
    const create = jest.fn().mockResolvedValue({ content: [] });
    const llm = new AnthropicLlm({ messages: { create } } as never);

    await expect(llm.complete("s", "u")).rejects.toBeInstanceOf(BadGatewayException);
  });

  it("translates an SDK failure into 502 rather than leaking the provider error", async () => {
    const create = jest.fn().mockRejectedValue(new Error("connection reset"));
    const llm = new AnthropicLlm({ messages: { create } } as never);

    await expect(llm.complete("s", "u")).rejects.toBeInstanceOf(BadGatewayException);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test --workspace apps/api -- gurman.llm`
Expected: FAIL — `Cannot find module './gurman.llm'`

- [ ] **Step 4: Write the provider**

Create `apps/api/src/modules/gurman/gurman.llm.ts`:

```ts
import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";

/** DI token. The factory in `gurman.module.ts` picks the implementation. */
export const GURMAN_LLM = "GURMAN_LLM";

export const GURMAN_MODEL = "claude-sonnet-5";

/** Bounds the cost of a single call. A recommendation needs prose plus a small JSON array. */
export const GURMAN_MAX_TOKENS = 700;

export interface GurmanLlm {
  complete(system: string, user: string): Promise<string>;
}

/**
 * The default when `ANTHROPIC_API_KEY` is absent.
 *
 * Throws rather than degrading to canned answers, matching the campaign
 * sender's fail-closed behaviour: an unconfigured system reports failure
 * instead of fabricating success. Silently falling back to the keyword mock
 * would make a misconfigured deployment look like a working one.
 */
@Injectable()
export class UnconfiguredLlm implements GurmanLlm {
  async complete(): Promise<string> {
    throw new ServiceUnavailableException({
      message: "Gurman AI is not configured.",
      code: "AI_NOT_CONFIGURED"
    });
  }
}

/** Minimal surface of the Anthropic client, so tests can substitute a double. */
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

@Injectable()
export class AnthropicLlm implements GurmanLlm {
  private readonly logger = new Logger(AnthropicLlm.name);

  constructor(private readonly client: AnthropicLike) {}

  static fromApiKey(apiKey: string): AnthropicLlm {
    return new AnthropicLlm(new Anthropic({ apiKey }) as unknown as AnthropicLike);
  }

  async complete(system: string, user: string): Promise<string> {
    let message: { content: Array<{ type: string; text?: string }> };

    try {
      message = await this.client.messages.create({
        model: GURMAN_MODEL,
        max_tokens: GURMAN_MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }]
      });
    } catch (error) {
      // Logged in full, reported narrowly: provider errors can carry request
      // details, and a 502 body is user-visible.
      this.logger.error(`Anthropic request failed: ${(error as Error).message}`);
      throw new BadGatewayException({
        message: "Gurman AI is temporarily unavailable.",
        code: "AI_UPSTREAM_ERROR"
      });
    }

    const block = message.content.find((item) => item.type === "text");

    if (!block?.text) {
      this.logger.error("Anthropic response contained no text block");
      throw new BadGatewayException({
        message: "Gurman AI returned an empty response.",
        code: "AI_EMPTY_RESPONSE"
      });
    }

    return block.text;
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test --workspace apps/api -- gurman.llm`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/api/package.json package-lock.json apps/api/src/modules/gurman/gurman.llm.ts apps/api/src/modules/gurman/gurman.llm.spec.ts
git commit -m "feat(gurman): Anthropic provider with fail-closed unconfigured default"
```

---

### Task 4: Prompt construction and response parsing

**Files:**
- Create: `apps/api/src/modules/gurman/gurman.prompt.ts`
- Test: `apps/api/src/modules/gurman/gurman.prompt.spec.ts`

**Interfaces:**
- Consumes: `RetrievedContext`, `GurmanLocale`, `ModelReply` from `./gurman.types`.
- Produces: `buildChatPrompt(context, query, locale): { system: string; user: string }`, `buildPackagePrompt(context, occasion, locale): { system: string; user: string }`, `parseModelReply(raw: string): ModelReply`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/gurman/gurman.prompt.spec.ts`:

```ts
import { buildChatPrompt, buildPackagePrompt, parseModelReply } from "./gurman.prompt";
import type { RetrievedContext } from "./gurman.types";

const context: RetrievedContext = {
  businesses: [
    {
      id: "biz-1",
      slug: "caravan-coffee",
      name: "Caravan Coffee",
      categoryName: "Coffee",
      district: "Mirzo Ulugbek",
      priceTier: "$$",
      avgRating: 4.5,
      reviewCount: 3,
      descriptions: { uz: "Sokin muhit", ru: null, en: null },
      reviewSnippets: ["Juda yaxshi"]
    }
  ]
};

describe("buildChatPrompt", () => {
  it("includes the business id so the model can cite it", () => {
    const { user } = buildChatPrompt(context, "quiet cafe", "en");
    expect(user).toContain("biz-1");
  });

  it("omits absent translations rather than emitting empty or invented ones", () => {
    const { user } = buildChatPrompt(context, "quiet cafe", "ru");

    expect(user).toContain("Sokin muhit");
    expect(user).not.toContain("ru:");
    expect(user).not.toContain("null");
  });

  it("instructs the model never to invent a translation", () => {
    const { system } = buildChatPrompt(context, "q", "ru");
    expect(system).toContain("never translate or invent");
  });

  it("names the requested reply language", () => {
    expect(buildChatPrompt(context, "q", "ru").system).toContain("Russian");
    expect(buildChatPrompt(context, "q", "uz").system).toContain("Uzbek");
    expect(buildChatPrompt(context, "q", "en").system).toContain("English");
  });

  it("forbids recommending anything outside the provided list", () => {
    const { system } = buildChatPrompt(context, "q", "en");
    expect(system).toContain("ONLY the businesses listed");
  });
});

describe("buildPackagePrompt", () => {
  it("asks for an ordered multi-stop itinerary and a title", () => {
    const { system } = buildPackagePrompt(context, "birthday", "en");

    expect(system).toContain("stops");
    expect(system).toContain("title");
  });

  it("carries the occasion into the user message", () => {
    const { user } = buildPackagePrompt(context, "birthday dinner", "en");
    expect(user).toContain("birthday dinner");
  });
});

describe("parseModelReply", () => {
  it("parses a bare JSON object", () => {
    const parsed = parseModelReply('{"reply":"hi","suggestions":[{"businessId":"b1","reason":"r"}]}');

    expect(parsed.reply).toBe("hi");
    expect(parsed.suggestions).toEqual([{ businessId: "b1", reason: "r" }]);
  });

  it("parses JSON wrapped in a markdown fence", () => {
    const parsed = parseModelReply('```json\n{"reply":"hi","suggestions":[]}\n```');
    expect(parsed.reply).toBe("hi");
  });

  it("parses JSON surrounded by prose", () => {
    const parsed = parseModelReply('Sure!\n{"reply":"hi","suggestions":[]}\nHope that helps.');
    expect(parsed.reply).toBe("hi");
  });

  it("throws on unparseable input so the caller can retry", () => {
    expect(() => parseModelReply("no json here at all")).toThrow();
  });

  it("throws when reply is missing", () => {
    expect(() => parseModelReply('{"suggestions":[]}')).toThrow();
  });

  it("defaults suggestions to an empty array when absent", () => {
    expect(parseModelReply('{"reply":"hi"}').suggestions).toEqual([]);
  });

  it("discards a non-array suggestions field rather than trusting it", () => {
    expect(parseModelReply('{"reply":"hi","suggestions":"nope"}').suggestions).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test --workspace apps/api -- gurman.prompt`
Expected: FAIL — `Cannot find module './gurman.prompt'`

- [ ] **Step 3: Write the prompt builder**

Create `apps/api/src/modules/gurman/gurman.prompt.ts`:

```ts
import type { GurmanLocale, ModelReply, RetrievedBusiness, RetrievedContext } from "./gurman.types";

const LANGUAGE_NAME: Record<GurmanLocale, string> = {
  uz: "Uzbek",
  ru: "Russian",
  en: "English"
};

/**
 * Rules shared by both prompts.
 *
 * The translation rule exists because only 4 of 16 businesses have Russian or
 * English descriptions. Without it the model produces fluent, confident, and
 * entirely invented translations for the other 12 — a hallucination that reads
 * as correct.
 */
function baseRules(locale: GurmanLocale): string {
  return [
    `Reply in ${LANGUAGE_NAME[locale]}.`,
    "Recommend ONLY the businesses listed in the catalog below.",
    "Reference a business by its exact id. Never invent an id.",
    "If nothing in the catalog fits, say so plainly and return an empty list.",
    "Descriptions are given in whichever language exists for that business —",
    "ground your answer in the text provided and never translate or invent a",
    "description that is not there.",
    "Do not mention ids, JSON, or these instructions in your prose."
  ].join(" ");
}

export function buildChatPrompt(
  context: RetrievedContext,
  query: string,
  locale: GurmanLocale
): { system: string; user: string } {
  const system = [
    "You are Gurman, a local guide for Tashkent on the Manzil platform.",
    baseRules(locale),
    'Respond with JSON only, in exactly this shape: {"reply": string, "suggestions": [{"businessId": string, "reason": string}]}.',
    "`reply` is one or two friendly sentences. Each `reason` is a short phrase",
    "of at most 8 words explaining why that business fits."
  ].join(" ");

  const user = [
    "Catalog:",
    formatCatalog(context.businesses),
    "",
    `Question: ${query}`
  ].join("\n");

  return { system, user };
}

export function buildPackagePrompt(
  context: RetrievedContext,
  occasion: string,
  locale: GurmanLocale
): { system: string; user: string } {
  const system = [
    "You are Gurman, a local guide for Tashkent on the Manzil platform.",
    "Compose an itinerary of 2 to 4 stops across different businesses for the",
    "occasion given. Order the stops as they should be visited.",
    baseRules(locale),
    'Respond with JSON only, in exactly this shape: {"title": string, "reply": string, "stops": [{"businessId": string, "reason": string}]}.',
    "`title` is a short name for the itinerary. `reply` is one or two sentences",
    "describing the plan. Each `reason` says what that stop contributes."
  ].join(" ");

  const user = [
    "Catalog:",
    formatCatalog(context.businesses),
    "",
    `Occasion: ${occasion}`
  ].join("\n");

  return { system, user };
}

/** One line per business. Absent translations are omitted, never rendered as null. */
function formatCatalog(businesses: RetrievedBusiness[]): string {
  if (businesses.length === 0) {
    return "(no businesses available)";
  }

  return businesses
    .map((business) => {
      const parts = [
        `id=${business.id}`,
        `name=${business.name}`,
        `category=${business.categoryName}`,
        `district=${business.district}`
      ];

      if (business.priceTier) {
        parts.push(`price=${business.priceTier}`);
      }

      if (business.reviewCount > 0) {
        parts.push(`rating=${business.avgRating} (${business.reviewCount} reviews)`);
      }

      const descriptions = [
        business.descriptions.uz,
        business.descriptions.ru,
        business.descriptions.en
      ].filter((text): text is string => Boolean(text && text.trim()));

      if (descriptions.length > 0) {
        parts.push(`about=${descriptions.join(" / ")}`);
      }

      if (business.reviewSnippets.length > 0) {
        parts.push(`reviews=${business.reviewSnippets.join(" | ")}`);
      }

      return `- ${parts.join(", ")}`;
    })
    .join("\n");
}

/**
 * Extracts and validates the model's JSON.
 *
 * Models wrap JSON in fences or prose often enough that a bare `JSON.parse`
 * fails on otherwise-good responses, so the outermost braces are located first.
 * Throwing on bad input is deliberate: the caller retries once, then surfaces a
 * 502. Returning a partial object here would hide the failure.
 */
export function parseModelReply(raw: string): ModelReply {
  const parsed = extractJson(raw);

  if (typeof parsed.reply !== "string" || parsed.reply.trim().length === 0) {
    throw new Error("Model response has no `reply` string");
  }

  const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

  return {
    reply: parsed.reply.trim(),
    suggestions: rawSuggestions.map((item: Record<string, unknown>) => ({
      businessId: typeof item?.businessId === "string" ? item.businessId : "",
      reason: typeof item?.reason === "string" ? item.reason : ""
    }))
  };
}

/** Same extraction, for the package shape. */
export function parsePackageReply(raw: string): {
  title: string;
  reply: string;
  stops: Array<{ businessId: string; reason: string }>;
} {
  const parsed = extractJson(raw);

  if (typeof parsed.reply !== "string" || parsed.reply.trim().length === 0) {
    throw new Error("Model response has no `reply` string");
  }

  const rawStops = Array.isArray(parsed.stops) ? parsed.stops : [];

  return {
    title: typeof parsed.title === "string" ? parsed.title.trim() : "",
    reply: parsed.reply.trim(),
    stops: rawStops.map((item: Record<string, unknown>) => ({
      businessId: typeof item?.businessId === "string" ? item.businessId : "",
      reason: typeof item?.reason === "string" ? item.reason : ""
    }))
  };
}

function extractJson(raw: string): Record<string, unknown> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model response contained no JSON object");
  }

  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test --workspace apps/api -- gurman.prompt`
Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/gurman/gurman.prompt.ts apps/api/src/modules/gurman/gurman.prompt.spec.ts
git commit -m "feat(gurman): locale-aware prompts that never invent translations"
```

---

### Task 5: Service with serve-path grounding

The task that implements the spec's central decision: cached and fresh responses pass through the same validator.

**Files:**
- Create: `apps/api/src/modules/gurman/gurman.service.ts`
- Test: `apps/api/src/modules/gurman/gurman.service.spec.ts`

**Interfaces:**
- Consumes: `GurmanRetriever` + `GURMAN_RETRIEVER` from `./gurman.retriever`; `GurmanLlm` + `GURMAN_LLM` from `./gurman.llm`; `buildChatPrompt`, `buildPackagePrompt`, `parseModelReply`, `parsePackageReply` from `./gurman.prompt`; `groundSuggestions` from `./gurman.grounding`; `CacheService` from `../cache/cache.service`.
- Produces: `GurmanService` with `chat(query: string, locale: GurmanLocale): Promise<GurmanChatResult>` and `makePackage(occasion: string, locale: GurmanLocale): Promise<GurmanPackageResult>`; consts `GURMAN_CACHE_NS`, `GURMAN_CACHE_TTL`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/gurman/gurman.service.spec.ts`:

```ts
import { BadGatewayException } from "@nestjs/common";
import { GurmanService } from "./gurman.service";
import type { LiveBusiness, RetrievedContext } from "./gurman.types";

const context: RetrievedContext = {
  businesses: [
    {
      id: "biz-1",
      slug: "caravan-coffee",
      name: "Caravan Coffee",
      categoryName: "Coffee",
      district: "Mirzo Ulugbek",
      priceTier: "$$",
      avgRating: 4.5,
      reviewCount: 3,
      descriptions: { uz: "Sokin muhit", ru: null, en: null },
      reviewSnippets: []
    }
  ]
};

/** Passes values straight through, so the service's own caching is what is tested. */
function passthroughCache() {
  return {
    getOrSet: jest.fn(async (_ns: string, _key: string, _ttl: number, loader: () => Promise<unknown>) =>
      loader()
    )
  };
}

/** Returns a fixed cached value without calling the loader — simulates a cache hit. */
function hitCache(value: unknown) {
  return { getOrSet: jest.fn(async () => value) };
}

function makeRetriever(live: Array<[string, LiveBusiness]>) {
  return {
    retrieve: jest.fn().mockResolvedValue(context),
    liveBusinesses: jest.fn().mockResolvedValue(new Map(live))
  };
}

const LIVE_BIZ_1: [string, LiveBusiness] = [
  "biz-1",
  { id: "biz-1", slug: "caravan-coffee", name: "Caravan Coffee" }
];

describe("GurmanService.chat", () => {
  it("returns grounded suggestions for a valid model response", async () => {
    const llm = {
      complete: jest.fn().mockResolvedValue(
        '{"reply":"Try Caravan.","suggestions":[{"businessId":"biz-1","reason":"Quiet"}]}'
      )
    };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.chat("quiet cafe", "en");

    expect(result.reply).toBe("Try Caravan.");
    expect(result.suggestions).toEqual([
      { businessId: "biz-1", slug: "caravan-coffee", name: "Caravan Coffee", reason: "Quiet" }
    ]);
  });

  it("drops a hallucinated id, keeping the prose", async () => {
    const llm = {
      complete: jest.fn().mockResolvedValue(
        '{"reply":"Try Ghost Cafe.","suggestions":[{"businessId":"biz-ghost","reason":"Invented"}]}'
      )
    };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.chat("anything", "en");

    expect(result.suggestions).toEqual([]);
    expect(result.reply).toBe("Try Ghost Cafe.");
  });

  it("re-validates on a cache hit, dropping a business unpublished since caching", async () => {
    const cached = {
      reply: "Try Caravan.",
      suggestions: [{ businessId: "biz-1", reason: "Quiet" }]
    };
    // Retriever reports no live rows: the business was suspended after caching.
    const retriever = makeRetriever([]);
    const llm = { complete: jest.fn() };
    const service = new GurmanService(retriever as never, llm as never, hitCache(cached) as never);

    const result = await service.chat("quiet cafe", "en");

    expect(result.suggestions).toEqual([]);
    expect(llm.complete).not.toHaveBeenCalled();
    expect(retriever.liveBusinesses).toHaveBeenCalledWith(["biz-1"]);
  });

  it("retries once on unparseable JSON, then succeeds", async () => {
    const llm = {
      complete: jest
        .fn()
        .mockResolvedValueOnce("not json")
        .mockResolvedValueOnce('{"reply":"Recovered.","suggestions":[]}')
    };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.chat("q", "en");

    expect(result.reply).toBe("Recovered.");
    expect(llm.complete).toHaveBeenCalledTimes(2);
  });

  it("throws 502 when both attempts are unparseable", async () => {
    const llm = { complete: jest.fn().mockResolvedValue("still not json") };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    await expect(service.chat("q", "en")).rejects.toBeInstanceOf(BadGatewayException);
    expect(llm.complete).toHaveBeenCalledTimes(2);
  });

  it("caches per locale so languages never share an entry", async () => {
    const cache = passthroughCache();
    const llm = { complete: jest.fn().mockResolvedValue('{"reply":"hi","suggestions":[]}') };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, cache as never);

    await service.chat("Same Question", "en");
    await service.chat("same question", "ru");

    const [firstKey, secondKey] = cache.getOrSet.mock.calls.map((call) => call[1]);
    expect(firstKey).not.toBe(secondKey);
    expect(firstKey).toContain("en:");
    expect(secondKey).toContain("ru:");
  });

  it("normalises case and whitespace into one cache key", async () => {
    const cache = passthroughCache();
    const llm = { complete: jest.fn().mockResolvedValue('{"reply":"hi","suggestions":[]}') };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, cache as never);

    await service.chat("  Quiet   Cafe ", "en");
    await service.chat("quiet cafe", "en");

    const [firstKey, secondKey] = cache.getOrSet.mock.calls.map((call) => call[1]);
    expect(firstKey).toBe(secondKey);
  });
});

describe("GurmanService.makePackage", () => {
  it("returns only grounded stops", async () => {
    const llm = {
      complete: jest.fn().mockResolvedValue(
        '{"title":"Birthday","reply":"Start with coffee.","stops":[{"businessId":"biz-1","reason":"Coffee"},{"businessId":"biz-ghost","reason":"Fake"}]}'
      )
    };
    const service = new GurmanService(makeRetriever([LIVE_BIZ_1]) as never, llm as never, passthroughCache() as never);

    const result = await service.makePackage("birthday", "en");

    expect(result.title).toBe("Birthday");
    expect(result.stops).toHaveLength(1);
    expect(result.stops[0].slug).toBe("caravan-coffee");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test --workspace apps/api -- gurman.service`
Expected: FAIL — `Cannot find module './gurman.service'`

- [ ] **Step 3: Write the service**

Create `apps/api/src/modules/gurman/gurman.service.ts`:

```ts
import { BadGatewayException, Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "../cache/cache.service";
import { groundSuggestions } from "./gurman.grounding";
import { GURMAN_LLM, type GurmanLlm } from "./gurman.llm";
import {
  buildChatPrompt,
  buildPackagePrompt,
  parseModelReply,
  parsePackageReply
} from "./gurman.prompt";
import { GURMAN_RETRIEVER, type GurmanRetriever } from "./gurman.retriever";
import type {
  GurmanChatResult,
  GurmanLocale,
  GurmanPackageResult,
  ModelReply
} from "./gurman.types";

export const GURMAN_CACHE_NS = "gurman";

/**
 * 15 minutes. A cost and freshness knob only — correctness does not depend on
 * it, because grounding re-runs on every serve including cache hits.
 */
export const GURMAN_CACHE_TTL = 900;

type CachedPackage = {
  title: string;
  reply: string;
  stops: Array<{ businessId: string; reason: string }>;
};

@Injectable()
export class GurmanService {
  private readonly logger = new Logger(GurmanService.name);

  constructor(
    @Inject(GURMAN_RETRIEVER) private readonly retriever: GurmanRetriever,
    @Inject(GURMAN_LLM) private readonly llm: GurmanLlm,
    private readonly cache: CacheService
  ) {}

  async chat(query: string, locale: GurmanLocale): Promise<GurmanChatResult> {
    const cached = await this.cache.getOrSet<ModelReply>(
      GURMAN_CACHE_NS,
      this.cacheKey("chat", query, locale),
      GURMAN_CACHE_TTL,
      async () => {
        const context = await this.retriever.retrieve(query, locale);
        const { system, user } = buildChatPrompt(context, query, locale);
        return this.generate(system, user, parseModelReply);
      }
    );

    // Grounding runs here, outside the loader, so it applies to cache hits too.
    // Doing it inside the loader would validate against the catalog as it stood
    // when the entry was written and leave a stale suggestion live until expiry.
    const suggestions = await this.ground(cached.suggestions);

    return { reply: cached.reply, suggestions };
  }

  async makePackage(occasion: string, locale: GurmanLocale): Promise<GurmanPackageResult> {
    const cached = await this.cache.getOrSet<CachedPackage>(
      GURMAN_CACHE_NS,
      this.cacheKey("package", occasion, locale),
      GURMAN_CACHE_TTL,
      async () => {
        const context = await this.retriever.retrieve(occasion, locale);
        const { system, user } = buildPackagePrompt(context, occasion, locale);
        return this.generate(system, user, parsePackageReply);
      }
    );

    return {
      title: cached.title,
      reply: cached.reply,
      stops: await this.ground(cached.stops)
    };
  }

  /**
   * Validates model-supplied ids against rows visible right now and hydrates
   * display fields from those rows.
   */
  private async ground(raw: Array<{ businessId: string; reason: string }>) {
    const ids = raw.map((item) => item.businessId).filter(Boolean);
    const live = await this.retriever.liveBusinesses(ids);
    const { suggestions, droppedIds } = groundSuggestions(raw, live);

    if (droppedIds.length > 0) {
      // Worth a warning either way: a hallucinated id is a model problem, an id
      // that was valid at generation time is a business that has since gone.
      this.logger.warn(`Dropped ungrounded business ids: ${droppedIds.join(", ")}`);
    }

    return suggestions;
  }

  /**
   * One retry on a malformed response.
   *
   * Models occasionally emit prose around the JSON or truncate it. A single
   * retry recovers most of those cheaply; a second failure is a real fault and
   * surfaces as 502 rather than an empty-but-successful answer. Throwing also
   * keeps the bad response out of the cache, since `getOrSet` writes only on
   * a successful loader.
   */
  private async generate<T>(system: string, user: string, parse: (raw: string) => T): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const raw = await this.llm.complete(system, user);

      try {
        return parse(raw);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Unparseable model response (attempt ${attempt + 1}): ${lastError.message}`);
      }
    }

    throw new BadGatewayException({
      message: "Gurman AI returned a response we could not read.",
      code: "AI_UNPARSEABLE_RESPONSE"
    });
  }

  /** Case- and whitespace-insensitive, and always locale-scoped. */
  private cacheKey(kind: string, input: string, locale: GurmanLocale): string {
    const normalized = input.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200);
    return `${kind}:${locale}:${normalized}`;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test --workspace apps/api -- gurman.service`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/gurman/gurman.service.ts apps/api/src/modules/gurman/gurman.service.spec.ts
git commit -m "feat(gurman): service grounding cached and fresh responses identically"
```

---

### Task 6: Controller, DTOs, throttle, and module wiring

**Files:**
- Create: `apps/api/src/modules/gurman/gurman.dto.ts`
- Create: `apps/api/src/modules/gurman/gurman.controller.ts`
- Create: `apps/api/src/modules/gurman/gurman.module.ts`
- Create: `apps/api/src/modules/gurman/gurman.dto.spec.ts`
- Modify: `apps/api/src/modules/security/throttle.config.ts`
- Modify: `apps/api/src/modules/app.module.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `GurmanService` from `./gurman.service`; `CatalogRetriever` + `GURMAN_RETRIEVER` from `./gurman.retriever`; `AnthropicLlm`, `UnconfiguredLlm`, `GURMAN_LLM` from `./gurman.llm`.
- Produces: `GurmanChatDto` (`message: string`, `locale: GurmanLocale`), `GurmanPackageDto` (`occasion: string`, `locale: GurmanLocale`), `GurmanController`, `GurmanModule`, `ThrottleGurman()`.

- [ ] **Step 1: Add the throttle tier**

In `apps/api/src/modules/security/throttle.config.ts`, add after `ThrottleUpload`:

```ts
/**
 * Gurman AI. Tight because every request bills a paid LLM call.
 *
 * `/concierge` is public, so this is the primary cost ceiling rather than a
 * secondary control. Note `ManzilThrottlerGuard` keys on client IP — it runs
 * before `ManzilAuthGuard`, so no verified actor exists yet. Uzbek mobile
 * carriers NAT heavily, so one bucket can cover many real users and the
 * effective per-person limit is stricter than 10. Deliberately conservative
 * until real usage data exists; revisit with 429 rates from production.
 */
export const ThrottleGurman = () =>
  Throttle({ default: { limit: 10, ttl: minutes(15), blockDuration: minutes(30) } });
```

- [ ] **Step 2: Write the failing DTO test**

Create `apps/api/src/modules/gurman/gurman.dto.spec.ts`:

```ts
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { GurmanChatDto, GurmanPackageDto } from "./gurman.dto";

function errorsFor(dto: object, payload: object) {
  return validateSync(plainToInstance(dto as never, payload) as object);
}

describe("GurmanChatDto", () => {
  it("accepts a valid message and locale", () => {
    expect(errorsFor(GurmanChatDto, { message: "quiet cafe", locale: "uz" })).toHaveLength(0);
  });

  it("rejects an empty message", () => {
    expect(errorsFor(GurmanChatDto, { message: "", locale: "uz" }).length).toBeGreaterThan(0);
  });

  it("rejects a message over 500 characters, which would inflate token cost", () => {
    const errors = errorsFor(GurmanChatDto, { message: "x".repeat(501), locale: "uz" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("accepts exactly 500 characters", () => {
    expect(errorsFor(GurmanChatDto, { message: "x".repeat(500), locale: "uz" })).toHaveLength(0);
  });

  it("rejects an unsupported locale", () => {
    expect(errorsFor(GurmanChatDto, { message: "hi", locale: "fr" }).length).toBeGreaterThan(0);
  });

  it("rejects a non-string message", () => {
    expect(errorsFor(GurmanChatDto, { message: 42, locale: "uz" }).length).toBeGreaterThan(0);
  });
});

describe("GurmanPackageDto", () => {
  it("accepts a valid occasion", () => {
    expect(errorsFor(GurmanPackageDto, { occasion: "birthday", locale: "ru" })).toHaveLength(0);
  });

  it("rejects an occasion over 200 characters", () => {
    expect(
      errorsFor(GurmanPackageDto, { occasion: "x".repeat(201), locale: "ru" }).length
    ).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test --workspace apps/api -- gurman.dto`
Expected: FAIL — `Cannot find module './gurman.dto'`

- [ ] **Step 4: Write the DTOs**

Create `apps/api/src/modules/gurman/gurman.dto.ts`:

```ts
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import type { GurmanLocale } from "./gurman.types";

const LOCALES: GurmanLocale[] = ["uz", "ru", "en"];

/**
 * Length caps are a cost control, not just hygiene: input tokens are billed, so
 * an uncapped field lets one request inflate the bill regardless of the
 * per-request rate limit.
 */
export class GurmanChatDto {
  @IsString()
  @MinLength(1, { message: "Message cannot be empty" })
  @MaxLength(500)
  message!: string;

  @IsIn(LOCALES)
  locale!: GurmanLocale;
}

export class GurmanPackageDto {
  @IsString()
  @MinLength(1, { message: "Occasion cannot be empty" })
  @MaxLength(200)
  occasion!: string;

  @IsIn(LOCALES)
  locale!: GurmanLocale;
}
```

- [ ] **Step 5: Run the DTO test to verify it passes**

Run: `npm test --workspace apps/api -- gurman.dto`
Expected: PASS, 8 tests.

- [ ] **Step 6: Write the controller**

Create `apps/api/src/modules/gurman/gurman.controller.ts`:

```ts
import { Body, Controller, Post } from "@nestjs/common";
import { ThrottleGurman } from "../security/throttle.config";
import { GurmanChatDto, GurmanPackageDto } from "./gurman.dto";
import { GurmanService } from "./gurman.service";

@Controller("gurman")
export class GurmanController {
  constructor(private readonly gurman: GurmanService) {}

  @Post("chat")
  @ThrottleGurman()
  async chat(@Body() body: GurmanChatDto) {
    return { data: await this.gurman.chat(body.message, body.locale) };
  }

  @Post("package")
  @ThrottleGurman()
  async makePackage(@Body() body: GurmanPackageDto) {
    return { data: await this.gurman.makePackage(body.occasion, body.locale) };
  }
}
```

- [ ] **Step 7: Write the module**

Create `apps/api/src/modules/gurman/gurman.module.ts`:

```ts
import { Logger, Module } from "@nestjs/common";
import { CacheModule } from "../cache/cache.module";
import { PrismaService } from "../prisma.service";
import { GurmanController } from "./gurman.controller";
import { AnthropicLlm, GURMAN_LLM, UnconfiguredLlm } from "./gurman.llm";
import { CatalogRetriever, GURMAN_RETRIEVER } from "./gurman.retriever";
import { GurmanService } from "./gurman.service";

// `CacheModule` is `@Global()`, so `CacheService` injects without importing it.
// Importing it here would be redundant, not harmful — but it would suggest the
// module is not global and invite someone to copy that mistake.
@Module({
  controllers: [GurmanController],
  providers: [
    PrismaService,
    GurmanService,
    { provide: GURMAN_RETRIEVER, useClass: CatalogRetriever },
    {
      provide: GURMAN_LLM,
      useFactory: () => {
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
          // Logged loudly at boot: without this, a missing key looks like a
          // runtime outage later instead of a configuration gap now.
          new Logger("GurmanModule").warn(
            "ANTHROPIC_API_KEY not set — Gurman AI will return 503 AI_NOT_CONFIGURED"
          );
          return new UnconfiguredLlm();
        }

        return AnthropicLlm.fromApiKey(apiKey);
      }
    }
  ]
})
export class GurmanModule {}
```

- [ ] **Step 8: Register the module**

In `apps/api/src/modules/app.module.ts`, add `import { GurmanModule } from "./gurman/gurman.module";` with the other module imports, and add `GurmanModule` to the `imports` array (after `CacheModule`).

- [ ] **Step 9: Document the variable**

In `.env.example`, add after the Campaign delivery block:

```
# Gurman AI. Without this the API returns 503 AI_NOT_CONFIGURED for /gurman/*
# rather than falling back to canned replies.
ANTHROPIC_API_KEY=
```

- [ ] **Step 10: Verify the app boots and the route is registered**

Run: `npm run build --workspace apps/api`
Expected: build succeeds.

Run: `npm test --workspace apps/api`
Expected: all suites pass.

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/modules/gurman/ apps/api/src/modules/security/throttle.config.ts apps/api/src/modules/app.module.ts .env.example
git commit -m "feat(gurman): chat and package endpoints with cost-controlled throttling"
```

---

### Task 7: Wire the concierge UI to the real endpoint

**Files:**
- Modify: `apps/web/app/components/concierge-chat.tsx`

**Interfaces:**
- Consumes: `POST /gurman/chat` returning `{ data: { reply: string, suggestions: Array<{ businessId, slug, name, reason }> } }`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the synchronous mock with an async call**

The current component calls `getConciergeReply(text)` synchronously and has no loading, error, or pending state. Replace the body of `apps/web/app/components/concierge-chat.tsx` with:

```tsx
"use client";

import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { useState } from "react";
import { pickLocalized } from "../lib/locale-text";

type Suggestion = {
  businessId: string;
  slug: string;
  name: string;
  reason: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestions?: Suggestion[];
};

type ErrorKind = "unconfigured" | "rate_limited" | "upstream";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Distinguishes the three failures a user can actually act on differently:
 * a missing key is permanent until someone configures it, a 429 resolves with
 * time, and everything else is worth retrying now.
 */
function errorKindFor(status: number, code?: string): ErrorKind {
  if (status === 503 || code === "AI_NOT_CONFIGURED") {
    return "unconfigured";
  }
  if (status === 429) {
    return "rate_limited";
  }
  return "upstream";
}

export function ConciergeChat({
  locale,
  prompts
}: {
  locale: Locale;
  prompts: Array<{ uz: string; ru: string; en: string }>;
}) {
  const copy = getUiCopy(locale);

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ErrorKind | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: copy.concierge.welcome }
  ]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    // Guarding on `pending` matters more than usual here: every submission
    // bills an LLM call and counts against a 10-per-15-minute limit.
    if (!text || pending) {
      return;
    }

    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text }]);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/gurman/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, locale })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(errorKindFor(response.status, body?.code ?? body?.message?.code));
        return;
      }

      const body = await response.json();
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: body.data.reply,
          suggestions: body.data.suggestions
        }
      ]);
    } catch {
      setError("upstream");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="concierge-shell">
      <div className="concierge-messages" aria-live="polite" aria-busy={pending}>
        {messages.map((message) => (
          <article className={`concierge-message ${message.role}`} key={message.id}>
            <p>{message.text}</p>
            {message.suggestions?.length ? (
              <div className="concierge-suggestions">
                {message.suggestions.map((suggestion) => (
                  <a
                    className="concierge-suggestion"
                    href={`/${locale}/businesses/${suggestion.slug}`}
                    key={suggestion.businessId}
                  >
                    <strong>{suggestion.name}</strong>
                    <span>{suggestion.reason}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        ))}

        {pending ? (
          <article className="concierge-message assistant concierge-message--pending">
            <p>{copy.concierge.thinking}</p>
          </article>
        ) : null}

        {error ? (
          <article className="concierge-message assistant concierge-message--error" role="alert">
            <p>{copy.concierge.errors[error]}</p>
          </article>
        ) : null}
      </div>

      <div className="concierge-prompts no-scrollbar">
        {prompts.map((prompt) => (
          <button
            className="concierge-prompt"
            key={pickLocalized(prompt, locale)}
            type="button"
            disabled={pending}
            onClick={() => sendMessage(pickLocalized(prompt, locale))}
          >
            {pickLocalized(prompt, locale)}
          </button>
        ))}
      </div>

      <form
        className="concierge-form"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          placeholder={copy.concierge.placeholder}
          value={input}
          maxLength={500}
          disabled={pending}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="primary-button" type="submit" disabled={pending || !input.trim()}>
          {copy.concierge.send}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Add the copy strings**

`packages/shared/src/ui-copy.ts` uses a `localize(L(uz, ru, en), locale)` helper —
**not** one object per locale. Follow that existing pattern exactly.

In the `concierge` block (around line 113), add `thinking` and `errors` after
the existing `send` entry:

```ts
      send: localize(L("Yuborish", "Отправить", "Send"), locale),
      thinking: localize(
        L("Gurman o'ylayapti...", "Гурман думает...", "Gurman is thinking..."),
        locale
      ),
      errors: {
        unconfigured: localize(
          L(
            "Gurman AI hozircha sozlanmagan.",
            "Gurman AI пока не настроен.",
            "Gurman AI is not configured yet."
          ),
          locale
        ),
        rate_limited: localize(
          L(
            "Juda ko'p so'rov. Bir necha daqiqadan keyin urinib ko'ring.",
            "Слишком много запросов. Попробуйте через несколько минут.",
            "Too many requests. Try again in a few minutes."
          ),
          locale
        ),
        upstream: localize(
          L(
            "Gurman javob bera olmadi. Qayta urinib ko'ring.",
            "Гурман не смог ответить. Попробуйте ещё раз.",
            "Gurman could not answer. Please try again."
          ),
          locale
        )
      }
```

Also replace the `subtitle` at lines 116-123. It currently advertises the mock
in all three languages ("mock AI hozir javob beradi" / "mock AI ответит сейчас"
/ "mock AI responds now"), which stops being true the moment this ships:

```ts
      subtitle: localize(
        L(
          "\"5 soat ishlaydigan sokin kafe\" yoki \"4 kishi uchun 300,000 so'm\" — Gurman haqiqiy joylardan tavsiya qiladi.",
          "\"Тихое кафе на 5 часов\" или \"300 000 сум на 4 человека\" — Гурман подберёт из реальных мест.",
          "\"Quiet café for 5 hours\" or \"300,000 UZS for 4 people\" — Gurman recommends from real listings."
        ),
        locale
      ),
```

- [ ] **Step 3: Update the call site**

`ConciergeChat` no longer takes a `businesses` prop — names arrive from the API
already hydrated by the grounding step. `businesses` is used nowhere else on
this page (only at line 22), so the `getBusinesses()` fetch goes too: the page
stops pulling the entire business list on every render.

Replace `apps/web/app/[locale]/concierge/page.tsx` in full:

```tsx
import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { ConciergeChat } from "../../components/concierge-chat";
import { getConciergePrompts } from "../../lib/api";

export default async function ConciergePage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getUiCopy(locale);
  const prompts = await getConciergePrompts();

  return (
    <section className="section-block container concierge-page">
      <div className="section-heading">
        <p className="section-kicker">{copy.concierge.kicker}</p>
        <h1>{copy.concierge.title}</h1>
        <p>{copy.concierge.subtitle}</p>
      </div>
      <ConciergeChat locale={locale} prompts={prompts} />
    </section>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build --workspace apps/web`
Expected: build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/components/concierge-chat.tsx apps/web/app/[locale]/concierge/page.tsx packages/shared/src/ui-copy.ts
git commit -m "feat(gurman): wire concierge UI to the grounded endpoint with async states"
```

---

### Task 8: Mark the mock deprecated and document the module

**The mock cannot be deleted.** `apps/mobile/src/screens/ConciergeScreen.tsx`
imports `getConciergeReply` at line 6 and calls it at line 45. Removing it would
break the mobile build, and wiring mobile to `/gurman/chat` is out of scope
here. So it stays, clearly marked, rather than being quietly left to look like
live code.

**Files:**
- Modify: `packages/shared/src/platform-data.ts` (deprecation notice on `getConciergeReply`)
- Create: `apps/api/src/modules/gurman/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Confirm who still depends on the mock**

Run: `grep -rn "getConciergeReply" --include=*.ts --include=*.tsx . | grep -v node_modules`

Expected after Task 7: `packages/shared/src/platform-data.ts` (the definition)
and `apps/mobile/src/screens/ConciergeScreen.tsx` (lines 6 and 45). The web
concierge must **no longer** appear — if it does, Task 7 Step 3 was not finished.

- [ ] **Step 2: Mark it deprecated**

Add this doc comment directly above `export function getConciergeReply` in
`packages/shared/src/platform-data.ts`. Change no behaviour — mobile still calls it.

```ts
/**
 * @deprecated Mock concierge. Matches `String.includes` against hardcoded
 * slugs, so it can only ever return the three seed businesses regardless of
 * what is in the database.
 *
 * The web concierge no longer uses this — it calls `POST /gurman/chat`, which
 * grounds every suggestion in live rows. Only
 * `apps/mobile/src/screens/ConciergeScreen.tsx` still depends on it, which is
 * the sole reason it has not been deleted. Remove it once mobile is wired to
 * the same endpoint.
 */
```

- [ ] **Step 3: Write the module README**

Create `apps/api/src/modules/gurman/README.md`:

```markdown
# Gurman AI

Grounded recommender and package maker. Every suggestion traces to a business
row that exists and is visible at the moment the response is served.

## How grounding works

The model never returns a business name or slug — only an id (`ModelSuggestion`
has no other fields). `groundSuggestions` intersects those ids with rows that
are visible now, drops the rest, and hydrates name and slug from the database.

Validation runs on the **serve path**, so a cache hit and a fresh generation go
through the same check. A business suspended after a response was cached is
absent from the very next response; the 15-minute TTL is a cost knob, not a
correctness control.

**Known residual:** the generated prose is cached text and may still name a
business that has since been unpublished. Prose carries no links and the TTL
bounds it. Regenerating prose per request would defeat the cache.

## Retrieval

`CatalogRetriever` returns the whole visible catalog. At this corpus size that
is strictly more accurate than vector search — nothing is missed. Swap in a
`VectorRetriever` behind `GurmanRetriever` when active businesses exceed 200 or
the serialised catalog exceeds ~30 KB per request. `pgvector` 0.8.2 is available
on the Supabase instance but not installed.

Visibility excludes `suspended` and merged rows — deliberately stricter than
`DatabaseRepository.search()`, which filters neither.

## Configuration

| Variable | Required | Effect when absent |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Every `/gurman/*` call returns 503 `AI_NOT_CONFIGURED`. Never falls back to canned replies. |

Model is pinned to `claude-sonnet-5`, capped at 700 output tokens.

## Rate limiting

`ThrottleGurman` — 10 per 15 minutes, 30-minute block. `/concierge` is public,
so this is the primary cost ceiling. Keyed by IP (see `ManzilThrottlerGuard`),
which under carrier NAT can cover several real users. Revisit with production
429 rates.
```

- [ ] **Step 4: Verify everything still builds and passes**

Run: `npm run build --workspace apps/web && npm test --workspace apps/api`
Expected: build succeeds, all suites pass.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/platform-data.ts apps/api/src/modules/gurman/README.md
git commit -m "docs(gurman): deprecate the keyword mock and document the module"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| `GurmanRetriever` interface + catalog implementation | 2 |
| Swap trigger documented (200 businesses / ~30 KB) | 2, 8 |
| Model returns ids only; names hydrated from DB | 1 |
| Grounding drops unretrieved ids and logs them | 1, 5 |
| Grounding on the serve path, cache hit included | 5 |
| Cache stores structured results, 900s TTL | 5 |
| Multilingual: never invent a missing translation | 4 |
| `ThrottleGurman` 10/15min/30min block | 6 |
| `@MaxLength(500)` input cap | 6 |
| `max_tokens` cap | 3 |
| 503 when unconfigured, never generated text | 3 |
| 502 on upstream error; one retry on bad JSON | 3, 5 |
| No fallback to the keyword mock | 7, 8 |
| Frontend async states | 7 |
| Package maker across businesses | 4, 5, 6 |
| Visibility stricter than `search()` | 2 |

All six spec test requirements map to tasks 1, 2, 3, 5, and 6.

**Placeholder scan:** none — every step carries the code or the exact command.

**Type consistency:** `GurmanLocale`, `ModelSuggestion`, `LiveBusiness`, `GroundedSuggestion`, and `RetrievedContext` are defined once in Task 1 and used unchanged in Tasks 2, 4, 5, 6. `liveBusinesses(ids)` has the same signature in Tasks 2 and 5. `complete(system, user)` matches across Tasks 3 and 5. `GURMAN_RETRIEVER` and `GURMAN_LLM` tokens are defined in Tasks 2 and 3 and injected in Task 5, provided in Task 6.

**Known gap, deliberate:** `apps/mobile/src/screens/ConciergeScreen.tsx` imports `getConciergeReply` (line 6, called at line 45), so the mock stays and is marked `@deprecated` in Task 8 rather than deleted. Mobile therefore keeps its keyword-matched concierge until it is wired to `/gurman/chat` — a separate piece of work, not covered here. Verified against the codebase, not assumed.

**Verified before handoff:** `CacheModule` is `@Global()` (so `GurmanModule` does not import it), `ui-copy.ts` uses the `localize(L(uz, ru, en), locale)` helper rather than per-locale objects, and the existing concierge `subtitle` advertises "mock AI" in all three languages and is replaced in Task 7 Step 2.
