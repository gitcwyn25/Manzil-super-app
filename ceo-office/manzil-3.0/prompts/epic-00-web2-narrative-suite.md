# Epic 00A-00H + Web 2.0 — The Narrative & Trust Suite

> Captured 2026-08-07 from a three-lens external product review (consumer 3.5 · business owner 4.0 · investor 3.0 · **overall 4.0/10**) and the CTO response. Sequenced AFTER Epic 00 (production hardening) lands. **Verdict adopted: vision 9.8 / execution 4.0 — every problem is execution, therefore fixable.**

## The review's central finding (accepted without dispute)

> "Manzil is a genuinely beautiful, well-architected shell with almost nothing running behind it… The gap between what the site claims and what it does is the central problem."

Concretely: the flagship AI returns `available: false`; the catalog holds two listings (one duplicated with conflicting 5.0/4.0 ratings); the only review is founder-authored on the founder's own business while the copy three screens earlier says "Only real reviews. No made-up ratings."; the business page advertises 1,200+ businesses and 48,000 monthly views. **In diligence that becomes a founder-integrity question, not a metrics question.**

Every marketplace starts empty — Airbnb, Uber, DoorDash, Booking. *They never pretended.*

## 00A — Truth & Trust Audit (HIGHEST PRIORITY, in flight)

Remove every fabricated metric, testimonial, screenshot statistic and demo artifact presented as real; replace with honest pre-launch copy ("Founding businesses are joining now" / "Become one of the first verified partners" / "Early access platform"). Sweep the repo for mock/fake/placeholder/hardcoded statistics — remove or unmistakably label. Deliverable: `docs/evidence/TRUST-AUDIT.md`.

## 00B — Explain Manzil (the landing rewrite)

The site sells the wrong product: *Discover Businesses* instead of *Plan Experiences*. Hero: **"Plan experiences. Not just places."** → "Tell Gurman what you're planning. It finds businesses, compares options, coordinates people, and builds the best experience." Sections: how it works (idea → planning → businesses → comparison → decision → booking → experience → memory) · Meet Gurman (intent, budget, relationships, businesses, learning — not "we use AI") · multiplayer · business intelligence · trust (no sponsored rankings, explain WHY recommendations happen).

**Gurman explained in six levels:** search → recommendations → planning → negotiation (replace/exclude/add/compare/optimize) → multiplayer (invite, vote, shared budget, conflict resolution, consensus) → experience memory (rate, review, remember, learn, improve). *Now investors understand why the AI exists.*

## 00C — Gurman Showcase (interactive, NOT connected to an LLM)

Scripted example scenarios (birthday · wedding · weekend · date · coffee · business meeting · family dinner · travel), each showing mission → reasoning → businesses considered → **why rejected** → final recommendation → timeline. **Clearly labelled "Example Scenario." Never fake live AI.**

## 00D — /experience-os

The philosophy page no competitor has: the experience lifecycle (idea → planning → decision → reservation → experience → photos → reviews → memory → relationship → future recommendations) and how every experience teaches Gurman (mission memory, preference memory, relationship graph, business graph, marketplace intelligence, timeline). No jargon; premium diagrams.

## 00E — Business acquisition landing

Stop selling listings; sell growth. Why join now · benefits (visibility, AI recommendations, CRM, campaigns, workspace, bookings, reviews, loyalty) · onboarding path (register → verification → profile optimization → AI summarization → go live → acquisition → growth) · **pricing philosophy instead of placeholder prices**: "Contact Sales" / "Early Access" / "Founding Partner" until there is an audience to price. (Current tiers show 999,999 and 1,999,999 so'm — ~$77/$154 per month from a platform with no audience, plus raw i18n keys rendering in the table.)

## 00F — Trust Center

`/company` `/about` `/security` `/privacy` `/trust` `/status`: mission, vision, founders, technology, AI principles, security, privacy, responsible AI, data ownership, moderation, business verification, recommendation transparency, review integrity, fraud prevention. **Currently there is no company entity, no About, no privacy policy, and support is a personal Gmail + two personal mobile numbers — for a platform collecting reviews, photos, business records and auth identities that is a compliance gap, not a to-do.**

## 00G — Empty states become sales

"Be the first café in your district" · "Claim this category" · "Join the waitlist" · "Suggest a business" · "Invite your favourite place." Every empty state educates or converts; never a dead end.

## 00H — The "wow" factor

First 15 seconds should earn "I've never seen this before": animated city map lighting up as Gurman plans a route · AI reasoning as a decision graph · experience timeline building in real time · multiplayer voting animation · before/after "searching places" vs "planning experiences". Tasteful, product-supporting, Apple-level restraint.

## Web 2.0 — full platform redesign brief

**Replace, don't improve.** Keep only: the Vibrant Marketplace design system, tokens, component kit, architecture, localization, coding standards. Everything else may be redesigned.

Full IA: Landing · Discover · Gurman AI · Experiences · Business · Workspace · Pricing · About · Technology · Developers · Careers · Contact · Legal · Privacy · Security · Roadmap · API.

Per-surface targets — **Discover:** Airbnb × Apple Maps × Spotify (smart + natural-language search, AI recommendations, trending, nearby, recently opened, friends visited, saved, collections, occasions, map/list toggle, floating planner). **Business page:** gallery, video, story, timeline, reviews, Q&A, owner response, menus, services, booking, events, announcements, similar places, and "why Gurman recommended this". **Gurman page:** a concierge workspace (conversation + workspace panels, budget, timeline, group, replacements, reasoning, booking summary, memory). **Workspace:** the heart — timeline, mission, people, budget, votes, bookings, history, past experiences, future plans, saved ideas, AI memory.

Cross-cutting rules: every statistic originates from backend data · every page answers what/why/how/what-next · AI present everywhere but never dominant · premium restrained motion · mobile-first (not desktop-shrunk) · full SEO + WCAG AA · sub-second interaction.

**20 deliverables:** UX architecture · sitemap · wireframes · component inventory · motion spec · interaction spec · copy spec · illustration spec · iconography spec · implementation plan · migration plan · design-system changes · new components · analytics plan · A/B plan · performance budget · SEO checklist · a11y checklist · i18n review · implementation roadmap.

## Execution order (agreed)

1. Trust audit → 2. Landing rewrite → 3. Gurman showcase → 4. Business landing → 5. Trust Center → 6. Empty states → 7. Experience OS page → 8. Premium interactions → then Web 2.0 surface-by-surface.

## Addendum (2026-08-07) — the diagnosis, the sentence, and three product moats

**Diagnosis in one line:** *Manzil looks like a Series A company but behaves like an MVP.* That mismatch is what destroys trust — the redesign must make it feel like a complete product from the first second, not a prettier UI.

**The one sentence everything supports:** **"Manzil is your city's AI operating system."** Today a visitor must guess between Maps / Booking / Yelp / AI chat / CRM / super app. One sentence, then every section supports it.

**Hero must show the machine thinking, not a slogan:** birthday dinner → Gurman compares 46 restaurants → removes closed → checks ratings → checks parking → finds live music → books → creates itinerary → invites friends. People understand instantly.

### Moat 1 — Transparent rejection (highest-trust, lowest-cost)

Never just "Recommended: Restaurant A". Instead: *"I excluded A — too noisy. Removed B — closed today. Removed C — no parking. Compared 14 places. These three fit."* **This is already architecturally supported**: Epic 03's Explanation Engine + RecommendationTrace make unexplained recommendations unrepresentable, and Epic 08's reason codes carry the scores. The UI simply has to surface what the engine already produces. Ship it the moment Gurman is live.

### Moat 2 — Structured experience reviews

Replace ★★★★★ + "Good" with what actually happened: visited (family dinner) · budget (300,000) · time (Saturday evening) · wait (12 min) · noise (medium) · kids (yes) · parking (easy) · would return (definitely). Machine-readable by construction — this is the input Epic 16's Experience DNA needs, gathered from day one rather than reverse-engineered from prose later. **Design the review form for this now; it costs nothing today and compounds for years.**

### Moat 3 — Living business objects

Businesses stop being database rows: identity, summary, atmosphere, crowd, strengths, weaknesses, events, history, owner personality, community perception, relationships, popularity trends, seasonality, best audience — AI-generated, continuously updated (Epic 06 summarizers + Epic 16 DNA).

**Also captured:** Gurman as "your city expert" (knows hours, availability, prices, parking, noise, atmosphere, owner replies, your memories, friends, budget, mood, weather, traffic) · Discovery as TikTok-meets-Maps with contextual rows (trending, friends visited, AI picks, couples, families, late night, budget, luxury, pet friendly, wheelchair, rainy day, study, work) · business pages as *stories* not profiles · the social layer (follow, lists, collections, shared itineraries, votes, invitations, memories) · CRM as an **AI Business Manager** that analyses so the owner doesn't (morning summary → negative review → suggested reply → campaign idea → slow-Tuesday detection → VIP arriving → revenue forecast) · desktop-for-planning vs mobile-for-experiencing.

### Agreed priority order (supersedes the 8-step list above where they differ)

1. **Trust** — remove fabricated content, fix production issues, SEO, authentication
2. **Narrative** — landing understood in <10s
3. **Discovery** — rich, contextual, enjoyable *before* AI
4. **Gurman** — genuinely useful planner that reasons transparently
5. **Business CRM** — AI-assisted workflow
6. **Social & multiplayer**
7. **Marketplace Intelligence** — the graph/memory/prediction work already underway

> The remaining challenge is not inventing features. It is making every promise on the landing page work end to end.

## Launch gate (CTO): do NOT launch until

Site explains Manzil in <10s · Gurman completes ≥1 real end-to-end planning workflow · 100-300 verified businesses with accurate data · trust issues resolved (fabricated metrics, production auth keys, SEO, legal pages, duplicate data) · owners can onboard, manage listings, and see genuine CRM value.
