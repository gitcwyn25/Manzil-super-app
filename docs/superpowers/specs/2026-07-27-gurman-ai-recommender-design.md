# Gurman AI — recommender and package maker

**Date:** 2026-07-27 · **Status:** approved, not yet implemented
**Supersedes:** the retrieval-first ordering in the original Gurman AI prompt

## Goal

Replace the concierge's keyword-matched mock with a real, grounded assistant that
recommends businesses and composes cross-business packages — where every
suggestion it shows traces to a row that exists in the database right now.

## Why the original phase order changed

The prompt's architecture was sound for the dataset it assumed. The dataset does
not exist yet. Measured 2026-07-27:

| | Count | Content |
|---|---|---|
| Businesses | 16 (4 claimed, 3 pending_claim, 9 unclaimed) | `descriptionUz` 35–81 chars; only 4 have Ru/En |
| Reviews | 5, all 5-star | avg 57 chars; one keyboard-mash, one test artifact |
| Bookings | 0 | — |
| `data/tashkent-seed-template.csv` | 0 bytes | no pending import |

The whole embeddable corpus is roughly **1.1 KB of text**. A top-5 vector search
over 16 rows returns 31% of the table, and the entire catalog fits in a prompt
with room to spare. Building an embedding pipeline first would mean a new paid
vendor, a migration, and re-embed-on-mutation logic in order to select 5 rows
from 16 that would all have fit in the prompt anyway — and at that size there is
no way to tell good retrieval from bad, so "prove retrieval quality" cannot be
done.

pgvector 0.8.2 is confirmed **available** (not installed) on the Supabase
instance for when the corpus justifies it.

## Scope

**In:** retrieval abstraction, recommender, package maker, cost controls.

**Out, with reasons:**

- **Trust layer (original phase 4).** `aiSummary`, `monthlyViews`,
  `bookmarksToday`, and `trendingRank` in `apps/web/app/components/ai-summary-block.tsx`
  are fabricated and rendering to users today. That is a live trust problem, but
  "replace with real computed signals" is unavailable at 5 reviews and 0
  bookings. The honest fix is to stop displaying them until they are real — a
  deletion, not a build. Separate spec, and the natural next one.
- **Supervisor (original phase 5).** Blocked on data, not engineering. 0
  bookings means there is nothing to analyse.
- **MCP.** Phases 1–3 read only Manzil's own database. MCP would matter only if
  Gurman had to call external booking systems or calendars. Scoped out rather
  than guessed at.
- **Embeddings provider.** Not needed at this corpus size. Deferred with a
  concrete trigger (below) rather than chosen now.

**Cost controls are not a final phase.** The original ordering put rate limiting
last. A public LLM endpoint under the 300/min global default is a live bill the
moment it merges. `ThrottleGurman` ships with the first endpoint.

## Architecture

New NestJS module `apps/api/src/modules/gurman/`, reusing existing auth,
throttling, and Redis. No separate service.

| File | Responsibility |
|---|---|
| `gurman.retriever.ts` | `GurmanRetriever` interface + `CatalogRetriever`. Returns `RetrievedContext`. The swap point for `VectorRetriever` later. |
| `gurman.llm.ts` | `GurmanLlm` interface + `AnthropicLlm` + `UnconfiguredLlm` (fail-closed default). |
| `gurman.grounding.ts` | Validates suggestion ids against live rows. Used on every serve path. |
| `gurman.prompt.ts` | Locale-aware prompt construction. |
| `gurman.service.ts` | Orchestration. |
| `gurman.controller.ts` | `POST /gurman/chat`, `POST /gurman/package`. |
| `gurman.dto.ts` | `class-validator` input caps. |

The two interfaces exist so the pgvector decision and the provider decision each
stay behind one boundary, and neither churns the service when revisited.

### Retrieval swap trigger

`CatalogRetriever` selects all visible businesses plus their approved reviews.
Replace it with a `VectorRetriever` when **either** holds:

- active businesses exceed **200**, or
- the serialised catalog exceeds **~30 KB** (roughly 8k tokens) per request.

Until then the catalog implementation is not a stopgap — it is strictly more
accurate than vector search, because it retrieves everything.

## The grounding guarantee

The requirement is that every claim traces to a retrieved row. Instructing a
model to only cite real businesses is a request, not a guarantee, so grounding
is enforced mechanically.

The model returns structured JSON:

```json
{ "reply": "…", "suggestions": [{ "businessId": "…", "reason": "…" }] }
```

The service then intersects every returned `businessId` with the ids of
currently-visible businesses. Anything outside that set is **dropped and logged
as a hallucination**.

Consequences, stated deliberately:

- Suggestion cards render only from validated live rows. A card can never point
  at a business that does not exist.
- If the model invents a name in prose, the prose is still shown — with **zero
  cards**, never fabricated ones.
- It is directly testable. A stub LLM returning a bogus id must yield zero
  suggestions. This is the anchor test of the spec.

### Grounding runs on the serve path, not the generation path

**Decision.** The cache stores the *structured* result — `businessId` and
`reason` — never rendered cards or business names. Validation and name/slug
hydration happen on **every serve**, so a cache hit and a fresh generation pass
through the identical validator.

Rejected alternatives:

- *Short TTL only* — bounds the staleness window without closing it; correctness
  would depend on a timing constant.
- *Invalidate on business mutation* — requires catching every path that can
  unpublish a business (admin action, suspension, moderation, direct SQL). One
  missed path silently serves a dead suggestion.

With serve-path validation, a business unpublished one second after caching is
absent from the very next response. The TTL (**15 minutes**) becomes purely a
cost and freshness knob, not a correctness control. Cost is one indexed
`WHERE id IN (…)` over a handful of ids.

**Residual limitation, accepted:** the generated `reply` prose is cached text and
may still name a business that has since been unpublished. Prose contains no
links, and the 15-minute TTL bounds it. Eliminating it entirely would require
regenerating prose on every request, which defeats the cache. Documented rather
than hidden.

## Multilingual grounding

`descriptionUz` is required; `descriptionRu` and `descriptionEn` are null for 12
of 16 businesses. The retriever passes whichever descriptions exist, and the
prompt instructs: **reply in the user's locale, ground in the source row's
language, and never invent a translation of a description that does not exist.**

Without that rule the model will manufacture Russian descriptions for the 12
businesses that have none — a hallucination that reads as fluent and correct.

## Cost control

Following the `ThrottleOtpSend` precedent in
`apps/api/src/modules/security/throttle.config.ts`, whose stated rationale —
"each request costs money" — applies identically here.

`/concierge` is **public**: `apps/web/middleware.ts` protects only
`/:locale/admin(.*)`. Rate limiting is therefore the primary cost ceiling, not a
secondary control.

- **`ThrottleGurman` — 10 per 15 min, 30 min block** (vs. the 300/min default).
- `@MaxLength(500)` on the chat input, so tokens cannot be inflated by stuffing.
- `max_tokens` cap on the response.
- Redis cache on `(normalized query, locale)` via the existing `CacheService`.

### Tracker key — confirmed, with a known limitation

`ManzilThrottlerGuard.getTracker()` keys on **client IP**, and deliberately so:
the guard is registered globally and therefore runs *before* the
controller-scoped `ManzilAuthGuard`, so no verified actor exists at that point.
Keying on an unverified bearer token would be worse than useless — an attacker
could rotate tokens for a fresh bucket per request.

`ThrottleGurman` therefore buckets by IP. Two consequences to carry forward:

- A genuine multi-turn conversation with follow-ups can reach 10 requests
  without any abuse.
- Tashkent mobile carriers NAT heavily, so one IP can represent many real users.
  The effective per-person limit is therefore **stricter than 10**, by an unknown
  factor.

Shipping at 10/15min anyway: it is the conservative direction, and there is no
usage data yet to justify a specific looser number. Guessing upward on a paid
endpoint is the more expensive mistake.

**Follow-up (post-launch, data-driven):** measure real anonymous session lengths
and 429 rates on `/gurman/*`, then revisit the ceiling. If per-user limiting
becomes necessary, note that it is not a config change — it requires a
controller-scoped tracker running after authentication, following the
`phoneTracker` + `@ThrottlerTracker` pattern already in
`manzil-throttler.guard.ts`. Left open deliberately rather than closed on a
guess.

## Error handling — fail-closed

Matching the campaign sender's established behaviour: an unconfigured system
reports failure rather than fabricating success.

| Condition | Behaviour |
|---|---|
| No `ANTHROPIC_API_KEY` | `UnconfiguredLlm` throws **503**. Never returns text. |
| Anthropic error or timeout | **502**; UI offers retry. |
| Unparseable JSON | One retry, then **502**. |
| All suggestion ids invalid | Prose with zero cards. |

**No silent fallback to the keyword mock.** A broken AI must look broken, not
quietly degrade to canned answers about three seed businesses.

## Frontend

`apps/web/app/components/concierge-chat.tsx` is currently **fully synchronous** —
`getConciergeReply` is a pure function call with no loading, error, or pending
state. The original prompt's "only its data source needs to become real"
understates this: async states must be added, not just the data source swapped.

- Loading state while the request is in flight; input disabled to prevent
  double-submission against a rate-limited paid endpoint.
- Error state with retry, distinguishing 503 (not configured) from 502
  (temporarily failing) from 429 (rate limited).
- Suggestion cards keep their existing markup and link into the existing
  business route, so package output is one click from booking.

Visual language stays the existing design system. A second aesthetic would read
as a bolted-on feature.

## Testing

API tests use the existing Jest + ts-jest setup.

1. **Grounding drops unretrieved ids** — stub LLM returns a bogus `businessId`;
   assert zero suggestions and a logged hallucination. *(Anchor test.)*
2. **Cache hit re-validates** — cache a suggestion, unpublish the business,
   assert the next serve omits it. *(Covers the decision above.)*
3. **`UnconfiguredLlm` throws** rather than returning text.
4. **Locale fallback** — a business with null `descriptionRu` is grounded from
   `descriptionUz` without an invented translation.
5. **`ThrottleGurman` applies** to both routes.
6. **Package composition** returns only validated ids across multiple
   businesses.

## External dependency

**`ANTHROPIC_API_KEY` does not exist in any `.env`.** No AI credential of any
kind is currently configured. The module is built against `GurmanLlm` with the
fail-closed stub, so it is fully testable without a key, but Gurman cannot answer
live until a key from `console.anthropic.com` is added. Model: `claude-sonnet-5`.

`@openrouter/sdk` is declared in root `package.json` but imported nowhere — an
unused dependency, not existing tooling. It plays no part in this design.
