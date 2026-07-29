# Manzil — 45s Instagram Reel, product guide

**Format:** 9:16, 1080p, 45s · **Workflow:** Higgsfield `ugc-saas-flow`
**Structure:** 3 × 15s talking-head clips, one continuous creator, real captured
site screenshots as overlay cards. Burned captions throughout.
**Language:** English, American accent (workflow default, user-chosen).
**URL captured:** `https://manzil-business.vercel.app/en`

## Who this is aimed at

`apps/web/PRODUCT.md` names business owners as the primary revenue audience:
Tashkent SME operators deciding whether to claim and run a Manzil listing. The
script sells the **owner side** and uses the consumer side as proof that
customers are already there. It has to earn a "claim my business" in one scroll,
which on a Reel means one scroll's worth of attention — about eight seconds.

## Honesty constraints

These are the rules the script is written under. Every claim below is something
that is actually live in production today.

**Claimable:** listings, owner replies to reviews, bookings, analytics, free/Pro
plans, trilingual UI, photo upload.

**Not claimable, deliberately omitted:**
- **Gurman AI** — the endpoint is live but returns `available: false` until
  `ANTHROPIC_API_KEY` is set. Naming an assistant that cannot answer is the
  fastest way to lose trust in it.
- **Any "thousands of businesses" framing** — there is **1** business in
  production. The script never implies scale it does not have.

## Script (≈128 words, ~2.85 words/sec)

### Hook — clip 1, 0:00–0:03 (≤8 words, hook plate top of frame)

> **"Your business is on Instagram. That isn't a listing."**

Names the actual competitor. `PRODUCT.md` §2: most Uzbek SMEs have "at best, an
Instagram page." This is the sentence an owner argues with, which is what makes
them stay.

### Body — clip 1 cont. + clip 2

| # | Card (section still) | Line |
|---|---|---|
| 1 | `hero` | "Manzil is Uzbekistan's local business platform." |
| 2 | `showcase` | "Real places, with real reviews attached." |
| 3 | `bento — business tab` | "Claim yours and you don't just get a pin on a map." |
| 4 | `dashboard` | "You get a dashboard." |
| 5 | `reviews` | "Answer every review officially, under your own name." |
| 6 | `bookings` | "Take a booking by phone, log it here — it becomes a verified visit." |
| 7 | `analytics` | "And you can finally see who's actually finding you." |
| 8 | `pricing` | "Free to start. Pro when you outgrow it." |

Card 6 is the one to protect if the edit runs long. Bookings is the newest thing
Manzil does and the only line that describes a workflow an owner already has —
they take bookings by phone today, on paper.

### Closer — clip 3, final ~5s (product-free frame, creator only)

> **"Uzbek, Russian, English. Built in Tashkent. Claim your business — link in
> bio."**

Trilingual is not a feature line, it is a trust signal: `PRODUCT.md` calls it
"structural, not cosmetic," and it is the clearest proof this was not a Western
template translated badly.

## Card capture list

Run against `/en`. Target 8 usable stills; the flow needs ≥3 or it falls back to
asking for screenshots.

| Card | Where | Note |
|---|---|---|
| hero | `/en` top | headline + aperture ring |
| showcase | `/en` | business carousel band |
| featured / just-joined | `/en` | **thin — 1 business.** Frame tight on one card. |
| bento business tab | `/en` | the four owner cards, real sample content |
| dashboard | `/en/dashboard` | needs a signed-in session |
| reviews | `/en/dashboard/reviews` | signed-in |
| bookings | `/en/dashboard/bookings` | signed-in, newest surface |
| pricing | `/en/business/pricing` | free/pro/max |

**Capture blocker:** four of these are behind Clerk auth. The Playwright capture
runs unauthenticated and will hit the sign-in wall on `/dashboard/*`. Either
supply screenshots of those four from a signed-in browser, or the reel drops to
consumer-side cards only — which weakens it badly, since the owner surfaces are
the sell.

## Sequence once Higgsfield is reconnected

1. `media_upload` slots → capture `/en` full page + sections in one `sandbox_exec`
2. **View `site_full.png` before building anything** — the flow's hard gate
3. `generate_image` `soul_2`, 3:4, 2k → creator identity, reuse across all clips
4. `generate_video` `seedance_2_0`, 9:16, 1080p, 3 clips in one parallel batch
5. Composite cards at narrated word-times, ~1.2–1.5s each
6. Whisper → hook plate + word-by-word captions → burn
7. Deliver hosted URL

## What would make the next version better

Shoot it again after seeding. The single largest weakness here is that the
discovery surfaces are empty, so the reel has to talk around them. With 50
seeded Tashkent businesses the showcase, categories and search become the
strongest cards instead of the ones to avoid.
