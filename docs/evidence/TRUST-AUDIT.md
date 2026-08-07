# Trust Audit — apps/web

**Date:** 2026-08-07 · **Branch:** `feat/frontend-elevation` · **Scope:** `apps/web` (+ two `packages/shared` copy strings, noted below)

Manzil's product principle is *"Trust — recommendations must be transparent, explainable, authentic"* (Product Bible §4). This audit went through every place the live site states something to a visitor and asked one question: **is this true?** Where the answer was no, the content was removed or corrected. Where the truth is unflattering (no bookings, no mobile app, Tashkent only, no packages yet), the page now says so.

The rule applied throughout: **an omitted claim costs a feature; a fabricated one costs the product.**

---

## 1. Fabricated content presented as real

### 1.1 Invented business identity on the marketing mockups — FIXED

`apps/web/app/components/business/mockups.tsx` rendered the business dashboard with `name: "Caravan Coffee", district: "Chilonzor"` — **a real business in the live Manzil catalogue** — surrounded by invented figures: `2 480` views, `132` reviews, `+18%` growth, `18 240` monthly views, a `4.8` rating and a seven-bar growth chart. None of those numbers describe that business. A café owner (or their competitor) reading that page would reasonably conclude Manzil was publishing their performance data.

Two changes, both load-bearing and documented in the file so they are not silently undone:

- The sample identity is now `DEMO_BUSINESS = { name: "Namuna Kafe", … }`. *Namuna* is Uzbek for "sample"; it matches no listing in the catalogue. The component no longer accepts a business through props at all, so a future edit cannot re-point it at a real listing.
- Every mockup frame carries a visible **`Namuna` / `Пример` / `Sample`** chip (`.mk-chrome-demo`), localized to the page's locale. The figures remain — they illustrate what the product does — but a reader now sees "sample" in the same glance as "2 480".

### 1.2 Invented testimonials — FIXED

The same file carried two reviews signed `Aziza R.` (★★★★★) and `Doston K.` (★★★★☆) with body text and an owner reply. Person-shaped names attached to star ratings are indistinguishable from testimonials. They are now `Mijoz A.` / `Клиент А.` / `Customer A.` (and B.), localized — clearly placeholders, and the owner reply no longer addresses a named person.

### 1.3 A second fabricated content set — DELETED

`apps/web/app/lib/audience-samples.ts` (255 lines) held a full trilingual fixture: a fake listing (`Chorsu Osh Markazi`, with a **real phone number, +998 88 586 11 24**, and a `Tasdiqlangan` / *Verified* chip), a fake review from `Dilnoza R.`, a fake profile `Kamola S.` with `128` reviews and `2.4k` followers, fake search results attributing `★ 4.9 · 1.2 km` to the real **Caravan Coffee**, and fake follower activity.

Its only consumer was `apps/web/app/components/audience-features.tsx`, which **no importer renders** — it was superseded by `FeatureTrio` on the home page. Both files are deleted. Sanitising unrendered fabricated content leaves it available to be reintroduced; removing it does not.

---

## 2. Engineering artifacts shown to visitors

| Artifact | Where it came from | Status |
|---|---|---|
| `crm.segments`, `crm.loyalty`, `crm.campaigns` printed as pricing-table rows | API plan-feature rows carrying an entitlement key but no label; the API falls back to the key | **FIXED** in web |
| `"Hours not listed"` — English, on the Uzbek and Russian business pages | `apps/api/…/database.repository.ts:1164` substitutes this literal regardless of locale | **FIXED** in web (API not in scope) |
| `"Claim flow"` as an uppercase section label on the Uzbek business page | `claimKicker` in `packages/shared/src/ui-copy.ts` | **FIXED** |
| `"Hozir mock rejimda"` / `"Сейчас mock-режим"` on the public Occasions page | `occasions.pageBody` in `packages/shared/src/ui-copy.ts` | **FIXED** |

**Pricing keys.** `planFeatureLabel()` in `apps/web/app/lib/plans.ts` resolves a feature to display text or to `null`. A label matching `^[a-z0-9]+(\.[a-z0-9_]+)+$` is treated as a leaked key. Three observed keys get real localized labels (they name capabilities that genuinely exist — `crm.controller.ts` guards `crm.segments` and `crm.campaigns`); **any unrecognised key is dropped from the table rather than guessed at**. A pricing table with one fewer line reads as a shorter plan; one containing `crm.loyalty` reads as an unfinished product. Applied on all three surfaces that render plan features (`/business`, `/business/pricing`, `/business/plans`).

**Hours.** `formatHours()` in `apps/web/app/lib/api-text.ts` recognises the API's sentinel and says the same thing in the visitor's language (`Ish vaqti ko'rsatilmagan` / `Часы работы не указаны`). This is translation of a known constant, not invention: when the API says it has no hours, the page says it has no hours. The same sentinel is why `openingHours` is deliberately **absent** from the business JSON-LD (§5).

**Occasions copy.** The old line promised AI packages and then admitted "mock mode". The limitation it was reaching for is real and worth stating, so it is now stated properly: *"Real listed places for each occasion. Full package recommendations are not ready yet."*

---

## 3. A history the visitor never had — FIXED

`LocaleProviders` seeded the client preferences store from `getUserProfile()` — the **demo fixture** in `@manzil/shared`. Every first-time visitor's browser was pre-populated with:

- saved businesses `caravan-coffee`, `yunusobod-osh-markazi`
- followed users `user_sara`, `user_john`
- a followed list `hidden-cafes`

None exist as that visitor's data. Worse, `UserPreferencesProvider` fell back to the defaults **whenever a stored list was empty**:

```ts
setSavedBusinessSlugs(stored.savedBusinessSlugs.length ? stored.savedBusinessSlugs : defaults?.savedBusinessSlugs ?? []);
```

So un-saving everything brought the fake entries straight back — the store could be added to but **never cleared**. This is the most likely explanation for the reported "Save button does nothing": saving worked, but the state could not be emptied, so the feature read as broken.

Fixed in two places: `locale-providers.tsx` passes no defaults, and the hydration effect now takes stored state unconditionally, including when it is empty. **A new visitor starts empty, which is the truth.**

The Save control itself was verified as functional: it toggles `useUserPreferences`, persists to `localStorage`, flips its label (`Saqlash` → `Saqlangan`) and carries `aria-pressed`, which `_business-profile.scss:506` already styles as a distinct pressed state.

---

## 4. Dead-end empty states — FIXED

Every empty state now answers *"what can I do next?"*.

| Surface | Before | After |
|---|---|---|
| Occasion detail — "Recommended places" | Heading above an empty grid | Sentence stating nothing is tagged yet + **Browse the catalogue** / **Add a business** |
| Discover — no results | Heading + sentence, nothing clickable | Same copy + **Clear filters** / **Add a business** |
| Community lists index | Empty grid | Explanatory sentence + **Browse the catalogue** |
| Occasions index | Empty grid | Explanatory sentence + **Browse the catalogue** |
| Home category tiles | *(already correct)* | Empty categories link to `/business/register` — verified, no change needed |

All copy is written per locale (uz/ru/en), not machine-translated.

### 4.1 The root cause behind several empty pages — FIXED

`searchBusinesses`, `getOccasions` and `getListsPage` in `apps/web/app/lib/api.ts` did **not** handle a failed fetch. Verified locally against a production build with the API unreachable: `/uz/discover`, `/uz/lists` and `/uz/occasions` all returned **HTTP 500** with `TypeError: fetch failed`. A public browse page must not 500 because a backend blipped. All three now degrade to an empty result — which is exactly what the new empty states are for — matching how `getHomeFeed` already behaved.

---

## 5. Structured data: what is deliberately absent

The business JSON-LD (`apps/web/app/lib/structured-data.ts`) emits only fields backed by real API data. Omissions and their reasons:

- **`openingHours` / `openingHoursSpecification`** — the API stores hours as one free-form string. Parsing it into a day/time schema would be guesswork, and a wrong schedule sends people to a closed door.
- **`aggregateRating` when `reviewCount === 0`** — a zero-review rating is not a rating.
- **`review` for unrated reviews** — filtered out rather than defaulted.
- **`FAQPage`** — no FAQ content exists anywhere in the product. None was written to earn the rich result.
- **`Event`** — "Occasions" are categories (birthday, date night), not events with dates and venues. Marking them up as `Event` would be a fabrication.
- **`sameAs`** — only `https://t.me/manzilbiz_bot`, which the site footer already publishes. No speculative social profiles.

`priceRange` uses the real `$`/`$$`/`$$$` tier; `geo` and `telephone` appear only when the record has them.

`/llms.txt` follows the same rule and states the limitations explicitly: **not a booking platform, not a delivery service, not available outside Tashkent, no published mobile app.** An answer engine that repeats an accurate limitation costs far less than one that repeats an overclaim.

---

## 6. Reported, not fixed — with reasons

| Finding | Why not fixed here |
|---|---|
| **Duplicate listing** ("Ravotsoy" appearing twice) | Catalogue data, not a rendering bug. Deduplicating in the web layer would hide a data-integrity problem that needs fixing at the source. Belongs to the API/data workstream. |
| **"Kitob, Toshkent"** as an address | Same: a wrong record in the catalogue. The page renders faithfully what the API returns. |
| **"Verified" badge on unclaimed listings** | The web gate is already correct — `businesses/[slug]/page.tsx:163` renders the badge only when `business.status === "claimed"`. If a badge appears on an unclaimed listing, the **API is returning `status: "claimed"` for it**. Needs an API/data fix, not a web one. |
| **`"Hours not listed"` at source** | `apps/api/…/database.repository.ts:1164`. `apps/api` is owned by a concurrent workstream. Mitigated in web (§2); the literal should still be replaced with a null and localized by consumers. |
| **Clerk development keys in production** | Environment configuration. **Not touched, per instruction** — no `.env` file was read for values or modified. Flagged for the operator: development instance keys carry Clerk's dev-mode banners, relaxed session security and strict rate limits, and must be swapped for production keys before launch. |
| **Footer link to `/{locale}/admin`** | The route directory `app/[locale]/(workspace)/admin/` is empty, so the link 404s. It is another workstream's entry point; deleting it would break their landing when it ships. After this change it 404s properly instead of 500-ing. |
| **Footer links to `/{locale}#download`** | The `#download` anchor no longer exists (store badges were removed — the app is unlaunched). The link resolves to a real page, so it is a dead anchor rather than a broken link. Repointing it is a product-copy decision, not a bug fix. |
| **`store-badges.tsx`, `hero-businesses.tsx`, `occasion-rail.tsx`, `feed-card.tsx`** | Unused components (zero importers). No fabricated content in them, so they were left alone rather than widening this diff. |

---

## 7. Files changed

**Deleted:** `app/lib/audience-samples.ts` · `app/components/audience-features.tsx`

**Modified (web):** `app/components/business/mockups.tsx` · `app/components/locale-providers.tsx` · `app/components/user-preferences-provider.tsx` · `app/lib/plans.ts` · `app/lib/api.ts` · `app/globals.css` · `app/[locale]/(site)/business/page.tsx` · `.../business/pricing/page.tsx` · `.../business/plans/page.tsx` · `.../business/register/page.tsx` · `.../businesses/[slug]/page.tsx` · `.../discover/page.tsx` · `.../lists/page.tsx` · `.../occasions/page.tsx` · `.../occasions/[slug]/page.tsx`

**Added (web):** `app/lib/api-text.ts`

**Modified (shared — two copy strings only):** `packages/shared/src/ui-copy.ts`. Outside the stated `apps/web` scope, but both offending strings (`"Claim flow"`, `"Hozir mock rejimda"`) live only there and are rendered by the web app. The file was untouched by any concurrent workstream at the time of edit. No type or structural change.

**Not touched:** `apps/api` (concurrent workstream) · any `.env` file or secret.
