# ADR-004: Manzil Mobile is built on React Native + Expo

**Date:** 2026-08-05 · **Status:** Accepted (explicit user/CTO decision — supersedes the parked "keep Kotlin/Compose" default recorded in `ceo-office/manzil-3.0/manzil-3.0-vision.md`)

## Context

A Kotlin/Compose consumer app was shipped 2026-08-04 (22 tasks, 155 green tests, 4.4MB R8 APK, Android-only). The MANZIL 3.0 roadmap requires iOS + Android, deep AI integration, rich animation, a shared design system with the web app, shared business logic, fast iteration, and a startup-sized engineering team. The developer works primarily on Windows 11 and tests on an iPhone — native iOS builds are impractical in that loop; Expo's workflow is not.

## Decision

Manzil Mobile 3.0 is built in **React Native + Expo** (Expo Router, Reanimated, Gesture Handler, FlashList, Expo Video per the tech-architecture capture). Target architecture:

```
Next.js  ──┐
           ├── shared contracts (packages/shared)
RN/Expo  ──┘
     │
  NestJS
     │
PostgreSQL
```

One design system, one component philosophy, one token system across web and mobile.

## Reasons

- iOS + Android from one codebase with an iPhone-testable dev loop from Windows.
- TypeScript end-to-end: shared DTOs/contracts with the existing web app and API (packages/shared already exists).
- Animation and AI-driven UI requirements sit inside RN's strengths (Reanimated, shared elements).
- Startup-sized team cannot sustain a parallel native stack per platform.

## Alternatives considered

Kotlin/Compose (extend the shipped app) — rejected: Android-only, no iOS path from Windows, separate design-token pipeline, duplicated business logic against the TS stack.

## Consequences

- The Kotlin/Compose app is **frozen as a reference implementation** — its API contract tests, UX decisions, and localization learnings carry forward; no new feature work lands there.
- The mobile design foundation (obsidian/gold tokens, typography, motion) is built for RN and tagged `design-foundation-mobile-v1.0` before any screen work (Prompt 02A-C).
- The web CSP/self-hosting discipline extends to mobile asset policy.
