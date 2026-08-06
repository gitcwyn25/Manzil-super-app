# Epic 11 — Collaborative Workspace Platform

> QUEUED after Epic 10 (deliberately — depends on the AI, memory, reasoning, and evaluation foundations). **The Workspace is the primary domain object of Manzil.** Users do not collaborate through chat; they collaborate through structured planning. See [24-collaborative-workspace.md](../24-collaborative-workspace.md) and Product Bible Appendix D.

## Why this is category-defining

Every platform — even AI ones — is single-user: `User → Search/AI → Business → Booking`. Real life is multiplayer: coffee for two, an 8-person birthday, a wedding with bride/groom/parents/vendors, a business meeting across two companies, a family vacation. Each is naturally a Workspace: participants · goals · timeline · businesses · negotiations · AI · documents · payments · decisions · memories — a living object that exists **before, during, and after** the event (created → planning → negotiating → booking → experiencing → remembering → archived → referenced again).

## Implement

Workspace domain · participant domain · role & permission system · invitations · presence service · real-time collaboration · Workspace Timeline · decision objects · voting engine · conflict resolution engine · constraint engine · negotiation engine · availability engine · location optimization · budget optimization · shared memory · workspace intelligence · readiness engine · confidence engine · progress engine · split-payment contracts · business proposal engine · offer comparison engine · workspace notifications · offline sync contracts · activity feed · version history · audit log.

**Roles:** Owner · Admin · Editor · Participant · Viewer · Guest · Business · AI.

**Decision objects:** business selection · date · time · budget · guests · transportation · venue · services · payments.

**Voting:** approve · reject · maybe · favorite · weighted · **anonymous** (weddings, corporate) · consensus tracking.

**Constraints:** budget · distance · time · availability · accessibility · cuisine · dress code · children · pets · weather.

**Negotiation:** businesses submit *structured offers* (not chat) — "private room +$20", "cake included", "free decorations", "VIP parking". AI compares; humans approve. Negotiation objects are machine-readable ({constraint, owner, current, desired, status}).

**Gurman as moderator:** synthesizes conflicting member preferences into candidate sets, never dominates, always explains reasoning, always tracks unresolved conflicts, proposes compromises when it detects conflict (luxury vs cheap → higher food quality at the average budget).

**Real-time:** presence, typing, editing, live votes, timeline updates, synchronization (WebSockets).

**Group memory:** the Workspace remembers ("last year parking was poor — here are better options"), distinct from personal memory.

**Readiness over a naive Book button:** "Not ready — waiting for Kamila's vote, restaurant response, budget confirmation"; workspace health/progress/confidence percentages.

**Metrics:** workspace completion rate · consensus time · decision count · conflict resolution time · booking success · repeat collaboration.

**Tests:** unit · integration · real-time · permission · synchronization · voting · negotiation · conflict resolution · performance.

**Docs:** architecture · sequence diagrams · state machines · permission matrix · timeline model · collaboration lifecycle.

## Binding execution constraints (orchestrator-added)

1. **Solo is the default, always** (Bible Appendix D): a one-person Workspace must have zero extra friction — no invite prompts, no collaboration chrome. Every collaborative capability is additive and optional.
2. **Dependencies are real:** WebSocket/presence needs the M5 notification+realtime infrastructure; split payments need M7; business proposals need the M6 booking engine. Ship the domain, permission, voting, constraint, negotiation, and intelligence layers first; anything requiring absent infrastructure exposes honest unavailable states — never fake confirmations.
3. **Design the multi-participant model into the Workspace tables from their first migration** — do not retrofit participants onto a single-owner schema.
4. Reuses (do not fork): Epic 08 constraint/replacement/reason codes, Epic 05 memory tiers per participant, Epic 03 event/job/metric contracts, Epic 10 evaluation signals.

## Success

Workspaces support multiple participants collaborating with businesses and Gurman from creation through planning, booking, experience, and archival — with full auditability, real-time synchronization, and evidence-driven decisions.
