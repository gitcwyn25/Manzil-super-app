# Implementation Prompt 02 — Epic 1: WOW Flow, Sprint 1 (Auth & First-Time Experience)

> **Status: QUEUED (2026-08-05). Do not execute until every precondition below is ✅.**
>
> **Preconditions (user-specified):**
> 1. ⏳ Foundation reaches SPRINT DONE (web fleet running)
> 2. ⏳ Foundation diff reviewed
> 3. ⏳ `design-foundation-v1.0` tagged
> 4. ⏳ Web launch gate passes (Genesis Record published)
>
> **Governance blockers — RESOLVED (user/CTO decisions, 2026-08-05):**
> - **Target platform: React Native + Expo (ADR-004).** Kotlin/Compose app frozen as
>   reference implementation.
> - **Sequencing (authorized chain, no shortcuts):** web launch → Genesis Record →
>   review → WOW Flow wireframes → review → mobile design foundation →
>   `design-foundation-mobile-v1.0` tag → this prompt, SPLIT into three:
>   - **02A** — Splash · Welcome · navigation shell → DONE → review
>   - **02B** — Authentication · OTP → DONE → review
>   - **02C** — Interests · AI Introduction · Profile · Home Arrival → DONE → review
>   Each sub-prompt inherits every rule below; each ends in review before the next.

---

## The prompt (verbatim, for execution when unblocked)

You are continuing implementation of the Manzil application. The repository has entered **Strategy Freeze v1.0**. You MUST follow every existing governance rule, ADR, Product Bible principle, Design System token, and implementation standard already present in the repository. Do NOT redesign anything. Do NOT introduce new dependencies unless absolutely required by existing architecture. Do NOT invent APIs, navigation, colors, typography, spacing, animations, or components. If documentation conflicts with implementation, STOP and report the conflict instead of making assumptions.

### Objective

Implement the complete **WOW Flow UI** for first-time users. UI layer and navigation flow only: no backend integration, no business logic, no booking, no AI execution. Production-ready UI with mocked state where required.

### Screens (production quality — v1.1 order per wireframe review, `design/flows/wow-flow/REVIEW-v1.md`)

1. Splash · 2. Welcome · 3. Sign In · 4. Register · 5. OTP Verification · 6. Permissions Introduction (value copy per review §3) · 7. Interest Selection (intent framing per review §2) · 8. AI Introduction (promise copy per review §4) · 9. Profile Completion · 10. AI Personalization (AFTER profile per review §1) · 11. Ready Celebration (~2s, NEW per review §6) · 12. First Home Arrival (non-empty per review §5)

### Requirements (every screen)

Only approved design tokens · reusable Design System components · dark mode if defined · safe areas · accessibility settings · reduced motion · small and large screens · Discover · Plan · Experience philosophy · persistent AI bar hidden until First Home Arrival.

### Navigation

Only the documented navigation between these screens. No unfinished routes exposed; future screens guarded behind existing navigation structure.

### Animations

Only animations documented in the UX Blueprint (splash logo reveal, card fade/slide, staggered onboarding cards, progress indicator transitions, smooth page transitions). Reduced motion respected.

### Components & Mock Data

Reusable components only; no duplicated layouts; extract common UI. Structured mock data only where necessary, clearly isolated for future replacement; no invented backend behavior.

### Code Quality (before completion)

No dead code · no duplicate components · no unused imports · strict TypeScript (or Kotlin equivalents if target is the Compose app) · lint passes · project builds.

### Documentation

Update implementation docs only if implementation required a documented change; otherwise untouched.

### Deliverables

Complete WOW Flow UI · reusable authentication components · navigation across the flow · production-ready layouts · isolated mock state.

### Completion Criteria

Build passes · typecheck passes · lint passes · navigation works · accessibility audit passes for implemented screens · zero governance violations. Reply exactly `DONE` — no explanations, summaries, or progress updates.
