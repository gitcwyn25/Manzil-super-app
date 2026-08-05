# ✅ MANZIL 3.0 — Pre-Execution Review (CTO + CPO stance, v1.0)

> Captured 2026-08-05. Final gate before implementation. Scores: Product Vision
> 9.8 · Architecture 9.5 · Scalability 9.5 · Design Direction 9.7 · Execution
> Readiness 8.8. The remaining gap is not documentation — it's validating through
> an MVP while keeping the architecture able to grow into the long-term vision.

## Decisions (all adopted)

1. **Don't build the entire platform first — define the V1 Hero Use Case:**
   > "Plan and book a birthday in under 3 minutes."
   If that experience is exceptional, users understand what Manzil is; everything else becomes easier to add.

2. **Keep Gurman AI focused.** V1: discover places, compare businesses, build packages, book services, answer questions about businesses, remember planning context. Later: travel, healthcare, education, finance, government. Focus = trustworthiness.

3. **Stories are an accelerator, not a dependency.** The booking and planning experience must stand on its own even if nobody ever uploads a story.

4. **The biggest competitive advantage is NOT the AI — it's the Smart Plan Workspace.** A living object (venue ✔ cake ✔ taxi ✔ guests ✔ budget 2.4M/3M · timeline · messages · payments · photos · stories) — not a chat, not a booking. Nobody has implemented this well.

5. **Design Repository structure** (scales better than one large design file):
   ```
   design/
     foundations/  colors · typography · spacing · motion · icons
     components/   ai/ booking/ cards/ navigation/ forms/ media/ overlays/
     screens/      auth/ home/ discover/ ai/ business/ booking/ profile/ merchant/
     flows/        wow-flow/ booking/ social/ onboarding/
     prototypes/   wow/ merchant/ planner/
   ```

6. **NEW FEATURE — Confidence Indicator** on AI recommendations: not just a ranked list but an explained match ("Excellent Match: ✔ within budget ✔ available tonight ✔ 4.9 rating ✔ 5 minutes away ✔ verified by recent visitors"). Trust without overwhelm.

7. **Authorized build order:** ① WOW Flow wireframes (Splash → Home) ② hi-fi WOW Flow ③ mobile design-system implementation ④ business profile ⑤ AI conversation ⑥ **Smart Plan Workspace** ⑦ booking engine ⑧ merchant dashboard ⑨ discovery feed ⑩ social. (Workspace deliberately ahead of social — closer to core value.)

8. **NEW PRODUCT BIBLE PRINCIPLE:**
   > **"Manzil sells confidence, not information."**
   Users don't want 300 restaurant results — they want confidence the chosen option is right for their budget, occasion, and preferences. Influences AI recommendations, discovery ranking, booking flow, reviews, business profiles, and the Workspace. Manzil is a trusted decision-making platform, not another discovery app.

## Priority (conclusion)

Ship the web experience → build and validate the WOW Flow → implement the Smart Plan Workspace → deliver the booking engine through the Tool Orchestrator → test with real users → iterate on evidence. Every week produces working software, testable prototypes, or validated user feedback.
