# 📖 MANZIL USER FLOW BIBLE — Volume I: Authentication & First Experience (v1.0)

> Captured 2026-08-05. Quality bar raised to production PRD: every flow carries UX
> goal, business goal, AI goal, success metrics, edge cases, error handling,
> animation timeline, API calls, data, analytics events, accessibility, future
> expansion.

## FLOW 001 — First Launch

**Objective:** new user → activated user in under **3 minutes**.
**Success criteria:** finishes onboarding feeling curious, confident, excited to try Gurman AI — before seeing the full app.
**Emotional timeline:** download → curiosity → trust → excitement → confidence → personalization → achievement → discovery.

### Screen 1 — Splash
Purpose: instantly communicate premium quality. Duration 1.8–2.5s, never longer.
Animation: black background → gold compass line appears → compass draws itself → particles form logo → MANZIL fades in → "Gurman AI" → fade to Welcome. No spinner, no static logo.
Background API: check auth, load configuration, translations, remote feature flags.
Accessibility: reduced motion → skip animation, immediate fade.
Edge cases: offline → continue; maintenance → maintenance screen; update required → force update.

### Screen 2 — Welcome
Goal: explain Manzil in 8 seconds. Headline: **"Discover. Plan. Experience."** + three animated cards (Discover — find amazing local places · Plan — let Gurman AI organize everything · Experience — book, enjoy, share). CTA "Get Started", secondary "Sign In". Cards float upward, tiny parallax, soft haptics.

### Screen 3 — Account Choice
Apple · Google · Telegram · Phone · Email · Guest (optional, limited). AI explains why signing in helps: save bookings, sync plans, personalize recommendations.

### Registration
Minimal fields, never unnecessary information: Name → Phone/Email → Verification → Password (if needed) → Done. No 12-field forms.

### OTP Verification
SMS arrives → code auto-fills (automatic detection where supported) → digit animation → checkmark → continue.

### Permissions Strategy — ask in context, never up-front
Location → when searching nearby. Camera → when creating a story/scanning. Microphone → when starting voice mode. Gallery → when uploading. Notifications → after first successful booking or opting into reminders. Always explain the benefit, not just request access.

### Interest Selection
Pinterest-style photo cards (not checkboxes): coffee, restaurants, travel, sports, nightlife, hotels, family, beauty, healthcare, shopping, education, pets, home services.

### AI Personalization
Friendly conversation, not a survey: "What are you planning most often?" → buttons (date night, coffee, work meetings, travel, birthdays, haircuts, shopping, weekend, students, family). Trains recommendations.

### First AI Conversation
Gurman opens with capability + quick suggestions (Plan a Birthday · Book a Barber · Find Dinner · Weekend Trip · Best Coffee Nearby) — teaches the interface without a tutorial.

### Home Arrival
Widgets animate in staggered sequence: greeting → weather → upcoming booking → nearby → For You → AI suggestions. Alive, not noisy.

### Activation Event
Activated = one meaningful action: save a business, start an AI conversation, make a booking, create a collection, follow a business, share a story. More valuable than app-opens.

### Analytics Events
App Installed · Splash Completed · Welcome Viewed · Registration Started/Completed · Verification Completed · Interest Selected · AI Introduction Viewed · First AI Prompt Used · Home Loaded · First Meaningful Action Completed.

### Flow-wide Design Principles
One primary action per screen · minimal text · clear progress · fast transitions · helpful AI guidance · accessibility from day one · every permission explains its benefit · every screen has an obvious next step.

## ⭐ ADOPTED ADDITION (user, 2026-08-05): Progressive Onboarding
Don't teach everything in session one — introduce depth as users encounter it: first business profile view → introduce AI comparison; first completed booking → explain reminders + itinerary management; first story posted → introduce collections + sharing. Onboarding stays short; the product reveals depth over time.

## Next Volume
Volume II — Home, Discovery & For You: personalized feed ranking, video interactions, story system, AI entry points, Nearby mode, search behavior, collections, saved places, moderation states — every animation, API interaction, edge case at the same PRD resolution.
