# Implementation Prompt 02 — Epic 1: WOW Flow, Sprint 1 (Auth & First-Time Experience)

> **Status: QUEUED (2026-08-05). Do not execute until every precondition below is ✅.**
>
> **Preconditions (user-specified):**
> 1. ⏳ Foundation reaches SPRINT DONE (web fleet running)
> 2. ⏳ Foundation diff reviewed
> 3. ⏳ `design-foundation-v1.0` tagged
> 4. ⏳ Web launch gate passes (Genesis Record published)
>
> **Governance blockers surfaced per this prompt's own STOP rule — resolved by
> standing defaults, overridable by the user:**
> - **Target platform:** WOW Flow screens (splash, OTP, permissions, safe areas) are
>   mobile-app screens. The mobile stack decision is parked at "keep Kotlin/Compose"
>   (vision doc adoption note). Default target: **the existing Kotlin/Compose app**.
> - **Sequencing:** the authorized build order (doc 14) puts ① WOW wireframes and
>   ② hi-fi + ③ mobile design-system implementation BEFORE production UI, and the
>   obsidian/gold mobile tokens do not exist in code yet ("use only approved design
>   tokens" is unsatisfiable today). Default chain: web launch → WOW Flow wireframes
>   (approval artifact) → Compose token foundation (`design-foundation-mobile-v1.0`)
>   → THEN this prompt executes.

---

## The prompt (verbatim, for execution when unblocked)

You are continuing implementation of the Manzil application. The repository has entered **Strategy Freeze v1.0**. You MUST follow every existing governance rule, ADR, Product Bible principle, Design System token, and implementation standard already present in the repository. Do NOT redesign anything. Do NOT introduce new dependencies unless absolutely required by existing architecture. Do NOT invent APIs, navigation, colors, typography, spacing, animations, or components. If documentation conflicts with implementation, STOP and report the conflict instead of making assumptions.

### Objective

Implement the complete **WOW Flow UI** for first-time users. UI layer and navigation flow only: no backend integration, no business logic, no booking, no AI execution. Production-ready UI with mocked state where required.

### Screens (production quality)

1. Splash · 2. Welcome · 3. Sign In · 4. Register · 5. OTP Verification · 6. Permissions Introduction · 7. Interest Selection · 8. AI Introduction · 9. AI Personalization · 10. Profile Completion · 11. First Home Arrival (UI only)

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
