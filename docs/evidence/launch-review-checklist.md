# Launch Gate Review Checklist

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
