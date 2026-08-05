# Manzil Development Roadmap — Professional Startup Approach (v1.0)

> Captured 2026-08-05. Governs the MANZIL 3.0 program. Principle: define the
> product before drawing the UI — minimize rework, scale cleanly.

## Phase 1 — Product Foundation
Product vision, mission, core principles, USP, personas, competitor analysis, monetization, MVP definition, feature prioritization. → `00-product-bible-v1.md` ✅

## Phase 2 — Information Architecture
Map every page and connection before designing screens (Launch → Splash → Onboarding → Registration → Permissions → Interests → AI Personalization → Home; Home branches to AI / For You / Nearby / Profile / Booking / Stories / Notifications / Wallet). → `02-information-architecture.md` ✅

## Phase 3 — Feature Inventory
Every feature documented before UI (auth: splash/login/register/OTP/reset/session; AI: chat/voice/image search/planning/booking/follow-up/memory; business: profile/reviews/stories/gallery/events/booking/offers; …). Target: 300–500 documented features.

## Phase 4 — Database Design
Entities before UI: Users, Businesses, Bookings, Stories, Posts, Comments, Reviews, Messages, Events, Packages, Payments, Notifications, AI Conversations, AI Memory, Followers, Collections, Favorites — with relationships and permissions.

## Phase 5 — Backend Architecture
Mobile app → API gateway → auth / business / booking / review / story / notification / AI / search / payment services → analytics. Service-oriented so new verticals slot in.

## Phase 6 — Design System
Color tokens, typography, icons, components, motion system, haptics, accessibility rules.

## Phase 7 — Component Library
Buttons, cards (business/story/booking/review), video player, AI message bubble, floating widget, profile header, search bar — reused across the app.

## Phase 8 — Screen Inventory
Every screen gets a unique ID + dependency graph (AUTH-001 Splash … HOME-001 AI Home, HOME-002 For You, HOME-003 Nearby, BUS-00x, BOOK-00x, AI-00x, PROFILE-00x). Target ~180–250 screens.

## Phase 9 — High-Fidelity Design
Each screen generated from the shared system: iPhone + Android (+ desktop where applicable), dark + light, motion specs, accessibility notes.

**Hierarchical prompt system (anti-drift):** never 200 independent prompts. MASTER PROMPT → Design System / Animation / Copywriting / Screen / Component / Developer prompts; every screen prompt inherits the Master. ~250–350 screen prompts across 15 collections (00 Master … 14 Micro-interactions). Ask: "Design Screen 003 of the Manzil Product Bible according to the Master Design System, Motion System, Accessibility Rules, Brand Identity, AI Guidelines, and Component Library" — never "design a login page".

## Phase 10 — Prototype
Connect every screen: animations, gestures, shared-element transitions, AI flows, booking flows → clickable product prototype.

## Phase 11 — Development (sprint order)
1. Design system, authentication, onboarding
2. AI-first home, persistent AI input, For You feed
3. Business profiles, reviews, stories
4. Booking engine, packages, payments
5. User profiles, social, notifications
6. Merchant dashboard, analytics, admin tools

## Start order (agreed)
1. Product Bible ✅ → 2. Information Architecture ✅ → 3. AI & User Journey Bible → 4. Technical Architecture (DB + backend) → 5. Design System → 6. Screen Bible → 7. Generate UI → 8. Build app → 9. NestJS backend → 10. Gurman AI integration → 11. Focused MVP launch.

## Target artifact set (funded-startup grade)
📘 Product Bible · 🗺️ Information Architecture · 🎨 Design System · 🧩 Component Library · 📱 Screen Bible (200+) · 🏛️ Backend Architecture · 🗄️ Database Schema · 🔌 API Specification · 🤖 AI Agent Specification · 🧪 Testing Strategy · 🚀 Launch Plan.
