# Launch Gate Review Checklist

## Four review dimensions (every artifact, post-Genesis)

1. **Correctness** — does it work reliably?
2. **Consistency** — does it follow the frozen design and product principles?
3. **Simplicity** — is it the least complex solution that satisfies the requirement?
4. **Evidence** — is there measurable justification for keeping or changing it?

The question is never "is this a good idea?" — it is "does the evidence support keeping this implementation?" Principles stay fixed; implementation evolves on evidence.

## Standing evaluation lens (all future artifacts)

Every proposed change is evaluated against six questions; if it improves none of
them, the default is **do not make the change**:

1. Does it strengthen confidence?
2. Does it reduce friction?
3. Does it preserve Discover · Plan · Experience?
4. Does it reinforce the Workspace Timeline as the product's center?
5. Does it respect the design foundation and governance?
6. Does it improve the user's ability to complete a real experience?

Applied to every launch-gate evidence entry, starting with the Genesis Record
(2026-08-05). Suggestions in review must tie back to established product
principles — no untethered subjective asks ("prettier", "trendier", "more glass").

## 0. Track micro-review (each parallel track's commit, before integration proceeds)

No duplicated components · no new styling values · no token violations · no navigation drift · no literal strings · no new icon sources (vm/icons.tsx or nothing). **Protect the Kit:** screens adapt to the Kit, never vice versa; a missing primitive is added to the Kit intentionally after review, not forked inside a screen. Heuristic: if two screens independently need the same visual treatment, it belongs in the design system.

**Post-launch flagship KPI (Discover):** Discovery-to-Planning Conversion = users opening Concierge ÷ users viewing Discover — measures whether exploration transitions to planning; stronger than page views.

## 0.5 Integration sweep — five passes (after all tracks land, before the launch gate)

Coding risk falls as tracks complete; **integration risk rises**. The sweep verifies the system, not the screens:

1. **Visual consistency** — typography, spacing rhythm, color roles, elevation, motion timing.
2. **Component consistency** — duplicates, prop consistency, token usage, icon usage.
3. **Product language** — cross-screen AND cross-locale terminology (each locale keeps its own canonical glossary: one approved term per concept per language — Plan vs Workspace · Experience vs Event · Business vs Place · Booking vs Reservation · Favorite vs Saved — enforced across landing-copy, crm-copy, shared ui-copy); CTA consistency; empty-state voice.
4. **Interaction** — navigation flow, loading states, error handling, accessibility, focus order.
5. **Product philosophy** (the pass most teams skip) — per screen: does it increase confidence? reduce cognitive load? guide rather than overwhelm? keep Gurman helpful, not dominant? clearly answer "what can I do next?"

## 1. Build health

Production build succeeds · typecheck zero errors · lint zero errors (or explicitly accepted warnings) · no unexpected console errors at startup.

## 2. Visual

Typography consistency · vertical rhythm · spacing consistency · color-token compliance · responsive behavior · animation quality · loading experience · empty states · error states.

## 3. Design-system compliance

No hard-coded colors · no hard-coded spacing · no inconsistent radii · consistent shadows · consistent motion timings.

## 4. Architecture

Components composable · business logic separated from UI · clean API boundaries · predictable state · Tool Orchestrator integration points isolated.

## 5. Performance

Initial bundle characteristics · first meaningful render · image optimization · lazy loading · animation smoothness · network efficiency.

## 6. Accessibility

Keyboard navigation · screen-reader labels · focus visibility · contrast · touch targets · reduced-motion behavior.

## 7. Product (the one that matters most)

Ignore the code and ask: **does this feel like Manzil?** Does it inspire confidence · feel premium · make the AI feel intentional rather than gimmicky · leave a memorable first impression · guide every screen toward a meaningful outcome?
