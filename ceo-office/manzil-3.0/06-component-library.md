# 🧩 MANZIL COMPONENT LIBRARY & INTERACTION BIBLE — v1.0

> Captured 2026-08-05. Every screen must be assembled from these components; no
> screen introduces custom components without review. Components are defined the
> way mature design systems do — behavior, accessibility, states, implementation
> guidance — useful to designers AND developers.

## Component Design Principles

Reusable · accessible · responsive · animated · consistent · composable · performance-conscious · theme-aware.

## Component Anatomy (every component defines)

Purpose · structure · variants · states · behavior · accessibility · animations · design tokens · developer API · usage examples · do's · don'ts.

## The Library

1. **Primary Button** — filled / elevated / glass / gradient (special campaigns only); states: default, pressed, focused, loading, success, disabled, error; minimum touch target, immediate feedback, loading indicators.
2. **Secondary Button** — outline / ghost / text / icon; same states as primary.
3. **Floating AI Input** — the persistent conversational entry point. Text, voice, image, location, quick actions. States: idle, listening, thinking, typing, error, offline, expanded, collapsed. Always accessible; expands smoothly; respects keyboard and safe areas.
4. **Search Bar** — voice, image, text, filters, recent searches, suggestions, autocomplete, semantic search.
5. **Business Card** — cover image/video, name, category, rating, distance, price range, open/closed status, tags, quick actions. Variants: compact, standard, featured, sponsored, nearby, trending. States: loading, offline, saved, selected.
6. **Story Card** — user/business/live stories + highlights; progress, avatar, verification badge, time, media preview.
7. **Video Feed Card** — autoplay video, business details, AI summary, like/save/share/comment/book/Ask AI; seamless vertical scrolling.
8. **Review Card** — text, photo, video, voice; AI summary, verified-visit badge, helpful votes, business replies.
9. **Package Card** — AI-generated plans (e.g. Birthday: restaurant + cake + taxi + photographer), price, timeline, Book All.
10. **Booking Card** — business, date, time, guests, status; reschedule, cancel, directions, share.
11. **User Avatar** — small/medium/large/story/group/verified/business; animated status indicators.
12. **Notification Card** — booking, reminder, promotion, story, follower, system, AI; open/dismiss/snooze.
13. **Floating Widget** — context-aware shortcuts (Nearby, Wallet, Bookings, Weather, Traffic, Calendar); collapsed/expanded/pinned/temporary.
14. **Bottom Sheet** — modal, action, selection, AI result, booking summary, filters; drag-to-dismiss, snap points, accessible focus management.
15. **Dialog** — confirmation, warning, delete, payment, permission, AI clarification; always explain consequences.
16. **Toast** — success, info, warning, error, undo; short-lived, non-blocking.
17. **AI Message Bubble** — text, cards, media, booking proposals, maps, quick replies, voice playback, suggested follow-ups.
18. **Calendar** — single date, range, availability, business hours, holidays, events, timezone-aware.
19. **Timeline** — planning steps, booking progress, trip itinerary, order tracking, AI workflow.
20. **Empty State** — illustration, title, explanation, primary action, optional AI suggestion.
21. **Loading** — skeleton, progress bar, shimmer, AI progress, media placeholder; never block the interface.
22. **Error** — plain-language explanation, retry, alternative suggestion, support link where appropriate.

## Motion Standards

Every interactive component defines: entry, exit, press feedback, loading, success, error animations + a reduced-motion alternative.

## Accessibility Standards

Screen readers, keyboard navigation, large text, high contrast, reduced motion, minimum touch targets, clear focus states, meaningful labels.

## Performance Standards

Efficient renders, no unnecessary re-renders, lazy heavy media, offline states, graceful network recovery.

## Component Governance

New components require: no existing component solves it · recurring use case · documented accessibility + performance · design review complete · developer guidelines prepared.

## Review Checklist

Reusable? Accessible? Understandable? Responsive? Performant? Consistent with the Design System? Strengthens the AI-first experience? If not — revise.

## Corpus status → next

✅ 00 Product Bible · ✅ 02 IA · ✅ 03 AI Journey · ✅ 04 Tech Architecture · ✅ 05 Design System · ✅ 06 Component Library → next: 📱 **07 Screen Bible** — the full screen catalog BEFORE any UI generation. Per screen: unique ID (AUTH-003…), purpose, entry points, exit paths, user goals, required components, data dependencies, states (loading/empty/error/success), accessibility, motion/transitions, analytics events, edge cases.
