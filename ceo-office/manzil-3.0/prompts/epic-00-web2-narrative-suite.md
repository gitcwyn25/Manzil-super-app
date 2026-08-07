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

## Launch gate (CTO): do NOT launch until

Site explains Manzil in <10s · Gurman completes ≥1 real end-to-end planning workflow · 100-300 verified businesses with accurate data · trust issues resolved (fabricated metrics, production auth keys, SEO, legal pages, duplicate data) · owners can onboard, manage listings, and see genuine CRM value.
