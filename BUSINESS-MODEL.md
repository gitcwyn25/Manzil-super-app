# Business Model
## [Platform Name] — How This Becomes a Real Business, Not Just a Product

**Companion documents:** PRD.md, ARCHITECTURE.md, MARKETING-PLAN.md

---

## 1. One-line summary

A free-to-use, two-sided local discovery marketplace where consumers always pay nothing, and revenue comes entirely from the business side — starting with premium listing subscriptions once there's enough traffic to make that visibility actually worth paying for, expanding later into sponsored placement and data products. Monetization is deliberately sequenced to start at zero, because charging anyone before the platform has real value would undermine the trust the whole product depends on (see MARKETING-PLAN.md Section 5 and PRD.md Section 6.3).

---

## 2. Business model canvas

| Block | Summary |
|---|---|
| **Customer segments** | (1) Discoverers — Tashkent consumers searching for local businesses, always free. (2) Claimants — SMB owners (cafes, salons, repair shops, etc.) who want visibility and reputation management. (3) Phase 3+: brands/researchers wanting local market data (aspirational, not built yet). |
| **Value propositions** | To Discoverers: fast, trustworthy, trilingual local discovery. To Claimants: visibility to new customers + a way to manage their online reputation without hiring anyone. |
| **Channels** | Telegram, Instagram, local PR, SEO, direct business outreach, referral (see MARKETING-PLAN.md). |
| **Customer relationships** | Self-serve for consumers; concierge-onboarded then self-serve for businesses (see MARKETING-PLAN.md Section 2). |
| **Revenue streams** | See Section 3 — none at MVP, premium business listings from Phase 2, sponsored placement and data products from Phase 3. |
| **Key resources** | The business listing dataset and review corpus itself (the actual moat — see Section 9), the engineering team, local relationships built during outreach. |
| **Key activities** | Business data seeding and outreach, moderation, product development, local content/community building. |
| **Key partnerships** | Maps provider, auth provider, hosting providers, local SME-support bodies/hokimiyat contacts, eventually payment processors. |
| **Cost structure** | See Section 6 — dominated early by founder/team time, not cash; Maps API is the first real variable cost line to watch. |

---

## 3. Revenue streams, phased

Monetization timing follows the same phasing as MARKETING-PLAN.md Section 4 — it does not start until "Broaden & test," by design.

### Phase 0/1 (Seeding, Launch): $0 revenue
No monetization. The entire goal of these phases is proving the core loop (real businesses, real reviews, real repeat usage) works at all. Introducing any payment friction here — on either side — actively works against building the trust the business later depends on.

### Phase 2 (Broaden & test): Premium/Featured Business Listings
The first real revenue line, and the only one introduced at this stage.

| Tier | What it includes | Who it's for |
|---|---|---|
| **Free** | Standard listing, photos, owner can reply to reviews, basic visibility in search/category results | Every claimed business by default |
| **Premium (paid, monthly or annual)** | Priority placement within category results (clearly within normal relevance ranking, not a paid override of review quality), more photos, a "verified business" badge, basic analytics (profile views, search appearances — the data already described in ARCHITECTURE.md's monitoring section, productized) | Businesses that have already seen organic value from their free listing and want more |

This only works once free listings are demonstrably driving real customer visits — selling Premium before that's true is selling nothing.

### Phase 3 (Scale): Sponsored placement, lead-gen, and data products
- **Sponsored search placement** — clearly labeled as sponsored (never blended into organic ranking), capped in density (e.g. one sponsored slot per page, never more), introduced only once Premium has proven businesses will pay at all. This is the highest-trust-risk revenue stream on this list and should be the last one turned on, not the first one reached for.
- **Lead-generation analytics** — e.g. tracking and reporting click-to-call or contact-button engagement back to the business as a paid analytics add-on, rather than charging consumers anything.
- **Local market data products** (aspirational, long-horizon) — aggregated, anonymized local consumer-interest data could eventually be valuable to brands or researchers, but this is a Phase 3+ idea worth flagging now and revisiting later, not something to build toward yet.
- **Booking/reservation commission** — only relevant if/when the booking feature itself gets built (explicitly out of scope through Phase 2 per PRD.md), so this is a downstream option, not a near-term revenue line.

---

## 4. Pricing strategy & local sensitivity

Real pricing needs market validation once you're actually talking to claimed businesses — what follows is a framework for thinking about it, not a number to commit to yet.

- Anchor Premium pricing against what a small Tashkent business already spends on local visibility today — informally, that's often a modest monthly Instagram boost budget or nothing at all. Pricing meaningfully above that anchor without first proving ROI (visible profile views, visible customer mentions of "found you on [platform]") will stall adoption.
- Consider a genuinely low entry price for the first paying cohort specifically — the goal in Phase 2 is proving businesses will pay anything at all and learning what they value, not maximizing revenue per business yet.
- Price in UZS, not USD-pegged — a USD-denominated subscription introduces FX volatility into a small business's budgeting that a UZS price doesn't, and signals "imported product" rather than "built for here."

---

## 5. Cost structure

### Variable costs (scale with usage)
- **Google Maps API** — geocoding + map loads; flagged in ARCHITECTURE.md Section 11 as the cost line most worth watching as usage grows, since it bills per call.
- **Cloudflare R2 storage + bandwidth** — scales with photo volume; R2's zero-egress-fee structure keeps this relatively contained even as the photo library grows.
- **Hosting (Vercel + Railway)** — scales with traffic and database size, but both have low-cost tiers that comfortably cover pre-revenue usage levels.
- **Auth provider (Clerk)** — typically priced per monthly active user past a free tier, so this becomes a real line item only once consumer usage is meaningfully large.

### Fixed/operational costs
- **Outreach and moderation time** — the actual dominant cost in Phases 0–1 is founder/team time, not cloud spend: business onboarding, review/photo moderation, and customer support are all manual at this scale.
- **Search hosting (Meilisearch)** — self-hosted, so its "cost" is just the compute it runs on within the Railway bill above, not a separate line.

### One-time costs
- Initial business data compilation effort (Phase 0) — primarily time, possibly a small spend if any paid data sources end up worth using.

**The honest takeaway:** at MVP/launch scale, this is a genuinely cheap business to run in cash terms — the real constraint is the same one MARKETING-PLAN.md Section 6 already flagged: founder time, not money.

---

## 6. Unit economics framework

Real numbers require live data — this is the shape to fill in once you have it, not a forecast.

| | Consumers (Discoverer) | Businesses (Claimant) |
|---|---|---|
| **Acquisition cost (CAC)** | Near-zero in Phases 0–1 (organic, referral, personal network); rises only if/when paid acquisition experiments start in Phase 2 | Effectively founder/team hours during concierge outreach (Phase 0–1); should fall over time as self-serve and referral-driven claiming take over from manual visits |
| **Lifetime value (LTV)** | Indirect — a consumer's value is the review/usage data they generate, which is what makes the platform valuable to businesses, not direct revenue | Direct — Premium subscription revenue × expected retention months, once Phase 2 pricing exists |
| **What to watch for** | Engagement depth (reviews per active user) matters more than raw signup count | Premium conversion rate and retention will tell you faster than anything else whether the pricing/value match is right |

The key relationship to hold onto: consumer-side metrics are a leading indicator for business-side revenue, not a revenue line themselves. This is why PRD.md's success metrics (Section 5) track consumer engagement even though consumers never pay anything — that engagement is the entire product Premium businesses are buying into.

---

## 7. Key partnerships

- **Maps provider** — cost and data-quality dependency already flagged in ARCHITECTURE.md Section 4.6; worth a real commercial conversation once volume grows, not just a default API integration.
- **Auth provider** — primarily a cost-scaling dependency rather than a strategic partnership at this stage.
- **Local SME-support bodies / hokimiyat economic departments** — strategic more than financial: a credible local-government-adjacent relationship can meaningfully lower business-side CAC during outreach (see MARKETING-PLAN.md Section 2.3), and could later open doors to formal small-business digitization programs.
- **Payment processor** — not needed until any paid tier exists; evaluate local options (and their fee structure relative to a modest UZS subscription price) only once Phase 2 is actually being built.

---

## 8. Competitive moat

The defensible asset here isn't the software — a Yelp clone is not hard to build technically. The moat is:
- **The actual local data**: a real, trilingual, Tashkent-specific review corpus that took genuine on-the-ground work to seed — this is slow and unglamorous to build and exactly as slow and unglamorous for a future copycat to replicate.
- **Local relationships**: the businesses and early reviewers personally onboarded during Phase 0 aren't easily poached by a competitor with more funding but no local outreach history.
- **Language-native trust**: a platform that's genuinely Uzbek/Russian/English from day one (not a translated afterthought) reads as "built for here" in a way a fast international clone launch wouldn't.

None of this is defensible on day one — it becomes the moat only after Phases 0–1 are actually executed well, which is the real argument for taking those phases as seriously as the product itself.

---

## 9. Monetization risks & guardrails

| Risk | Guardrail |
|---|---|
| Charging businesses before free listings have proven value | Hold Premium until Phase 2, after organic visibility is demonstrably working (see Section 3) |
| Sponsored placement eroding review trust | Always clearly labeled, density-capped, and introduced last among revenue streams, not first |
| SMB ability/willingness to pay turns out lower than hoped | Validate with a genuinely low entry price and direct conversations with real claimed businesses before settling on a price point — don't guess |
| Consumer-side monetization temptation (ads, paid tiers) | Avoid — consumer trust and engagement is the product Premium businesses are paying for; monetizing the consumer side directly would undercut the entire revenue model above it |

---

## 10. Path to a sustainable model (illustrative shape, not a forecast)

Given the cost structure in Section 5 is genuinely low at this scale, the path to sustainability is less about hitting a specific revenue figure and more about reaching a Premium subscriber base whose recurring revenue covers the (small) recurring infra bill plus whatever ongoing moderation/support time costs. As a purely illustrative example of the shape of this math — not a target — a few hundred Premium subscribers at a modest monthly UZS price would already comfortably cover Maps API, hosting, and storage costs at MVP-to-launch scale; the real work is getting Phase 2 pricing and conversion validated with actual businesses rather than assuming a number in advance.
