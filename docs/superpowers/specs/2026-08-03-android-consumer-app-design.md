# Manzil Android consumer app — design

**Date:** 2026-08-03 · **Branch:** `feat/frontend-elevation` · **Status:** approved design, pending implementation plan

A native Android consumer app for discovering local businesses in Tashkent, built in
Kotlin and Jetpack Compose, replacing the unfinished Expo prototype in `apps/mobile`.

---

## 1. Why this exists, and what is already there

`apps/mobile` is an Expo/React Native prototype: 7 screens, 1,662 lines, a coherent
design token set, an EAS project, and a built APK. It has never been connected to
anything. Every screen renders static mock data from `@manzil/shared`; there are no
network calls, `@clerk/clerk-expo` is a dependency with zero imports, saved places
live in React state and vanish on restart, `expo-location` is installed and unused,
and the locale is hardcoded to `uz` in `theme.ts` so the existing `i18n.ts` is
unreachable.

The backend, by contrast, is real and deployed. Every endpoint this app needs already
exists and serves live data.

The decision taken was to rebuild natively rather than wire up the prototype. The
trade-offs were stated and accepted: the existing UI work is discarded, nothing is
shared with the TypeScript monorepo, and the timeline is months rather than weeks, in
exchange for a true native app.

### Product decisions taken

| Question | Decision |
|---|---|
| Audience | Consumers (discovery). Business owners stay on the web dashboard. |
| Destination | Public Google Play launch. |
| Listings source | Business self-registration only. No scraping, no Places import. |
| Launch gate | None. Ship when the app is ready; listings accumulate afterwards. |
| Auth | Clerk, offering both Google and phone. |
| v1 additions | Map view and near-me. **Not** push, **not** server-synced saves, **not** consumer review photos. |
| Visual direction | Push beyond the current design — expressive, not merely corrected. |

The no-gate decision was challenged on the grounds that a discovery app launching with
near-zero listings risks poor early reviews. It was reaffirmed. The design responds by
making sparse content look intentional (§4) rather than by blocking the launch.

---

## 2. Scope

**In:** the seven screens already specified — Home, Search, Business Detail, Review,
Saved, Concierge, Profile — against real API data, with Clerk auth (Google + phone),
anonymous browsing, a map with near-me, and uz/ru/en.

**Out, with consequences recorded so they are not rediscovered later:**

| Excluded | Consequence accepted |
|---|---|
| Server-synced saved places | Saves are device-local. Lost on reinstall, never synced with web. |
| Push notifications | No re-engagement channel at launch. |
| Consumer review photos | Reviews are rating + text. Only owners supply imagery. |
| Business-owner features | Owners remain on web. |

---

## 3. Architecture

A single Gradle module. Seven screens does not justify multi-module build complexity;
feature packages provide the same boundaries without the Gradle overhead. Split later
if the app materially outgrows this.

```
apps/android/
  settings.gradle.kts
  gradle/libs.versions.toml          version catalog
  app/build.gradle.kts
  app/src/main/
    AndroidManifest.xml
    java/com/manzil/consumer/
      ManzilApp.kt                   @HiltAndroidApp
      MainActivity.kt                single activity, edge-to-edge
      core/design/                   Color Type Shape Theme
      core/ui/                       BusinessCard Chip StatPill EmptyState RatingRow
      data/remote/                   ManzilApi + dto/ + AuthInterceptor
      data/local/                    SavedStore PrefsStore (DataStore)
      data/repo/                     Business Search Review Concierge repositories
      feature/home|search|detail|review|saved|concierge|profile/
                                     XScreen.kt + XViewModel.kt
      nav/                           ManzilNavHost.kt Routes.kt
    res/values/strings.xml           uz (default)
    res/values-ru/strings.xml
    res/values-en/strings.xml
```

Application ID stays `com.manzil.consumer`, matching the Expo prototype's package and
its adaptive-icon assets. Nothing is published, so there is no migration concern.

### Stack

| Concern | Choice | Rationale |
|---|---|---|
| UI | Compose + Material 3 | Existing brand tokens map onto an M3 `ColorScheme`. |
| Navigation | Navigation Compose, type-safe routes | Serializable routes; per-destination deep links. |
| State | Coroutines + `StateFlow`, ViewModel per screen | One `UiState` sealed interface per screen covers every required state. |
| Network | Retrofit + OkHttp + kotlinx.serialization | Plain JSON REST; nothing heavier is justified. |
| DI | Hilt | Standard, low ceremony at this size. |
| Local storage | DataStore (Preferences) | Saved slugs are a small string set; locale is one value. No offline requirement in scope, so Room is unwarranted. |
| Images | Coil 3 | Loads Supabase `publicUrl`s. |
| Maps | **2GIS** | Materially better POI, address and building coverage in Uzbekistan than Google. See §7. |
| Location | `FusedLocationProviderClient`, coarse only | Sufficient for distance sort; avoids the stricter fine-location justification on Play. |
| Auth | Clerk Android SDK (Kotlin, GA since 2025-09) | One identity model with web; the API already verifies Clerk tokens. |

### Reuse

Re-expressed in Kotlin, not imported: the colour/spacing/shape tokens from
`apps/mobile/src/theme.ts`, the trilingual copy in `packages/shared/src/ui-copy.ts`
(into three `strings.xml`), the screen inventory and required-states list in
`tech-office/android/design/screen-map.md`, and the principles in
`apps/mobile/PRODUCT.md`.

No React Native code is reused. `apps/mobile`, `apps/mobile-old`, and the stale root
`Manzil.apk` are removed as part of this work. `PRODUCT.md` and `DESIGN.md` move to
`tech-office/android/design/` first — they remain the product source of truth.

---

## 4. Visual direction

The brief was that the current app is dull, and that the rebuild should push further
rather than merely correct it.

### Diagnosis

| Cause | Location |
|---|---|
| No photography — businesses render as tinted rectangles with an emoji glyph | `theme.ts` `photoTone`, `PhotoBlock` |
| Letters used as tab icons (`H`, `⌕`, `AI`, `★`, `P`) | `RootNavigator.tsx` |
| One typeface at one weight; no display/body contrast | throughout |
| Uniform rhythm — every element the same white rounded rectangle | `Card`, `BusinessCard` |
| A strong palette used almost entirely as text colour; gold effectively absent | `theme.ts` |
| No motion, and no dark theme (`userInterfaceStyle: "light"`) | `app.json` |

### Direction

Photography leads. Cards pull real covers from `/v1/media/business-covers`; detail
opens on a full-bleed carousel from `/v1/media/businesses/:slug/photos`.

**The no-photo state is designed, not degraded.** Early listings will frequently have
no photo. Instead of a grey placeholder, render a typographic card: the business name
set large in the display face, knocked out of a deep teal field, with the category mark
and district. This reads as editorial intent rather than missing content, and is the
primary mitigation for launching without a listing-count gate.

Type carries hierarchy — display face at 32sp for business names and section heads,
body at 15sp. Colour is deployed with intent: deep teal `#005454` as whole surfaces,
and gold `#FEB300` reserved exclusively for ratings and one primary CTA per screen, so
scarcity keeps it valuable. Material Symbols (Rounded) replace the letter icons. Home
uses three distinct shapes — an editorial hero, a category rail, then compact rows —
rather than a stack of identical cards.

Motion is restrained: a shared-element transition from card to detail via
`SharedTransitionLayout`, a collapsing toolbar on detail, press-scale on cards. Nothing
ambient. The system animation scale is honoured, falling back to cross-fades when
animations are disabled.

Dark theme ships from day one, brand-locked. **Material You dynamic colour is
explicitly disabled** — allowing wallpaper to recolour the app would destroy the
teal/gold identity.

Pushing beyond the current design conflicts with the anti-references in
`apps/mobile/PRODUCT.md`, which warn against decoration. That document is to be
**amended** as part of this work to distinguish decoration (still unwanted) from
expressive confidence (now wanted), rather than left to silently contradict the build.

### Typography prerequisite

The web uses Archivo for display and IBM Plex Sans for body. **Archivo's Cyrillic
coverage must be verified before it is adopted.** If the display face lacks Cyrillic,
Russian headings fall back silently to a system font — the app looks broken in one of
three launch languages while appearing correct in the two most likely to be tested. If
coverage is absent, either set display in IBM Plex Sans with weight and scale carrying
the contrast, or adopt a Cyrillic-complete display face (Onest and Unbounded are both
suitable and freely licensed). This is a checked prerequisite, not an assumption.

---

## 5. Data layer

| Screen | Call |
|---|---|
| Home | `GET /v1/home?locale=` → `justJoined`, `featured`, `categories[]`, `totalBusinesses` |
| Covers | `GET /v1/media/business-covers?slugs=` |
| Search | `GET /v1/search?q=&category=` |
| Detail | `GET /v1/businesses/:slug` → `{ business, reviews[] }` |
| Detail photos | `GET /v1/media/businesses/:slug/photos` |
| Detail (silent) | `POST /v1/businesses/:slug/visit` |
| Review submit | `POST /v1/businesses/:slug/reviews` · authenticated |
| Review actions | `POST /v1/reviews/:id/helpful` · `POST /v1/reviews/:id/report` |
| Concierge | `POST /v1/gurman/ask` |
| Profile | `POST /v1/auth/sync` · `GET /v1/auth/me` |

Every response is enveloped as `{ data: … }`, so a single generic `ApiEnvelope<T>`
covers all of them. Base URL comes from a Gradle `buildConfigField`, not an
`EXPO_PUBLIC`-style variable.

### Distance and near-me

`/v1/search` accepts no geo parameter, so **v1 sorts by distance client-side** from the
`lat`/`lng` on the result set. This is correct at current scale — search caps at 200
rows — and wrong at ten thousand listings. A server-side geo query is recorded as
follow-up work, not built now.

### Throttling needs designed states

`ThrottleGurman` permits 10 requests per 15 minutes and then blocks for 30 minutes.
Rendering that as a generic error would read as a broken app. Concierge gets a specific
429 state naming what happened and when it lifts; `ThrottleWrite` on review submit gets
the same treatment.

### Error localisation

Following Sirly's pattern (§7): where the API returns an error `key`, the client maps
it to localised uz/ru/en copy rather than displaying server-supplied text.

---

## 6. Navigation, auth, language, permissions

**Navigation.** Single activity, `NavHost`, type-safe serializable routes, tab-scoped
back stacks. Deep links via `manzil://business/{slug}` and verified App Links on
`https://manzil.uz/businesses/{slug}`, so shared web links open the app — the cheapest
available growth loop.

**Auth.** Clerk Android SDK with Google and phone. Anonymous browsing is the default:
Home, Search, Detail and Concierge all work signed out. The gate appears only at review
submission, helpful votes, and Profile. Concierge deliberately remains public,
consistent with the documented reasoning on `GurmanController`; the throttle is the
cost control. On first sign-in, `POST /v1/auth/sync` creates the local `User`; an OkHttp
interceptor attaches the session token thereafter.

**Language.** `values/` is Uzbek as the default and fallback, with `values-ru/` and
`values-en/`, ported from `ui-copy.ts`. In-app switching via
`AppCompatDelegate.setApplicationLocales` with `android:localeConfig`, so the app also
appears in Android's per-app language picker. The `locale` parameter is passed to
`/v1/home` and detail so server content matches.

**Storage and permissions.** DataStore holds saved slugs, chosen locale, and onboarding
state. Only `ACCESS_COARSE_LOCATION` is requested. All three location states from
`screen-map.md` — granted, denied, approximate — receive real UI.

---

## 7. Findings from sirly.uz

`sirly.uz` is an Uzbek surplus-food marketplace ("SIRLY" MCHJ, STIR 312516386). A
different product, but structurally close: two-sided consumer/business platform,
Tashkent-first, trilingual, ratings, partner dashboard, phone auth, mobile-app-led. It
runs Nuxt 3 with SSR disabled against `api.sirly.uz/api/v1`.

**Adopted here:** 2GIS for maps; phone/SMS OTP as a first-class auth path; localising
server error keys client-side; and bot protection in front of OTP send — Sirly gates
theirs behind an explicit CAPTCHA because each SMS costs money, and Clerk's equivalent
bot-protection setting must therefore be enabled rather than left at its default.

**Adopted in adjacent workstreams (§8):** citing O'RQ-547 and the Operator role;
naming the Personalization Agency under the Cabinet of Ministers as the escalation
route; a 15-working-day data-request SLA; 18+ with a minors clause; publishing MCHJ
name, STIR, address, phone and a dedicated `privacy@` address; in-app account deletion
and data export; Terms framed as an Ommaviy oferta; privacy policy overriding Terms on
data matters; noting that tax/accounting data survives deletion; CAPTCHA ahead of OTP
send; and staged, resumable partner onboarding.

**Deliberately not copied:** disabling SSR (their `/privacy` and `/terms` serve an
empty shell to crawlers — Manzil's SSR is a real advantage); shipping
`translations-akbarshoh` and `translations-anvarjon` dev routes to production; locale
namespaces named after individual developers; and blank placeholder keys in a live
policy.

**Two issues this surfaced:**

1. **Account deletion blocks Play submission.** Google Play requires any app with
   account creation to offer in-app deletion and a publicly reachable web deletion URL.
   The API has no such endpoint. Sirly ships `/profile/delete/`. This must exist before
   submission.
2. **Data localisation is an unresolved legal exposure.** O'RQ-547 requires personal
   data of Uzbek citizens to be processed in databases physically located in Uzbekistan
   and entered in the State Register. Manzil runs on Railway, Supabase, Clerk and
   Stripe — all foreign-hosted. Sirly's policy is silent on storage location, which is
   not evidence that the arrangement is compliant. This requires an Uzbek lawyer, is
   recorded in `ceo-office/LEGAL-REVIEW-REQUIRED.md`, and blocks launch rather than
   development.

---

## 8. Decomposition

Four workstreams, of which two are not Android work. Each gets its own spec and plan.

| Workstream | Blocks Play submission | Sequence |
|---|---|---|
| **A. Android consumer app** (this spec, incl. 2GIS and deletion UI) | — | now |
| **B. API changes** | **Yes** | next |
| **C. Legal documents to Uzbek standard** | **Yes** | next |
| **D. Staged business registration on web** | No | later |

### B — API changes

| Change | Reason |
|---|---|
| Filter `search` and `listBusinesses` by `status: "claimed"` and `mergedIntoId: null` | **Live bug.** `searchUncached` filters only on category and text, so search currently returns unclaimed and `pending_claim` listings and resurfaces the merged duplicate the 2026-07-29 audit cleaned up. Affects web today; the app would inherit it. |
| Add `lat`/`lng` to `mapCard` | Home-feed cards cannot show distance; `mapBusiness` already includes them. |
| Account deletion and data export endpoints | Play requirement and an O'RQ-547 user right. |

### C — Legal documents

Rewrite privacy policy and terms to Uzbek standard per §7, seeded through the existing
`LegalDocument` model. Provides the privacy-policy URL the Play listing requires.

### D — Staged business registration

Convert the single-page web registration into a staged, resumable flow. Because
self-registration is the **only** source of listings, this conversion rate is the
content pipeline. It does not block legality, but it governs whether the app has
anything to show.

---

## 9. Play Store readiness

- **AAB** via Play App Signing. The release upload keystore must never enter git —
  note `apps/mobile/android/app/debug.keystore` is currently committed; harmless for a
  debug key, but not a precedent to follow.
- **targetSdk** set to whatever Play mandates for new submissions at build time; Google
  raises this annually each August.
- **Data Safety form:** coarse location; email and phone via Clerk; no user-supplied
  photos in v1.
- **UGC compliance.** Reviews make this a UGC app, requiring moderation, in-app
  reporting, and user blocking. `POST /v1/reviews/:id/report`, `moderationStatus`, and
  `UserStatus`/`bannedAt` already exist; the app must surface reporting, which the Expo
  prototype does not.
- **Listing assets:** icon exists; feature graphic, screenshots, and descriptions
  needed in all three languages.
- Crash reporting via Sentry; R8 plus a baseline profile for startup performance.

---

## 10. Testing

Unit tests on ViewModels and repositories using JUnit, Turbine, and MockWebServer.
**Contract tests built from MockWebServer fixtures captured against the live API** are
the highest-value layer here, because the app and API version independently and DTO
drift is the most likely source of production breakage. Compose UI tests cover
search → detail → review. Accessibility verification covers TalkBack, 48dp targets, and
the WCAG AA contrast `PRODUCT.md` targets. The required-states matrix in
`screen-map.md` becomes the manual QA checklist.

---

## 11. Open items

| Item | Owner | Blocks |
|---|---|---|
| Verify Archivo Cyrillic coverage; choose display face | implementation | Design system |
| Uzbek counsel on O'RQ-547 data localisation | CEO office | Launch, not development |
| 2GIS Android API key and Compose integration approach | implementation | Map feature |
| Confirm Play's current `targetSdk` requirement | implementation | Submission |
