# Epic 14 — Experience Commerce Platform (ECP)

> QUEUED after Epic 13. **The biggest long-term competitive advantage — not AI, not CRM, not the marketplace.** Manzil stops being a booking app and becomes an experience-economy platform: the user buys ONE experience, not ten services.

## Core philosophy

Nobody wants "a restaurant" or "a hotel". They want a date night, anniversary, birthday, family weekend, wedding, graduation, proposal, vacation, team building. **Organize the market around intent, not categories.** Instead of "which restaurant?", the AI asks "what are you trying to create?" (impress someone · celebrate graduation · relax after exams · surprise parents · organize a proposal) and designs the whole experience around that outcome.

## Implement

Intent engine · experience composer · experience templates · bundle engine · experience marketplace · participant engine · shared decision engine · voting engine · budget engine · **revenue split engine** · vendor coordination engine · experience timeline · status engine · analytics · memory integration · workspace integration · business bundle publishing.

**Experience Engine flow:** intent → requirements → budget → participants → location → time → business graph → candidate plans → optimization → proposal.

**Templates published by businesses:** restaurant "Birthday Package" (dinner + cake + decoration + live music), hotel "Weekend Escape" (room + spa + breakfast + transport), salon "Wedding Preparation" (hair + makeup + photography + flowers). Users customize any template.

**Multi-business bundles:** the marketplace auto-connects complementary businesses (restaurant + florist + photographer + limo) into one bundle with **automatic revenue sharing**.

**Budget distribution, visible to everyone:** $400 → restaurant $180 · cake $50 · flowers $40 · photography $80 · transport $50.

**Experience timeline:** planning → confirmed → preparation → travel → arrival → experience → completion → memories.

**Vendor coordination:** after booking, every provider receives only the information relevant to them, with status updates.

**Experience memory:** photos, reviews, timeline, expenses, businesses, friends, achievements, favorites, AI summary — stored in the Workspace Timeline.

**AI:** intent understanding, experience composition, bundle + budget + schedule optimization, business selection, alternatives, conflict resolution, summarization.

**Events:** ExperienceCreated · ParticipantJoined · VoteSubmitted · BundleGenerated · BundleAccepted · BudgetChanged · VendorConfirmed · ExperienceCompleted · MemoryCreated.

**Analytics:** completion rate, budget accuracy, participant satisfaction, rebooking, bundle adoption, cross-business revenue, planning time, AI acceptance rate.

**Revenue model beyond booking commission:** bundle creation fees · premium AI planning · revenue sharing · vendor subscriptions · sponsored experiences · insurance · concierge premium · enterprise event planning.

**Tests:** unit, integration, AI planning, revenue split, timeline, workspace collaboration, performance. **Docs:** architecture, experience lifecycle, bundle engine, revenue distribution, vendor coordination, workspace integration, analytics, sequence diagrams.

## Binding execution constraints (orchestrator-added)

1. **Revenue split is money** — it requires the M7 payment ledger with refunds/reconciliation. Build the split *contracts and allocation logic* here; actual disbursement is gated on payments, and partial-failure semantics (one vendor confirms, another declines) must be designed, not discovered.
2. Builds directly on Epic 11's collaborative Workspace (participants, voting, decisions) and Epic 13's bundle-capable marketplace — no parallel implementations.
3. Multi-vendor booking is a distributed transaction: define compensation/rollback explicitly (a bundle where the cake confirms and the venue fails must resolve deterministically and honestly).
4. Templates are business-authored data, not code.

## Success

A user describes an intent instead of searching categories · Gurman composes a complete multi-business experience · multiple participants collaboratively refine and approve it · revenue allocates automatically across businesses · every provider has coordinated tasks and timelines · the finished experience becomes a reusable memory in the Workspace Timeline · businesses publish reusable templates others personalize.

**Optimizes the entire experience lifecycle — intent → collaboration → execution → memory — where competitors optimize only booking.**
