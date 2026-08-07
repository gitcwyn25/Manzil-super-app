# Epic 17 — Product Experience System (PXS)

> **Foundational platform epic, not UI polish.** Users judge quality less by colour than by whether the product always tells them what is happening. Numbered 17 to avoid colliding with Epic 15 (Business OS) — see [EPIC-LADDER.md](EPIC-LADDER.md). Sequenced early in the web track: **every later surface is required to consume it rather than invent its own behaviour.**

## The gap this closes

Today: click Save → nothing → page refreshes. Target:

```
Click Save → button becomes "Saving…" → spinner → form disables
  → success toast "Business updated" → checkmark animation
  → button becomes "Saved" → background sync completes → analytics event
```

For Gurman, the same principle makes the intelligence *felt*:

```
Thinking… → Reading your preferences… → Comparing 24 restaurants…
  → Removing closed places… → Checking today's opening hours…
  → Ranking by your budget… → Done ✓
```

For multiplayer planning (Epic 11):

```
Rayyan joined the session. → Amina voted for Restaurant A.
  → 4 places remaining. → Finding options everyone likes… → Consensus reached.
```

## ⛔ THE BINDING RULE

**Each message must correspond to a real stage in the process.** Progress theatre — fake stages, invented counts, spinners for work that is not happening — is the same category of failure as a fabricated metric, and is forbidden by the same principle. If Gurman did not compare 24 restaurants, it does not say it did. The stage list is emitted by the engine, not written by the UI.

This is achievable because Epic 03's `RecommendationTrace` and Epic 08's reason codes already record the real stages; PXS renders them.

## Scope

**State & feedback:** loading states (skeletons, shimmer, progressive) · optimistic updates (save instantly, revert on failure) · success feedback · error feedback with retry · background-sync indicators · empty states · no-results states · offline states · network-reconnect handling · progress bars · upload progress · **AI thinking states** · **AI streaming responses** · retry flows · undo actions · auto-save indicators.

**Interaction:** keyboard shortcuts · focus management · page-transition animations · micro-interactions · hover states · touch feedback · mobile gestures · haptics (mobile) · accessibility announcements (live regions) · toasts · confirmation dialogs · unsaved-changes warnings.

**Delivered as a framework:** feedback-state design tokens · toast/notification system · modal/dialog system · loading & skeleton library · optimistic-update primitives · error boundaries · offline handling · streaming AI components · progress indicators · motion & transition system · a11y + keyboard layer · mobile interaction patterns · consistent empty/error/success states.

## Governance

Every new feature MUST use these components rather than inventing its own behaviour. A surface that hand-rolls a spinner or a toast is a review rejection. This is what makes the platform feel like one product rather than twenty pages.

## Why it matters commercially

When users can always tell what the system is doing, why, and what happened next, they trust the platform and keep using it. Combined with corpus 27's Truth Economy positioning, PXS is where "recommendations you can inspect" stops being copy and becomes something the user watches happen.

## Dependencies

Builds on the Vibrant Marketplace design system and existing motion primitives (`Reveal`, `RevealStagger`, `AnimatedCounter`). Streaming AI components need Epic 09's conversational layer to emit stage events; ship the framework first with the non-AI states, then wire AI streaming when 09 lands.
