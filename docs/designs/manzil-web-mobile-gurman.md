# Office Hours Design Brief: Manzil Web Surfaces + Mobile Gurman

**Status:** APPROVED — product direction approved on 2026-09-03  
**Date:** 2026-09-03  
**Decision owner:** Sunnatilla Tursunov  
**Scope:** Product and experience direction only. No implementation code, UI automation, or generation prompts are authorized by this brief.

### Approval and readiness contract

This brief authorizes no code, prompts, route changes, DNS changes, content publication, or deployment. Design exploration requires approval of the product boundary, route disposition, capability-status taxonomy, waitlist schema, and visual-system scope. Implementation requires approved prototype findings plus an engineering Definition of Ready. Production release requires the relevant Definition of Done, a truth audit, accessibility/performance checks, preview approval, and a live route/content smoke test.

## 1. Executive decision

Manzil should not present Gurman as a second web product. The website should be the trusted public entry point to Manzil and its local-business network; Gurman should be introduced as the mobile-first intelligence and planning experience.

The recommended product boundary is:

- **Manzil web:** a clear startup landing page, a useful local-business Discover surface, a concise For Businesses acquisition surface, and a public Docs / Trust Center.
- **Gurman mobile:** a future ChatGPT/Claude-style conversational planner for local life. It should help a person or group turn an intention into a customizable plan across local businesses and services, starting with a birthday scenario and eventually coordinating transport, venue, food, cake, activities, timing, budget, and preferences.
- **Shared foundation:** the same catalog, evidence, capability graph, decision engine, explanations, consent model, and typed tool contracts should support both web and mobile.
- **MCP:** a later interoperability layer over stable internal capabilities. It is not the first product milestone and must not be used to imply that booking or orchestration works today.

This means the current web Gurman / Concierge marketing story is deliberately retired rather than shortened. The main landing page should also be replaced, not removed without a successor. The new homepage earns its place by explaining what Manzil is, how the web and mobile surfaces fit together, what is true today, and what the product is becoming.

## 2. What is being accepted from the latest product decision

The following are treated as intentional product decisions for this brief:

1. **Gurman AI and Concierge pages are removed from the website.** Do not restore them as public web-chat destinations.
2. **Gurman is mobile-first.** The current website may explain Gurman and collect a waitlist, but it should not pretend that a full Gurman chat, booking flow, or app download is available on web.
3. **One startup landing page remains.** It introduces Manzil as a company/product, includes Gurman as one part of the system, and directs people to Discover, For Businesses, Docs, or the mobile waitlist.
4. **Discover is a first-class web product.** It is the local-business browsing, search, category, filter, and detail experience.
5. **For Businesses is a short acquisition page.** It should help a business understand the value, join/claim a listing, and contact Manzil without repeating a full startup manifesto.
6. **Docs is a public product/trust surface.** It explains the system, evidence, limitations, roadmap, and business/API concepts in a way that can support customers and future partners.
7. **Figma and Higgsfield are design tools, not the product truth.** They can create the visual system and motion direction after the product brief is approved; they cannot be used to manufacture claims, catalog data, reviews, availability, or product capabilities.
8. **Liquid glass is global as a visual language, not as a universal decoration.** The material system should be recognizable across all surfaces while keeping text, controls, data, and trust signals legible.

## 3. Premise challenge — the parts worth grilling

### Premise A: “A general ChatGPT-style assistant from day one”

**Challenge:** A broad assistant is easy to describe and hard to trust. If the catalog is sparse, business facts are stale, or an action cannot be completed, a general conversational shell creates the expectation that Manzil knows and can do more than it does.

**Decision:** Keep the conversational ambition, but narrow the first reliable truth domain. The first mobile prototype should be a **local-life decision and planning assistant**, not a general-purpose answer engine. It can understand broad natural-language intent, but its recommendations must be grounded in verified local entities, capabilities, constraints, and freshness.

**Test:** Can a new user describe a four-person birthday in ordinary language, understand the plan Gurman proposes, change one constraint, and see exactly why the revised plan changed? If not, more model breadth is not the answer; better evidence, constraint handling, and explanation are.

### Premise B: “Claude with MCPs”

**Challenge:** MCP is a transport and tool-discovery pattern, not a trust model or product experience. Exposing unstable or overly powerful tools before identity, consent, idempotency, availability semantics, and business-side ownership are ready would turn the most important promise into a demo hazard.

**Decision:** Build the internal capability contracts first. A future MCP adapter should begin read-only—search verified providers, inspect capabilities, explain evidence, create a draft plan—then graduate to explicitly consented mutations such as requests, holds, and bookings only when those actions are real and reversible. The mobile UX should remain coherent if the underlying tool transport changes.

**Test:** Every future tool can answer: who owns this data, when was it checked, what is its confidence/freshness, what side effect can occur, what consent is required, can the request be retried safely, and how is failure surfaced?

### Premise C: “A four-friend birthday is the first audience”

**Challenge:** It is a strong demonstration because it combines multiple needs and people, but it hides difficult group behavior: conflicting preferences, budget ownership, approval, partial availability, and last-minute changes.

**Decision:** Use the birthday as the flagship scenario, not as a hardcoded vertical. Model it as a reusable **Experience Workspace** with participants, shared constraints, candidate options, votes/approvals, dependencies, and a plan state. The first test can stay small, but the architecture must not encode “birthday” as the only product type.

**Test:** Create one non-birthday parallel scenario—e.g. a small team dinner or visiting-friend day—and verify that the same intent, constraint, evidence, and plan primitives still work.

### Premise D: “The website should be removed because it repeats Gurman”

**Challenge:** Removing repetition is right; removing the public front door would make Manzil harder to understand, discover, trust, and join. The current landing page also contains product claims and visual behavior that need truth-first cleanup, so simply keeping it is not enough either.

**Decision:** Replace the current landing page with a startup landing page that has a different job from Gurman: explain Manzil’s system and route visitors to the right next step. It should not be another Gurman sales page.

**Test:** In a five-second first-impression test, users should be able to answer “What is Manzil?” and choose between Discover, For Businesses, Docs, and mobile Gurman waitlist without first opening a chat.

### Premise E: “Futuristic liquid glass everywhere”

**Challenge:** Transparent panels over a dark cinematic background can look premium in a screenshot and become unreadable, slow, repetitive, or inaccessible in use. The attached live homepage also shows why visual effects must not be allowed to obscure the page’s basic information hierarchy.

**Decision:** Use liquid glass as a **controlled material system**: a small number of surface levels, strong solid fallbacks, deliberate contrast, reduced-motion behavior, and content-first responsive layouts. Glass is strongest for transient or elevated surfaces; dense business data, filters, docs reading, and trust/legal content should use more opaque surfaces.

**Test:** A user can read a business card, operate filters, understand a docs page, and complete a waitlist form in light mode, dark mode, narrow mobile width, and reduced-motion mode without loss of meaning.

### Premise F: “The business subdomain should be free”

**Challenge:** `biz.manzilgroup.uz` may be possible without an additional application subscription if the existing DNS and hosting plan support a custom domain, but that is an infrastructure fact to verify—not a product promise. A subdomain also needs canonical URLs, locale behavior, auth continuity, analytics, and a clear relationship to `/business`.

**Decision:** Design `/business` as the canonical route first. Treat `biz.manzilgroup.uz` as an alias or campaign entry point pending DNS/Vercel verification. Do not publish “free” or promise the subdomain until the actual account, DNS control, deployment, redirects, and SSL are checked.

**Test:** A visitor arriving at either host sees the same approved business experience, one canonical URL, preserved language, working auth/join flow, and no duplicate SEO index.

## 4. Product thesis

**Manzil is the trust layer for local life.** It helps people find real businesses today and, through Gurman, turn a wish into a coordinated local experience tomorrow.

The differentiator is not “AI can chat.” The differentiator is that Manzil can connect human intent to a real local capability graph, show the evidence behind a recommendation, keep uncertainty visible, and eventually coordinate consented actions across providers.

A useful product sentence for internal alignment:

> Manzil helps people move from “what should we do?” to a trustworthy local plan; Discover makes the network visible, and Gurman makes the plan adaptive.

This statement deliberately avoids saying that current web or mobile surfaces can book, pay, guarantee availability, or coordinate providers. Those capabilities belong to the roadmap and must be claimed only when verified.

## 5. System boundary

### Public web now

- Explain Manzil’s identity, purpose, and trust position.
- Let users discover local businesses through real catalog data.
- Let business owners join, claim, or understand the network.
- Let users read how the platform and its AI work.
- Collect interest for mobile Gurman.

### Mobile Gurman next

- Understand a natural-language local-life intention.
- Ask only the highest-value clarifying questions.
- Convert preferences into structured constraints.
- Retrieve grounded providers and capabilities.
- Propose explainable options or a multi-service experience plan.
- Let a person or group revise, compare, vote, approve, and remember a plan.
- Clearly distinguish suggestion, draft, request, hold, confirmation, and completed experience.

### Not claimed at this stage

- Full web chatbot.
- Autonomous bookings or payments.
- Guaranteed real-time availability across all providers.
- Complete city coverage.
- App-store downloads before the app exists.
- MCP-based external execution before internal tools are stable.
- AI-generated facts, reviews, prices, operating hours, or testimonials.

## 6. Current-state truth table for the redesign

| Surface / capability | Direction for this brief | Public claim allowed now |
|---|---|---|
| Main homepage | Replace current repetitive Gurman-led page | Manzil’s mission, current web surfaces, mobile Gurman waitlist |
| `/gurman` page | Deliberately removed; do not restore | Localized `308` to the mobile waitlist is recommended; never serve web-chat marketing |
| `/concierge` page | Deliberately retired | Same localized `308` contract as `/gurman` is recommended; never advertise a web concierge |
| Discover | Redesign as the primary web utility | Real catalog entities, current fields, honest empty/unrated states |
| Business landing | Short, conversion-oriented, canonical at `/business` first | Join/claim/value only where supported |
| `biz.manzilgroup.uz` | Candidate alias | “Available after infrastructure verification,” not guaranteed |
| Docs / Trust Center | Redesign as public source of truth | Product behavior, evidence policy, limitations, roadmap, legal drafts marked appropriately |
| Mobile Gurman | Waitlist / concept until app is built | Product direction and waitlist; no download or live-app claim |
| MCP | Future platform adapter | Roadmap only until tools, auth, consent, and execution are verified |
| Booking / payment / itinerary execution | Future capability | Never simulate as live |

## 7. As-built and deployment baseline

The product decision is intentional, but the current source and deployed site are not yet synchronized. A public, unauthenticated probe on **2026-09-03** recorded this baseline:

- `https://manzilgroup.uz/uz` → `200`; the response still contains Gurman marketing, `AI Live`, the `85%` metric, Google Play/app-download language, and Gurman references.
- `https://manzilgroup.uz/uz/gurman` → `200`; the old Gurman marketing surface is still deployed.
- `https://manzilgroup.uz/uz/concierge` → `200`; a web-concierge surface is still deployed.
- `https://manzilgroup.uz/uz/waitlist/gurman` → `200`; it is the existing production waitlist concept, but its source/API/SEO contract still needs reconciliation.
- The working tree reflects the intentional deletion of the Gurman page and the Concierge route’s intended retirement, so this is deployment/source drift rather than a reason to restore the pages.
- Live catalog coverage/count, field-level freshness, and the exact production data mode are **not established by this brief** and must be measured before making coverage or freshness claims.

**Recommended legacy-route contract:** permanently redirect both `/{locale}/gurman` and `/{locale}/concierge` with a localized `308` to `/{locale}/waitlist/gurman`, preserving locale and query parameters only when safe. The target must be a waitlist explanation, not a live chat. Verify this contract in preview and production; navigation, footer, business-profile CTAs, sitemap, metadata, cached output, and E2E tests must agree. If the product owner instead wants a hard retirement, use an explicit `410`/`404` consistently—never leave a live marketing page at either URL.

Before implementation, record and reconcile the following rather than assuming the desired route state already exists:

- current production responses for the old Gurman, Concierge, and waitlist URLs;
- source routes versus deployed routes and any cached/stale deployment output;
- navigation, footer, business-profile CTAs, sitemap, metadata, and E2E references to retired surfaces;
- whether Discover is using production API data or an explicit development fixture;
- live catalog coverage and field availability, with a dated count rather than a broad coverage claim;
- the actual status of the mobile repository prototype, test APKs, beta/store release, network, auth, and persistence;
- the actual Vercel project, DNS, SSL, canonical-host, and redirect setup before introducing `biz.manzilgroup.uz`;
- documentation publication status, including legal-review and placeholder fields.

The redesign must not quietly turn deployment drift into a product claim. A page being present in source, present in a prototype, or returning `200` in production are different facts and must be tracked separately.

### Capability status contract

Use one status vocabulary in copy, design, docs, code, and QA:

- **Live:** backed by a tested production route or API and safe to describe as available.
- **Preview:** a static or research artifact with a persistent visible label; no real side effect.
- **Planned:** documented future direction; no action affordance and no implication of current availability.
- **Unavailable:** intentionally disabled or blocked, with a plain explanation where useful.

Trust labels also need to remain distinct: `listed`, `claimed`, `verified business`, `verified visit`, `review evidence`, `platform-derived`, and `sponsored` are not interchangeable. “Claimed” does not mean that a visit or review was verified, and “platform-derived” does not mean a provider supplied the fact.

## 8. Production truth gate for Discover

Public Discover surfaces must use production-backed data only. Development fixtures may exist behind an explicit development switch but must be impossible to deploy accidentally. Missing fields render as omitted, unknown, or “not provided”—never as numeric fallbacks, hardcoded open states, stock imagery presented as a business photograph, or generic “verified” labels. If field-level source and freshness cannot be shown reliably, the design must not promise freshness; it should show the narrower truth that is actually supported.

Before the first redesign implementation, create a compact claim/evidence matrix with: claim, surface, source field or document, status (`live`, `preview`, `planned`, `unavailable`), owner, verification date, review/expiry date, and localization status. This matrix is the approval artifact for words such as “current,” “verified,” “fresh,” “real-time,” “available,” and “book.”



## 9. Recommended information architecture

The website should feel like one product with four jobs, not four unrelated microsites.

### Primary navigation

- **Manzil** — the startup landing page.
- **Discover** — browse and search real local businesses.
- **For Businesses** — join, claim, and understand the business network.
- **Docs** — product, trust, technical, and legal information.
- **Gurman mobile** — a waitlist entry point, visually present but clearly labeled as mobile / coming soon.

Locale paths should remain consistent with the existing localized structure, for example `/uz`, `/ru`, and `/en`, with each primary surface available under the same locale convention. Exact route implementation is a later engineering decision and must be reconciled with the repository before code changes.

### Canonical route model

The canonical waitlist route must be decided before implementation. The current least-disruptive proposal is `/{locale}/waitlist/gurman`, because it matches the existing production concept and backend topic. `/{locale}/gurman-waitlist` may be a redirect alias only if there is a demonstrated need. Do not create two independently maintained waitlist pages.

| Route concept | Job | Primary CTA | Secondary CTA |
|---|---|---|---|
| `/{locale}` | Explain Manzil as the startup and route intent | Explore Discover | Join Gurman mobile waitlist |
| `/{locale}/discover` | Help someone find a real local business | Open a business | Start a search / apply a filter |
| `/{locale}/business` | Convert a business owner into a listing/claim lead | Join or claim | Read business docs |
| `/{locale}/docs` | Build trust and enable understanding | Read how it works | View limitations / roadmap |
| `/{locale}/waitlist/gurman` | Explain mobile Gurman and capture interest | Join waitlist | Return to Discover |
| `/{locale}/businesses/{slug}` | Show the canonical business profile | Call / route / contact where data supports it | Save / share where supported |

### Route disposition matrix

This matrix is a design decision to validate against the repository and production before coding. It is not permission to change routes now.

| Existing surface | Disposition | Canonical / behavior | Content rule |
|---|---|---|---|
| `/{locale}` | Replace | One startup landing | Remove repetitive Gurman-led marketing and unsupported metrics/testimonials |
| `/{locale}/gurman` | Retire | **Recommended:** localized `308` to `/{locale}/waitlist/gurman`; fallback is an explicit 410/404 if product owner chooses hard retirement | Never serve a live web-chat marketing page |
| `/{locale}/concierge` | Retire | **Recommended:** same localized `308` contract; do not maintain a second destination | Remove web concierge promise and stale CTAs |
| `/{locale}/waitlist/gurman` | Keep as canonical | Verify source, production, API topic, schema, SEO, and E2E alignment | Waitlist only; no app-access implication |
| `/{locale}/discover` | Keep and redesign | Canonical public discovery surface | Production-backed data only; honest sparse/unrated states |
| `/{locale}/businesses/{slug}` | Keep and audit | Canonical profile route | Remove any retired Gurman CTA; preserve only supported actions |
| `/{locale}/business` | Keep and shorten | Canonical business acquisition surface | One hero, three factual benefits, one join/claim path, docs/contact |
| `/{locale}/business/register` | Keep if onboarding works | Business onboarding action | Explain fields, consent, and next step; no invented plan benefits |
| `/{locale}/business/pricing` | Rework or redirect to business docs | One canonical commercial explanation | Publish only verified prices/terms; future plans labeled |
| `/{locale}/business/plans` | Rework or redirect | Avoid a second pricing source | No duplicate or stale plan claims |
| `/{locale}/dashboard` | Keep private | Authenticated business product | Not part of public startup navigation except through clear CTA |
| `/{locale}/admin` | Keep private | Internal/admin surface | Noindex; never linked as a public product surface |
| `/{locale}/occasions` and detail routes | Audit before keep | Merge into Discover only if data is production-backed | Retire/noindex static or mock-driven lists |
| `/{locale}/lists` | Audit before keep | Merge into Discover only if useful and real | Retire/noindex static or mock-driven lists |
| `/{locale}/profile` | Keep private if supported | Authenticated user surface | Not a public acquisition destination |
| `/{locale}/docs` | Keep and redesign | Public Docs / Trust Center entry | Published status and update metadata required |
| `/{locale}/trust` or `/about` / `/contact` if present | Consolidate or redirect | One canonical trust/about/contact structure | Avoid duplicate source-of-truth pages |
| `/{locale}/legal/*` | Keep and audit | Canonical legal links | Drafts must be visibly marked and lawyer review noted |
| Root `/` | Preserve only as intentional locale resolver | Redirect consistently to a supported locale | Avoid duplicate indexing and locale ambiguity |

The final disposition for `/occasions`, `/lists`, and existing business/pricing aliases must be based on an as-built route crawl and data audit. If a static feature is not reliable, removing it from public navigation is preferable to leaving a polished false impression.

## 10. Surface design specifications

### 10.1 Manzil startup landing

**Job:** Give Manzil a distinct public identity and help a visitor choose the right next action in under a minute.

**Narrative order:**

1. **Opening:** Manzil is the local-life layer for discovering real places and planning better experiences.
2. **Proof of present value:** Discover real businesses with only the catalog fields that are actually supported; show a dated coverage/truth note rather than implying completeness.
3. **The future product:** Gurman is the mobile intelligence layer that will turn an intention into a customizable local plan.
4. **The system:** Discover → plan → coordinate → experience → remember, with current and future states explicitly labeled.
5. **Trust:** Explain evidence, provenance, uncertainty, and what Manzil refuses to invent.
6. **Paths:** Discover, For Businesses, Docs, and the mobile waitlist.
7. **Footer:** supported locales, contact, legal/privacy, business entry, docs, and no fake app-store badges.

**Hero direction:**

- One clear company-level statement, not the old “tell Gurman your plan” headline.
- A split visual can show a real catalog surface flowing toward a mobile planning concept, but the mobile concept must be labeled as preview / coming soon.
- The first viewport must work even if all animation is disabled.
- Keep one primary CTA: **Explore real places**. The mobile waitlist is the secondary CTA.

**Content rules:**

- Remove unsupported percentages such as a generic “85% time saved” unless a measurement source and methodology exist.
- Remove invented-looking testimonials, review counts, app-store buttons, or claims of thousands of users unless verified.
- Do not show a fake live AI conversation as if it is an available web feature.
- Use a compact status label such as “Gurman mobile — waitlist open” rather than “AI Live.”
- Mark any visual demo as `Preview` or `Illustrative`; never bind synthetic numbers to a real business identity.

### 10.2 Discover

**Job:** Make the existing local-business network useful even without Gurman.

**Core interaction:**

- Search by business name, category, neighborhood, service, or natural language only where the current implementation and data support it.
- Category controls with clear active state and a usable mobile overflow pattern.
- Filters that reflect actual fields: district/area, category, rating when meaningful, price band when present, open-now only when hours are current enough, and claimed/verified state only where the taxonomy is defined.
- Cards with photo, business name, category, area, rating/review count only when sourced, a small capability or atmosphere summary only when grounded, and a clear action.
- A detail page that distinguishes business-provided fields, user review evidence, and platform-derived summaries.
- Honest empty, sparse, unrated, closed, missing-photo, stale-data, and insufficient-data states.

**Information hierarchy:**

1. What is this place?
2. Where is it?
3. Why might it fit?
4. How trustworthy/current is the information?
5. What can I do next?

**Do not design:**

- A marketplace grid that suggests exhaustive coverage if the catalog is sparse.
- Sponsored ranking disguised as relevance.
- A “Gurman recommendation” badge on the website if the current web Gurman is removed.
- Availability or reservation buttons without a real integration.
- Synthetic “best for birthday” labels unless derived from evidence and clearly explained.
- Numeric fallbacks, hardcoded “open” states, generic stock photos presented as business photos, or “verified” labels that collapse claimed/listed/review status.

**Discover experiment:** Start with one flagship task: “Find a quiet dessert/coffee place for four people in a chosen Tashkent area.” Use a fixed, dated, verified provider fixture for prototype testing, including at least one missing-photo, unrated, stale-hours, unclaimed, and insufficient-data state. The fixture must be visibly a research artifact, not a claim about live production coverage.

### 10.3 For Businesses

**Job:** Make a local business owner understand the exchange and take one low-friction next step.

**Page budget:** One focused page: one hero, one explanation of the exchange, three factual benefits, one join/claim CTA, one contact/docs link. Do not repeat the startup manifesto or turn the page into a speculative SaaS dashboard.

**Narrative order:**

1. **Outcome:** Be discoverable when people are already deciding what to do.
2. **How it works:** Create or claim a profile, keep facts current, receive qualified discovery, and eventually participate in experience plans.
3. **What is included today:** Explicit Free plan facts and any verified onboarding path.
4. **What is future / conditional:** Pro/Max benefits, Gurman placement, analytics, campaigns, and future requests should be labeled as planned, limited, or dependent on availability.
5. **Trust obligations:** Owners control business facts; Manzil does not fabricate reviews or promise placement.
6. **CTA:** Join / claim listing; secondary CTA to business docs or contact.

**Subdomain decision:**

- Build and test `/business` first as canonical.
- Verify the actual Vercel project/domain configuration, DNS access, SSL, redirects, authentication, locale selection, analytics, and search indexing before adding `biz.manzilgroup.uz`.
- If the alias is added, use one content source and one canonical URL; do not maintain two independent business sites.
- No “free” or zero-cost claim is allowed until the existing hosting/domain setup confirms there is no incremental cost or operational dependency.

### 10.4 Docs / Trust Center

**Job:** Replace vague trust language with inspectable explanations for users, businesses, and future integration partners.

**Information architecture:**

- **Start here:** What Manzil is; web versus mobile; current status.
- **Discover:** Catalog fields, search/filter behavior, profile provenance, review handling, freshness only if supported.
- **Gurman:** Mobile-first product direction, planning model, explanations, memory, group workspaces.
- **Trust:** What is verified, what is inferred, what is uncertain, and what Manzil refuses to guess.
- **Business:** Listing ownership, profile updates, plans, leads, future capabilities.
- **Technical / MCP:** Internal capability contracts first; future read-only and action tools; auth, consent, idempotency, side effects, and failure semantics.
- **Roadmap:** Current, next, later; no dates unless committed.
- **Legal and privacy:** Current documents, drafts marked for lawyer review, data retention and consent statements only when confirmed.

**Publication status:** Every document needs `draft`, `technical review`, `legal review`, or `published`, plus last-updated metadata and an owner. Unreviewed legal or data-flow statements are not public source-of-truth claims.

**Reading experience:**

- Dense information uses opaque or high-opacity reading surfaces, not low-contrast glass.
- Code/API concepts can be readable without requiring futuristic animation.
- The docs index should expose limitations as prominently as features.
- The status of every future capability should match the shared status contract in Section 7.

## 11. Target mobile Gurman v0 — future acceptance spec, not current capability

Gurman should feel like a conversational assistant, but its core object is a plan/workspace rather than an endless chat transcript. This is a target specification for a future mobile product; the current repository prototype and any APK artifact must not be described as a released app.

### Capability ladder

1. **Waitlist only:** current public state.
2. **Mobile discovery:** real catalog, no planning claims.
3. **Grounded recommendation:** read-only, source-backed providers.
4. **Draft plan:** research prototype, persistently labeled as preview/simulation.
5. **Collaborative planning:** only after workspace, auth, and realtime contracts exist.
6. **Requests, holds, bookings, payments:** only after real provider integrations and reversible action states exist.

### Flagship scenario

A user can say:

> “Four of us want to celebrate a birthday on Saturday evening. We want a calm atmosphere, good food, a cake, transport from Chilonzor, and a reasonable total budget.”

Gurman should eventually:

1. Extract a structured intention and identify missing high-value constraints.
2. Ask a small number of questions only when the answer would materially change the recommendation.
3. Show candidate providers and explain the evidence behind each fit.
4. Assemble a draft experience plan with venue, food, cake, transport, timing, participants, budget, and unresolved dependencies.
5. Let the group edit one item without losing the rest of the plan.
6. Make trade-offs visible: e.g. “keeping the cake and transport under budget means choosing the less central venue.”
7. Let participants vote or approve when collaboration is available.
8. Separate proposed, requested, held, confirmed, and completed states.
9. Never claim a reservation, price, opening hour, or provider commitment without a source or a completed action.

The scenario is a flagship test, not a hardcoded birthday product. A second non-birthday scenario—such as a small team dinner or visiting-friend day—must use the same intent, constraint, evidence, and plan primitives before architecture is considered reusable.

### Conversation behavior

- Start with intent, not a blank “How can I help?” when the entry context provides a scenario.
- Confirm the plan in plain language before presenting many options.
- Keep a visible editable constraint summary.
- Avoid asking for every field at once; use expected information gain.
- Offer “show me alternatives” and “change only X” controls.
- Explain what is known, inferred, missing, and stale.
- Keep the model as a narration and interaction layer; deterministic retrieval, constraints, ranking, evidence, and state transitions decide the substance.

### Mobile waitlist now

**Recommended canonical schema for the first waitlist:** required email; locale derived from the localized route; fixed topic `gurman`; no phone, city, use-case, public position, or count until the API and privacy contract explicitly support them. Add a plain-language notice that the email is being used for Gurman mobile updates, with retention/unsubscribe behavior confirmed before publication. If lawful marketing consent needs a stored field, add it to the backend contract before designing the form; do not imply that consent is recorded when it is not.

The page should ask only for fields the backend can persist and should be rate-limited and abuse-protected. It should explain what joining means and avoid implying a launch date or current app access. The confirmation state should be explicit and useful; no fake download links.

Before implementation, verify the route, `gurman` topic, locale handling, email behavior, privacy copy, rate limit, tests, SEO metadata, and production response together. The approved default is `/{locale}/waitlist/gurman`; `/{locale}/gurman-waitlist` is only a redirect alias if needed.

## 12. Shared architecture direction

The web/mobile split must not create two different truths. The product layer should converge on these primitives:

- **Business / Provider:** identity, ownership, location, contacts, current status.
- **Capability:** what a provider can actually offer, under what constraints.
- **Evidence:** source, timestamp, provenance, confidence, and explanation.
- **Intent:** the user’s goal, people, time, budget, preferences, exclusions, and flexibility.
- **Constraint set:** hard constraints versus soft preferences, with conflict handling.
- **Recommendation trace:** why an option fits, what evidence supports it, and what would change it.
- **Experience Workspace:** participants, shared plan, candidates, decisions, votes, dependencies, and memory.
- **Action state:** proposed, requested, on hold, confirmed, failed, cancelled, or completed.
- **Tool contract:** typed input/output, auth scope, side effects, idempotency key, error type, and freshness.

This is consistent with the CEO Office direction: build the intelligence layer and experience system of record first; use an LLM to communicate decisions, not to invent them. The public website can be useful before the full loop exists, but it must not visually imply that the future loop is already live.



## 13. Global visual direction: liquid glass with a trust spine

### Design position

Manzil should look futuristic and unmistakably premium, but not like an AI-generated gallery of floating cards. The visual identity should combine:

- deep ink / night surfaces that reference the city after dark;
- a restrained Manzil blue as the action and orientation color;
- warm white or mineral text for human readability;
- translucent surfaces only where layering communicates hierarchy;
- thin luminous edges and soft gradients used as orientation, not decoration;
- strong typography and generous negative space as the primary premium signal.

“Liquid glass globally” means the same material tokens, corner logic, border treatment, blur policy, shadows, focus states, and motion principles are shared across pages. It does not mean every paragraph, card, or data table is transparent. The visual system must reconcile the current web’s light/electric-blue marketplace language, the current mobile prototype’s off-white/teal/gold language, and the CEO Office’s dark obsidian/cream/gold direction. Select one canonical role-based palette and document migration rules; do not let three palettes survive as accidental product surfaces.

### Material levels

1. **Base:** stable opaque or near-opaque page background; always readable without blur.
2. **Elevated:** high-opacity glass for navigation, hero controls, selected filters, and compact status panels.
3. **Floating:** stronger blur and luminous edge for modals, command surfaces, or mobile plan summaries.
4. **Reading/data:** opaque contrast-first surface for business details, filters, tables, docs, legal, and long text.
5. **Fallback:** solid equivalent for low-power devices, reduced transparency, failed image/background, or accessibility preference.

### Global tokens to specify in Figma

- Color roles rather than page-specific hex values, including the approved web/mobile theme mapping.
- Text, muted text, border, focus, success, warning, danger, and planned-status roles.
- Surface opacity and blur levels with a no-blur fallback.
- A bounded radius scale; keep dense controls and cards within the approved system rather than making every surface pill-shaped.
- Spacing and content-width scale.
- Type scale for Uzbek, Russian, and English; test Cyrillic and Latin line lengths.
- Icon and illustration rules; no decorative icon if it competes with a business action.
- Motion durations/easing, entrance hierarchy, and reduced-motion behavior.
- Component states: default, hover, focus-visible, pressed, selected, disabled, loading, empty, stale, error, and planned.

### Accessibility and performance gates

- Text and controls must meet WCAG 2.2 AA contrast targets in both themes; translucent effects cannot be used to evade contrast requirements.
- Keyboard focus must be visible against all surfaces.
- Reduced-motion and reduced-transparency preferences must produce a complete, intentional experience.
- No essential information may depend on a background video or Higgsfield-generated animation.
- Images need meaningful alt text or be marked decorative.
- Motion must not delay the primary task or hide the CTA.
- Test mobile network, low-power rendering, and device text scaling before approving full-bleed effects.
- Define a page-load and interaction performance budget before adding blur, video, or 3D assets.

### Page-specific expression

- **Home:** cinematic but calm; one hero composition, not a carousel of AI claims.
- **Discover:** materially quieter; glass supports search and selection while data remains stable.
- **Business:** confident, practical, conversion-oriented; use glass for proof modules, not to make pricing ambiguous.
- **Docs:** editorial and inspectable; glass is an accent around navigation and status, not the reading background.
- **Mobile Gurman waitlist:** a preview of the planning experience with clearly labeled prototype states.

## 14. Figma and Higgsfield handoff (after approval only)

### Figma deliverables

The Figma phase should produce:

1. A Manzil foundation page: role-based color themes, type, spacing, bounded radii, materials, shadows, motion notes, accessibility variants, and migration notes from existing surfaces.
2. Responsive component library: header, navigation, hero, CTA, business card, filter bar, search field, status badge, provenance row, empty state, waitlist form, docs navigation, factual business-benefit block, and footer.
3. Four complete web surfaces: startup landing, Discover, For Businesses, Docs / Trust Center.
4. One mobile Gurman research prototype: waitlist preview, birthday intent, clarification, plan summary, edit-one-constraint interaction, explanation/evidence state, and a deliberate unavailable-action state.
5. Localized content samples in Uzbek, Russian, and English, including long Cyrillic and Latin variants.
6. Prototype annotations that distinguish live, simulated for research, planned, and unavailable.
7. A claim/evidence matrix linked to the prototype content so every visible statistic, label, testimonial, rating, and capability has an owner and status.

### Higgsfield deliverables

Use Higgsfield only for controlled visual exploration and motion studies after the static hierarchy is approved. The output should explore:

- the Manzil material language;
- a city-to-capability graph transition;
- a mobile plan assembling from real-world service categories;
- subtle liquid movement for hero transitions and state changes.

Every motion study must have a static fallback and must not be used to imply live availability, autonomous booking, a real-time AI session, or complete city coverage. The production design source of truth remains the approved Figma system and the verified product behavior.

No Higgsfield or Figma prompts are written in this Office Hours brief. Prompt generation is a later handoff step, after the user approves the product direction and the static system.

## 15. Learning plan: experiment before implementation

The user’s chosen operating principle is to learn and improve through experimentation. The first experiment should test the product boundary and information architecture, not just visual taste. It should start with a low-fidelity core flow before investing in four polished surfaces and elaborate motion.

### Experiment 1A — low-fidelity boundary test

**Artifact:** Clickable low-fidelity flow: startup landing → Discover → business detail → mobile Gurman waitlist. Include one simple mobile Gurman preview card, not a full simulated chat.

**Baseline:** Test the current production homepage and current Discover entry where safe, recording the same task outcomes. The comparison is directional, not a claim of statistical significance.

**Participants:** 6–8 local consumers with at least one recent group outing decision, and 3–4 local business owners or operators. Segment the sample where possible across Uzbek Latin, Russian/Cyrillic, English, mobile web, and accessibility needs. This is a directional usability test, not a market-size claim.

**Consumer tasks:**

1. You want to find a calm birthday venue for four people. Where do you start?
2. You found two businesses. What evidence would make you trust one more?
3. You want Gurman to coordinate venue, cake, food, and transport in the future. Where do you learn what is available today versus planned?
4. Join the mobile waitlist. What do you think will happen after submitting it, and what information are you consenting to receive?
5. What do you believe is live today, a preview, planned, or unavailable?

**Business tasks:**

1. You run a local café. How would you join or claim your profile?
2. What value do you expect today, and what would you need before trusting AI recommendations?
3. Where would you look for profile ownership, data freshness, and future participation rules?
4. Do any page elements imply guaranteed ranking, bookings, analytics, or customer volume?

**Primary measures:**

- time to first useful result;
- task completion and abandonment;
- wrong first destination (Discover versus Gurman waitlist);
- false belief that Gurman is a live web chatbot;
- false belief that a booking or provider commitment occurred;
- ability to recall the evidence behind a choice;
- ability to distinguish current, preview, planned, and unavailable;
- waitlist completion and consent comprehension;
- business understanding of join/claim versus paid placement or guaranteed ranking;
- readability failures under mobile width, text scaling, reduced motion, and reduced transparency.

**Directional success criteria:**

- The new flow performs no worse than the current baseline on starting a real-place task and materially improves correct destination choice.
- At least 6 of 8 consumers identify Gurman as mobile / waitlist rather than a live web chatbot.
- At least 5 of 8 can name the evidence behind a business choice.
- At least 5 of 8 can distinguish what is live from what is future.
- At least 3 of 4 businesses understand the join/claim path and do not infer guaranteed ranking or bookings.
- No participant interprets a simulated animation or prototype state as a completed booking.

These thresholds are decision aids, not product-market proof. Record the denominator, language, device, task wording, and observed failures.

**Guardrail findings that stop high-fidelity implementation:**

- Users cannot distinguish current from future capabilities.
- Users treat paid business placement as unbiased recommendation.
- Users cannot find a useful Discover path without Gurman.
- Liquid glass reduces readability or hides filters/docs.
- The waitlist captures interest but creates an untrue launch expectation.
- Participants interpret a claim, rating, or business photo as verified when it is not.

**Decision after test:** Keep, narrow, or revise the four-surface architecture and web/mobile boundary. Only then create the high-fidelity Figma system and convert the approved result into implementation tickets or design-generation prompts.

### Experiment 1B — high-fidelity design calibration

Only if Experiment 1A passes its trust and navigation guardrails, test the high-fidelity Figma surfaces and one restrained Higgsfield motion study. Compare comprehension and task speed, not only preference. If visual appeal increases false beliefs or slows the core task, reduce the effect even if participants say it looks premium.

### Experiment 2 — “Can the first planning loop be grounded?”

After the information architecture is validated, run a small research prototype using a fixed, dated, genuinely verified provider fixture. Include missing-photo, unrated, stale-hours, unclaimed, and insufficient-data states. The fixture must be visibly a research artifact, not a claim about live production coverage.

The birthday scenario must support one transparent trade-off and one deliberately insufficient-data state. The goal is not to fake bookings; it is to validate intent extraction, constraint editing, explanation, and group-plan comprehension.

A successful prototype must show:

- evidence attached to each provider;
- hard versus soft constraints;
- why the ranking changed;
- what is unavailable or unverified;
- a clear handoff instead of a simulated booking.

An explicit evidence owner should sign the test packet, and the result must be a keep/narrow/revise decision. Do not expand to multi-provider execution until provider capabilities, auth, consent, availability, idempotency, and action-state semantics exist.

## 16. Alternatives considered

### Option A — Minimal web cleanup

Replace the current homepage, retire Gurman/Concierge references, add a waitlist, and leave Discover, Business, and Docs largely as they are.

**Pros:** fastest, least coordination.  
**Cons:** misses the opportunity to create one coherent Manzil system; leaves inconsistent visual language and weak trust/docs surfaces.  
**When to choose:** if the immediate goal is only to stop false web-chat claims.

### Option B — Recommended: four-surface Manzil + mobile Gurman boundary

First establish route/data truth and validate the low-fidelity core flow; then build the startup landing, truth-first Discover, concise For Businesses, and Docs / Trust Center as one design system; position Gurman as mobile waitlist; validate with the experiments above.

**Pros:** aligns web behavior with the actual product stage; gives Manzil a clear identity; creates useful web value now; preserves the long-term MCP/intelligence direction.  
**Cons:** requires product/content discipline and a real status model; does not provide a flashy web chatbot immediately.  
**Recommendation:** choose this.

### Option C — Full future-state platform now

Design and implement the full ChatGPT-like Gurman, collaborative birthday workspace, provider proposals, reservations, payments, and MCP actions at once.

**Pros:** compelling demo and broad narrative.  
**Cons:** high trust and integration risk; would encourage fabricated or simulated availability; conflicts with current evidence and the user’s decision that Gurman is mobile-first.  
**Recommendation:** reject as the first build.

## 17. Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Website feels like a brochure | Discover may be hidden behind branding | Make Discover the primary CTA and usable independent of Gurman |
| Gurman feels like vaporware | Waitlist without a concrete promise loses trust | Show a narrow, honest mobile preview and explain what is being built |
| Catalog is too sparse | AI/planner promise outruns supply | Use honest coverage and empty states; start with a verified provider cohort |
| Liquid glass harms usability | Visual polish becomes friction | Opaque data/reading surfaces, fallback tokens, contrast, text-scaling, and reduced-motion tests |
| Business monetization biases recommendations | Trust is the core product asset | Separate sponsorship/placement from relevance; disclose commercial relationships |
| Subdomain creates duplicate surface | SEO, auth, and maintenance drift | Canonical `/business`, verified alias, one content source |
| MCP becomes a shortcut | Tool demos can hide unsafe side effects | Read-only contracts first; typed auth, consent, idempotency, failure states |
| Future and current states blur | Users cannot make correct decisions | Shared status vocabulary, claim/evidence matrix, docs, no fake live indicators or app links |
| Deployment drift survives redesign | Source, preview, and production tell different stories | Route/content crawl, preview smoke test, production probe, cache/rollback plan |
| Legal or privacy language overreaches | Users/businesses may rely on unfinished terms | Publication statuses and lawyer review before legal reliance |

## 18. Definition of done for this design phase

This Office Hours phase is complete only when:

- the user approves the product boundary and alternatives decision;
- current source-versus-production route behavior is recorded;
- the four web surfaces and mobile boundary are documented;
- live, preview, planned, and unavailable states are named;
- the waitlist route and persistable schema are explicitly chosen;
- the liquid-glass system has theme mapping, bounded radii, contrast, performance, reduced-motion, reduced-transparency, and fallback rules;
- the claim/evidence matrix exists for prototype content;
- low-fidelity experiment tasks, baseline, measures, and stop criteria are ready;
- the business subdomain is marked as an infrastructure verification task, not a promise;
- the Figma and Higgsfield scope is clear without prematurely generating prompts;
- no implementation code, route change, DNS change, content publication, or deployment has been made as part of this phase.

## 19. Proposed next sequence after approval

1. **As-built / production truth audit:** crawl routes, compare source and production, identify stale links and claims, inspect mock-data switches, and record current mobile/waitlist/domain status.
2. **Route and capability status decisions:** choose the old Gurman/Concierge redirect or 410/404 contract, canonical waitlist URL/schema, route disposition, trust taxonomy, and source-of-truth matrix.
3. **Low-fidelity core-flow prototype:** homepage → Discover → business detail → mobile waitlist, with truth states.
4. **User test:** run Experiment 1A, record baseline comparison and segmented findings, and make a signed keep/narrow/revise decision.
5. **Design-system / liquid-glass refinement:** create the Figma foundation and high-fidelity surfaces only after the core flow passes trust gates; use Higgsfield for restrained motion studies with static fallbacks.
6. **Explicit product-owner approval:** approve the revised design and content status matrix.
7. **Engineering Definition of Ready:** reconcile routes, API/schema, localization, auth, domain, analytics, data truth, and rollback plan.
8. **Implementation:** build the approved surfaces only; do not restore the web Gurman page or imply live mobile capability.
9. **Sequential QA and truth audit:** routes, localization, data states, accessibility, performance, mobile/desktop behavior, content claims, privacy/security, and links.
10. **Preview approval:** confirm the preview matches the approved design and status matrix.
11. **Production canary and live smoke test:** verify redirects, canonical links, waitlist behavior, data source, and no stale claims.
12. **Ship only with explicit release approval:** make the working tree, checks, commit, push, and deployment state explicit and verified.

## 20. Source basis

This brief synthesizes the current Manzil repository and CEO Office material, especially:

- `ceo-office/manzil-3.0/00-product-bible-v1.md`
- `ceo-office/manzil-3.0/03-ai-user-journey-bible.md`
- `ceo-office/manzil-3.0/08-ux-specification-master-plan.md`
- `ceo-office/manzil-3.0/16-capability-graph-architecture.md`
- `ceo-office/manzil-3.0/20-trust-and-platform-capabilities.md`
- `ceo-office/manzil-3.0/21-experience-system-of-record.md`
- `ceo-office/manzil-3.0/22-intelligence-layer.md`
- `ceo-office/manzil-3.0/23-ai-architecture-amendment.md`
- `ceo-office/manzil-3.0/24-collaborative-workspace.md`
- `ceo-office/manzil-3.0/27-truth-economy-positioning.md`
- `ceo-office/manzil-3.0/28-definition-of-done.md`
- `docs/evidence/GURMAN-V0.md`
- `docs/evidence/TRUST-AUDIT.md`
- `docs/superpowers/specs/2026-07-27-gurman-ai-recommender-design.md`

**Approval needed:** Approve this direction, request revisions, or start over with a different product boundary. For an actionable approval, the recommended decisions are:

1. replace the current homepage rather than keep its repetitive Gurman-led narrative;
2. keep web surfaces to startup landing, Discover, short For Businesses, and Docs / Trust Center;
3. retire `/gurman` and `/concierge` without restoring web chat; use localized `308` redirects to `/{locale}/waitlist/gurman` unless you explicitly choose a hard `410`/`404`;
4. use `/{locale}/waitlist/gurman` as the canonical waitlist route, with email required, locale derived, and topic fixed to `gurman`; do not add unsupported fields yet;
5. treat `biz.manzilgroup.uz` as a conditional alias after DNS/Vercel verification, not a guaranteed zero-cost promise;
6. use liquid glass as a bounded, accessible material system with opaque data/docs fallbacks, not as universal transparency;
7. test the low-fidelity homepage → Discover → business detail → mobile waitlist flow before high-fidelity Figma/Higgsfield production;
8. keep Gurman mobile-only and MCP read-only/future until the internal contracts, evidence, consent, idempotency, and real actions are ready.

No code, route changes, DNS changes, content publication, or generation prompts should be produced until that choice is made.
