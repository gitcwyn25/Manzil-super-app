# Product Requirements Document
## [Platform Name] — Local Business Discovery & Reviews Platform for Uzbekistan

**Version:** 0.1 (draft)
**Status:** Pre-build planning
**Owner:** [Founder name]

---

## 1. Executive summary

A Yelp-style platform purpose-built for Uzbekistan: users discover and review local businesses (restaurants, cafes, beauty, auto services, repairs, health, etc.), and businesses claim and manage their own listing. Tashkent-first, Uzbek/Russian/English from day one, with the explicit goal of feeling locally built rather than a translated import of a Western product.

The single hardest problem this PRD is built around is not a feature — it's the **empty platform problem**: a discovery app with no listings and no reviews has no value to anyone. Every phase below is sequenced to attack that problem directly, not just to ship features.

---

## 2. Problem statement

- Uzbek consumers currently rely on Google Maps (thin local review depth, weak coverage outside Tashkent), Telegram channels/group chats, and word of mouth to find local businesses. None of these are purpose-built for structured discovery (filter by category, compare ratings, browse photos).
- Small and medium businesses have no easy, low-cost way to manage an online reputation or be found by new local customers — most have, at best, an Instagram page.
- There is no platform that natively supports Uzbek (Latin script) alongside Russian and English, which matters for trust and adoption outside a narrow expat/tech-savvy segment.

---

## 3. Goals and non-goals

### Goals (MVP)
- Let users search and browse local businesses by category, name, and location.
- Let users leave star ratings, written reviews, and photos.
- Let business owners claim, edit, and respond to reviews on their own listing.
- Solve the cold-start problem deliberately, not accidentally (see Section 10).
- Ship in Uzbek, Russian, and English from the first release.

### Non-goals (explicitly out of scope for MVP)
- Online booking/reservations or payments.
- Loyalty programs or paid advertising products.
- AI-powered features (NLP search, review summarization, spam detection, auto-translation) — these are real, but Phase 2+, after there is enough data for them to matter.
- Coverage outside Tashkent at launch.

---

## 4. Target users and personas

| Persona | Description | Core need |
|---|---|---|
| **The Discoverer** (consumer) | Lives in Tashkent, checks reviews before trying a new place, currently uses Google Maps + asks friends on Telegram | Fast, trustworthy answer to "is this place good" |
| **The Claimant** (business owner) | Runs a cafe, salon, repair shop, or similar SMB; not very technical; checks things from a phone, not a laptop | Visibility to new customers, an easy way to respond to feedback |
| **The Seed Reviewer** (early adopter) | Power-user type, enjoys being "first" to review places, motivated by recognition/incentives | A reason to contribute when the platform has almost nothing on it yet |

---

## 5. Success metrics (MVP, first 90 days post-launch)

| Metric | Target (illustrative — set real numbers once you have a launch budget) |
|---|---|
| Claimed/verified business listings in Tashkent | 500+ |
| Listings with 3+ reviews | 40% of claimed listings |
| Weekly active users (consumer) | Track from week 1; growth rate matters more than absolute number early on |
| Reviews submitted per week | Track trend, not absolute — should be visibly increasing week over week |
| Search-to-profile-view rate | >50% of searches result in at least one profile view |
| Business owner reply rate to reviews | >30% of reviews get an owner reply within 7 days |

---

## 6. Feature requirements

### 6.1 MVP (must-have)

**Accounts & auth**
- Consumer sign-up/login (email, phone, or Google/Apple OAuth).
- Business owner sign-up + listing claim flow (claim an existing unclaimed listing, or create new).
- Password reset, basic profile (name, avatar, language preference).

**Business listings**
- Business profile page: name, category, description, hours, address, phone, photos, map pin, price tier.
- Business owner can edit their own listing fields and upload photos.
- Listing claim verification (lightweight for MVP — phone verification or manual admin approval, not a heavy KYC process).

**Search & discovery**
- Keyword search (business name, category).
- Category browse/filter.
- Geo-based "near me" results with map view + list view toggle.
- Sort by rating, distance, review count.

**Ratings & reviews**
- 1–5 star rating, required text review (minimum length to discourage low-effort spam), optional photos.
- One review per user per business (editable, not duplicable).
- Review helpfulness upvote.
- Business owner reply to a review (single public reply per review).
- Basic abuse reporting on a review (flag for admin review).

**Photos & media**
- Multi-photo upload for both business profiles and reviews.
- Image moderation queue (manual at MVP scale).

**Maps**
- Map pin per business, directions link-out, map-based browse view.

**Localization**
- Full UI in Uzbek (Latin), Russian, and English from launch; user-selectable, not just browser-detected.

**Admin/moderation**
- Internal admin panel: approve business claims, moderate flagged reviews/photos, manage categories.

### 6.2 Phase 2 (post-MVP, after initial traction)

- AI-assisted natural language search ("cozy cafe with wifi near Chorsu").
- AI review summarization on business profiles ("Reviewers consistently mention slow service but good food").
- AI spam/fake-review detection to reduce manual moderation load.
- Automatic translation of reviews between Uzbek/Russian/English.
- Push notifications (new review reply, listing milestones).
- Business analytics dashboard depth (profile view trends, search appearance data).
- Premium/featured listing tier (first monetization lever).
- Expansion beyond Tashkent (Samarkand, Bukhara, etc.).

### 6.3 Explicitly later / not yet scoped

- Reservations, table booking, online ordering.
- In-app payments.
- Loyalty/rewards programs.
- Sponsored search placement (monetization, but introduce after trust is established — doing this too early damages the thing that makes reviews credible).

---

## 7. Key user flows

**Flow A — First-time consumer, search to review**
1. Open app → see homepage with categories + trending nearby.
2. Search or tap a category → results list/map.
3. Tap a business → profile page with reviews.
4. Decide to visit. Later, return → tap "Write a review" → star + text + optional photo → submit.

**Flow B — Business owner claims a listing**
1. Owner searches for their own business (likely pre-seeded by the platform, see Section 10).
2. Taps "Is this your business? Claim it."
3. Verifies via phone number tied to the business (or submits for manual admin approval).
4. Once approved, gains edit access: hours, photos, description, and can now reply to reviews.

**Flow C — Owner responds to a review**
1. Owner gets notified (email at MVP, push later) of a new review.
2. Opens owner dashboard → review queue → writes a public reply.

---

## 8. Go-to-market: solving the empty platform problem

This deserves its own section because it is the actual hard problem, not a UX detail.

1. **Pre-seed listings before launch.** Scrape/compile a starting database of real Tashkent businesses (name, category, address, phone) from public sources before asking a single user to sign up. Users should never hit an empty search result in the launch city.
2. **Manually recruit the first 100–200 businesses.** Direct outreach (visit in person, call, or message) to claim their free listing — this is unscalable by design, and that's fine for an MVP. It is the only way to get verified-feeling content fast.
3. **Seed reviewer incentive.** Give early reviewers a visible "Founding reviewer" badge or similar recognition (not cash, which attracts fraud) — recognition-based incentives for the first wave of contributors.
4. **Concentrate on a few dense categories first** (e.g., cafes + restaurants) rather than spreading thin across every category — a dense, useful single category beats a sparse, useless everything.
5. **Personally onboard reviewers from your own network first** — friends, classmates, coworkers — before any public marketing. The goal is for the first public visitor to never see a category with zero listings or a listing with zero reviews.

---

## 9. Assumptions & dependencies

- Launch market is Tashkent only; "Uzbekistan" branding is aspirational, the actual MVP geography is one city.
- Business claim verification is lightweight (phone + manual admin review) at MVP scale — this trades rigor for speed, and is something to revisit once volume grows.
- No payment processing dependency at MVP — removes a large compliance/security surface for launch.
- Maps provider must have adequate Tashkent street-level and POI data — verify before committing to a maps vendor (cost and data quality both matter here).

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Empty platform at launch | Pre-seeding strategy in Section 10 above — non-negotiable before public launch |
| Fake/incentivized reviews undermine trust | One review per verified user per business, minimum review length, abuse reporting, manual moderation at MVP scale |
| Business owners don't bother claiming listings | Direct, personal outreach for the first cohort — don't rely on self-serve discovery to bootstrap this |
| Users default back to Google Maps out of habit | Differentiate hard on local-specific trust signals (language, locally relevant categories, community feel) rather than competing on raw map data |
| Localization done as an afterthought | Uzbek/Russian/English built into the data model and UI from day one, not bolted on later |

---

## 11. Phased roadmap

- **Phase 0 (pre-launch, 4–6 weeks):** Pre-seed business data for Tashkent, build MVP per Section 6.1, recruit first 100–200 businesses and first wave of reviewers from personal network.
- **Phase 1 (launch, Tashkent):** Public launch in Tashkent with MVP feature set, focused on 3–5 dense categories.
- **Phase 2 (post-traction):** AI features (search, summarization, spam detection, translation), push notifications, premium listings, expand categories.
- **Phase 3 (scale):** Geographic expansion beyond Tashkent, deeper monetization (sponsored placement, business analytics tiers).

---

## 12. Open questions

- What is the actual platform name/brand (placeholder used throughout this doc)?
- What's the realistic budget and timeline for manual business outreach in Phase 0 — solo effort or small team?
- Which maps provider has the best Tashkent data quality at acceptable cost — needs a direct comparison before committing (see Architecture doc, Section 4.6)?
- What's the long-term monetization model — premium listings only, or eventually sponsored search placement, and at what trust-cost?
