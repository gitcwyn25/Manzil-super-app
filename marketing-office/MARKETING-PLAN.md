# Go-to-Market & Marketing Plan
## [Platform Name] — Acquiring the First Discoverers and the First Businesses

**Companion documents:** PRD.md, ARCHITECTURE.md

---

## 1. The sequencing principle

This is a two-sided marketplace, and two-sided marketplaces die in one specific way: a user opens the app, finds nothing, and never opens it again. The marketing plan exists to prevent that exact moment from ever happening to a real person.

The rule that follows from this: **supply (claimed businesses with reviews) has to exist before demand (public consumer marketing) is switched on** — not the other way around, and not simultaneously at full volume. Everything below is sequenced around that.

---

## 2. Business-side acquisition plan ("The Claimant")

The goal isn't "get businesses to sign up" — self-serve signup doesn't work when nobody has heard of you yet. The goal is **concierge-style onboarding**: your team creates and populates the listing, then hands the business owner the keys.

### 2.1 Where the first listings come from
- Compile an initial business database for Tashkent from public sources (existing map/directory listings, business registries, category-by-category manual research) before any outreach starts. The app should never show an empty category to its first real visitor.
- Prioritize **density in 2–3 categories** (e.g. cafes and restaurants first) over shallow coverage everywhere — a fully-populated "Cafes in Tashkent" category beats ten half-empty categories.

### 2.2 Direct outreach (the unscalable part that has to happen anyway)
- In-person visits or phone calls to the first 100–200 target businesses: show them their already-created listing, offer to claim it for free, explain what claiming gets them (photo control, review replies, visibility).
- This is genuinely the most labor-intensive part of the whole plan and the one most worth being honest about resourcing for (see Section 6).

### 2.3 A channel worth naming specifically: local government / SME-support relationships
Your background interning in district hokimiyat investment and foreign trade work is a real, usable lever here — not a generic networking tip. Local hokimiyat economic departments and SME-support programs often actively want to help small businesses get discovered and digitized; framing the platform as supporting that goal (rather than as a pure tech startup pitch) can open doors that cold outreach can't, and may also surface business-registry data useful for Section 2.1. Worth one or two exploratory conversations before launch, not a dependency to build the whole plan around.

### 2.4 Incentives for early business adoption
- "Founding business" badge/status for the first cohort — recognition-based, not cash-based (cash incentives invite gaming the system, which undermines the trust the whole platform depends on).
- Free premium features (when those exist in Phase 2) grandfathered for early claimants.
- Business-refers-business: once an owner has claimed their listing and sees value, ask them directly who else they'd recommend you talk to — warm intros convert far better than cold visits.

---

## 3. Consumer-side acquisition plan ("The Discoverer")

### 3.1 Seed reviewers come from your own network first — deliberately, not as an afterthought
Classmates, TSUE network, friends — anyone willing to actually use the app and leave real reviews before a single dollar of marketing is spent. Give them visible "Founding reviewer" recognition. This is the same recognition-over-cash logic as the business side, for the same reason.

### 3.2 Channels that actually fit Uzbekistan's media habits
- **Telegram** is the single highest-leverage channel here, not an afterthought — a platform-run Telegram channel posting things like "this week's most-reviewed cafe in Tashkent" turns the review data itself into shareable content, and meets users where they already are.
- **Instagram** for the same audience — short, visual content built from real business photos and review highlights (with permission), targeted at the young-professional/student demographic most likely to be early adopters.
- **Local digital media/PR** — outlets like Kun.uz, Daryo.uz, Gazeta.uz, and Spot.uz regularly cover local tech/startup launches; "the first Uzbek-language Yelp" is a genuinely pitchable story, and a single good piece of coverage at launch can outperform a small paid campaign.
- **Micro-influencers / local bloggers** — in a nascent market, food and lifestyle micro-influencers are cheap to engage and their followers are exactly the early-adopter profile you want; treat this as a Phase 1 tactic once there's enough real content for them to actually review.
- **SEO, slow but compounding** — business profile pages are server-rendered specifically so they can rank in Google search over time (see ARCHITECTURE.md Section 4.1); this won't move the needle at launch but is the only channel here with zero marginal cost as you scale.

### 3.3 Referral mechanics
- Refer-a-friend with recognition-based rewards (badges, profile status), not cash — same fraud-resistance logic as reviews themselves.
- University-network referral push specifically at launch, given your existing TSUE connections — a known, trusting audience is the cheapest possible first wave of real usage data.

---

## 4. Phasing (see diagram above)

- **Seeding (pre-launch):** Zero public marketing. Business data compiled, first 100–200 businesses personally onboarded, first reviewers are people you already know. Nothing public happens until a first-time visitor would see a genuinely populated app in at least 2–3 categories.
- **Launch (narrow focus):** Public launch concentrated in those same 2–3 dense categories and a defined Tashkent area — not a citywide "everything, everywhere" launch. PR push (Section 3.2) timed to this moment. Telegram/Instagram content engine goes live. Referral program turned on.
- **Broaden & test:** Expand categories once the first ones have real depth. Start small, measurable paid acquisition experiments (not before this point — there's nothing to spend money amplifying before you have signal that the core loop works). Influencer partnerships scale up. Business onboarding starts shifting from fully-concierge toward partial self-serve.
- **Scale (new cities):** Geographic expansion marketing — by this point the playbook from Seeding → Launch repeats per new city, faster, because you now have a working template and platform credibility to point to.

---

## 5. Budget reality

At this stage, the plan is designed to run on **time and relationships, not cash** — recognition badges, personal outreach, organic Telegram/Instagram content, and earned PR are all near-zero marginal cost. The only place a real budget consideration shows up before "Broaden & test" is potential Google Maps API spend (already flagged in ARCHITECTURE.md Section 11) and possibly a small data-compilation effort if it can't be done entirely by hand. Resist the pull to start a paid ad budget before the Launch phase has actual usage data to optimize against — early paid spend without product-market signal is the single easiest way to burn a limited budget for no learning.

---

## 6. Resourcing reality check

Worth saying plainly: the Seeding and direct-outreach work in Sections 2.2–2.3 is genuinely time-intensive, and your current calendar has a thesis defense in July 2026 as the explicit top priority, with this venture meant to be the one thing you're actively committing to in parallel. That's a workable combination, but only if the heavy manual-outreach grind is either (a) paced to a low, sustainable trickle alongside thesis work rather than attempted as a sprint, or (b) partially delegated — e.g. recruiting a couple of TSUE classmates as paid or equity-incentivized outreach help for Section 2.2 specifically, which also doubles as your first real team. Trying to run a full-intensity Phase 0 in the same weeks as a thesis defense is the most likely way this plan slips, not any of the marketing tactics themselves.

---

## 7. Risks specific to this plan

| Risk | Mitigation |
|---|---|
| Launching publicly before supply is real | Hard gate: no public marketing until 2–3 categories have genuine depth (Section 4, Seeding phase) |
| Founder time scarcity (thesis defense overlap) | Pace or delegate Phase 0 outreach — see Section 6 |
| Reviews/referrals gamed by cash incentives | Recognition-based incentives only, consistent with PRD's anti-fraud review design |
| One-time PR spike with no retention follow-through | Telegram/Instagram content engine needs to be running *before* the PR hits, so new visitors land somewhere active, not a one-day spike followed by silence |
| Over-broad launch (every category, every neighborhood) diluting density | Explicit category/geo narrowing at launch (Section 4) |

---

## 8. What to actually track

Tie this directly back to PRD.md Section 5 — the marketing plan doesn't need its own separate metrics, it needs to move those same numbers:
- Claimed/verified business listings (business-side acquisition is working)
- Reviews submitted per week, trend not absolute (consumer-side engagement is working)
- Search-to-profile-view rate (the content is actually useful once people arrive)
- Where new users/reviewers came from (Telegram vs. Instagram vs. referral vs. PR vs. organic) — even simple UTM tagging or a "how did you hear about us" field on signup is enough at this scale to tell you which channel in Section 3.2 is actually working, so you can stop guessing and double down on what's real.
