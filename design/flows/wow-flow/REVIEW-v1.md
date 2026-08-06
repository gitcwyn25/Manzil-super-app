# WOW Flow Wireframes v1.0 — Review Record

**Date:** 2026-08-06 · **Reviewer:** CTO/CPO (user) · **Verdict: APPROVE WITH MINOR CHANGES ✅**
**Scores:** Product ✅ · UX ✅ · Architecture ✅ · Simplicity ✅ · Governance ✅ · Ready for Hi-Fi ✅

Strengths confirmed: simple linear flow, Sign In/Register merging at OTP, permissions after authentication, AI not the first screen ("AI is the concierge after the user enters the hotel, not the receptionist demanding attention at the door").

## Required amendments (v1.1 — apply before hi-fi)

1. **Reorder:** AI Intro → **Profile** → **AI Personalization** (AI should know name/city/language before asking what interests you — personalization feels smarter).
2. **Interests screen reframed as intent, not Pinterest categories:** "What are you most likely planning today?" — Birthday · Weekend · Haircut · Coffee · Dinner · Travel · Wedding · Family. Framing: "Help Gurman understand you."
3. **Permissions carry value copy**, never bare labels: Location — "To recommend nearby experiences." · Gallery — "To upload memories." · Notifications — "To remind you about bookings." · Microphone — "Talk naturally with Gurman." Confidence comes from explaining value.
4. **AI Intro sells the promise, not the technology:** replace "Meet Gurman AI" with the emotional hook — **"Tell me what you're planning. I'll handle the rest."**
5. **First Home must not feel empty:** even with zero data it immediately answers "what can I do?"
6. **NEW SCREEN (scope now 12):** after Profile, before Home — a ~2-second completion celebration: "✓ You're ready. Let's plan your first experience." Psychologically marks the end of onboarding. Assigned to sub-flow 02C. **Understated by requirement (2026-08-06): no confetti, no fireworks, no gamification — the target emotion is confidence, not excitement for its own sake.**

Amendments are refinements, not blockers; incorporate in wireframes v1.1 before high-fidelity design begins.

## Product decisions (v1.2, 2026-08-06 — resolve the three open ASSUMPTIONs; hi-fi has zero ambiguity)

1. **Guest mode — APPROVED.** Guest lands on HOME-001. Allowed: browse Discover, search, view business profiles, watch stories/videos, view events, read reviews. Restricted: Gurman planning, Smart Plan Workspace, bookings, favorites, reviews, story posting, profile. On restricted attempt: "Create a free account to save plans, book businesses, and let Gurman help organize your experience." Never force registration immediately — let users experience the product first.
2. **Camera permission — REMOVED from WOW Flow.** Onboarding permissions: Location · Notifications · Gallery · Microphone (optional, only if voice is introduced early). Camera is requested in context on first camera-dependent action (story post, live media upload, QR/menu scan). Principle: request permissions in context.
3. **Interests vs. AI Personalization — responsibilities SPLIT.**
   - **AUTH-015 Interests = immediate planning intent** ("What are you planning today?" — Birthday, Weekend, Haircut, Dinner, Coffee, Travel, Wedding, Family). Feeds the FIRST home experience → Workspace → bookings (current session).
   - **AUTH-016 AI Personalization = long-term preference profile** (preferred budget, favorite cuisines, travel distance, indoor/outdoor, luxury/casual, family-friendly, pet-friendly, accessibility). Feeds future recommendations and Gurman context (persistent memory). Must NOT duplicate the immediate intent question.

**Hi-fi design CLEARED to begin** once the web launch reaches the Genesis Record. No further product clarification expected before visual design; subsequent changes require implementation evidence or user testing.

## FREEZE (2026-08-06): WOW Flow v1.2 is the canonical baseline

**Product Specification Stable.** v1.2 is the sole source for hi-fi design, mobile implementation, QA test cases, user-testing scripts, and analytics instrumentation. No parallel versions. The flow changes only if: (1) user testing demonstrates a measurable problem, (2) analytics contradict a product assumption, or (3) a technical constraint makes the design impossible.

### Analytics event taxonomy (contract — no implementation invents event names)

`wow_started → auth_started → auth_completed → permissions_completed → intent_selected → profile_completed → preferences_saved → ready_completed → home_arrived`

### Hi-fi design goals (measurable)

1. **Confidence** — every screen reduces uncertainty.
2. **Focus** — exactly one dominant action.
3. **Continuity** — transitions feel like one conversation.
4. **Calmness** — no visual overload; no decorative animation without purpose.
5. **Speed** — every onboarding decision in under **5 seconds**; a screen that makes users think for 20 seconds gets simplified.

### Onboarding Complexity KPI (baseline for the Genesis Record and all future onboarding changes)

Screens: 12 · Mandatory decisions: (count at hi-fi) · Permissions requested: 3 (+1 optional) · Average taps to Home: (measure) · Target completion: **< 90 seconds**. A redesign that increases taps or completion time without improving completion rate or satisfaction is rejected on evidence.
