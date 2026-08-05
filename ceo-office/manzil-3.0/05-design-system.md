# 🎨 MANZIL DESIGN SYSTEM — v1.0

> Captured 2026-08-05. **Strategic adjustment adopted:** aim for **timeless premium
> UI**, not "modern UI" — modern changes every year; Apple Wallet / Airbnb / Linear /
> Arc / ChatGPT win through consistent systems, thoughtful motion, typography,
> spacing, and restraint.

## Design Philosophy

Manzil is AI-first. The interface feels calm, intelligent, elegant, trustworthy. Users focus on accomplishing goals, not learning the interface. One system across mobile, tablet, desktop, wearable, and future devices.

## Design Principles (every screen)

Clarity before decoration · motion communicates meaning · consistency builds trust · reduce cognitive load · **one primary action per screen** · touch-first · accessibility by default · performance is part of design.

## Visual Language

Premium, minimal, elegant, warm, human, intelligent, calm, luxury, modern, approachable. Avoid: visual clutter, unnecessary gradients, excessive glassmorphism, oversized floating effects.

## Color Philosophy

**Semantic tokens, never feature colors; never hard-code.** Roles include: primary/hover/pressed, secondary, background, surface, surface-elevated, surface-glass, divider, border, success, warning, error, info, verified, premium, sponsored, discount, trending, nearby, and the AI states — **AI Active, AI Listening, AI Thinking, AI Booking**.

## Typography

Hierarchy: Display · Hero · Heading · Title · Body · Caption · Label · Button · Micro.
Rules: ≤3 font weights per screen · generous line spacing · limited line length · sentence case throughout.

## Spacing

8-point grid: 4, 8, 12, 16, 24, 32, 40, 48, 64, 96. Consistent margins and vertical rhythm; no arbitrary spacing.

## Corner Radius

Small · Medium · Large · Extra Large · Pill · Circular. Larger radii for primary interactive surfaces.

## Shadows & Elevation

Levels: Flat · Raised · Floating · Modal · Overlay. Subtle only; rely on spacing and contrast before elevation.

## Icons

Rounded outline, consistent stroke, clear meaning; no decorative icons without purpose.

## Buttons

Variants: primary, secondary, ghost, outline, danger, floating, **AI action**, loading, disabled. Every button defines: default, pressed, focused, disabled, loading, success, error.

## Inputs

Text, search, voice, password, OTP, budget, date, time, people, location, camera, gallery. Large touch targets, floating labels, inline validation, helpful placeholders, voice shortcuts where appropriate.

## Cards

Families: business, restaurant, hotel, doctor, event, story, video, review, booking, package, collection, recommendation, merchant, analytics. Hierarchy through spacing and typography, not visual effects.

## Lists

Vertical feed, horizontal carousel, timeline, grouped sections, infinite scroll — all with skeleton loading and graceful empty states.

## Navigation

Contextual: persistent AI input, contextual chips, floating actions, gestures, context-aware shortcuts. No permanent bottom nav unless user testing demonstrates clear need.

## Motion System

Categories: screen transitions, shared elements, card expansion, hero animations, gesture responses, scroll effects, loading, success, error, booking progress, AI state transitions. Rules: consistent timing, no unnecessary animation, reduced-motion always supported.

## Haptics

Booking confirmation, payment success, story recording, saving, deleting, voice activation, navigation, error.

## Accessibility

Large text, screen readers, keyboard navigation, high contrast, reduced motion, color-independent feedback, minimum touch targets, readable typography, accessible focus order.

## States

- **Empty:** friendly illustration/icon + clear explanation + suggested next action — never leave users without guidance.
- **Loading:** skeletons, progressive images, meaningful progress, never block the interface.
- **Error:** what happened + recovery options + retry paths, no technical language.

## AI Visual Identity

Distinct Gurman states — Idle, Listening, Thinking, Searching, Planning, Comparing, Booking, Success — each with its own animation, all subtle and professional.

## Responsive

Small phones, large phones, foldables, tablets, desktop web — one design language.

## Performance

Lazy media, optimized images, perceived performance first, cached assets, smooth scrolling and gestures.

## Design Tokens

Every visual property tokenized: color, typography, spacing, radius, border, shadow, opacity, animation duration/curve, elevation, icon size, component size. No hard-coded values in components.

## Component Governance

Every component defines: purpose, variants, states, spacing, accessibility, animation, usage examples, developer implementation notes. Reusable building blocks, never one-offs.

## Design Review Checklist (per screen)

Clear hierarchy · obvious primary action · accessibility met · grid-true spacing · scale-true typography · animations support usability · performance addressed · aligned with AI-first philosophy · no unnecessary complexity.

## Next document (adopted recommendation)

🧩 **Component Library & Interaction Bible** BEFORE any screen generation: Business/Story/Review/Video/Booking cards, Floating AI Input, AI Message Bubble, Search Overlay, Calendar Picker, Package Builder, Merchant Analytics Cards, Bottom Sheets, Toasts, Modals, Navigation Chips, Floating Widgets — each with visual spec, six states, animations, accessibility, tokens, developer API (props/variants), usage examples, do's and don'ts. 200+ screens assembled from the same high-quality parts.
