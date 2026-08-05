# 📘 MANZIL PRODUCT BIBLE — v1.0

**AI-Powered Lifestyle & Local Commerce Platform · Confidential**

This document defines the vision, philosophy, strategy, user experience, product architecture, and roadmap for Manzil. Every product, design, engineering, AI, and business decision must align with this document. Keep the core stable — evolve via appendices and versioned updates, not rewrites.

> Corpus: [01-development-roadmap.md](01-development-roadmap.md) · [vision](manzil-3.0-vision.md) · [design prompt](manzil-3.0-design-prompt.md) · [bible outline / volumes](manzil-3.0-product-bible-outline.md)

## 1. Vision

Create the world's most intelligent lifestyle platform where AI helps people discover, plan, book, and experience the real world effortlessly. Manzil transforms local discovery into completed experiences. Instead of helping users find businesses, Manzil helps them achieve goals.

## 2. Mission

Make every local decision simple. Whether someone wants coffee, a haircut, a birthday celebration, a doctor, a hotel, or a weekend trip, Manzil reduces the entire process to one conversation.

## 3. Product Philosophy

Traditional apps require users to: search → compare → open maps → read reviews → call businesses → book → pay → remember reservations → navigate. Manzil removes these steps. The user describes their goal; Gurman AI completes the journey.

## 4. Core Principles

- **AI First** — conversation before navigation.
- **Task Completion** — success is measured by completed real-world outcomes.
- **Trust** — recommendations must be transparent, explainable, authentic.
- **Quality** — only recommend businesses meeting defined quality standards.
- **Speed** — every interaction feels immediate.
- **Human-Centered** — technology reduces effort, never increases it.

## 5. Product Positioning

Manzil is **not**: a directory, a review website, a booking app, a food delivery platform, a social network.
Manzil **is**: an AI Lifestyle Agent with integrated discovery, social proof, and booking.

## 6. Value Proposition

- **Users:** one place to discover, compare, plan, and book.
- **Businesses:** a platform to attract customers, manage bookings, showcase content, and grow.
- **Partners:** a trusted ecosystem for local commerce and services.

## 7. Long-Term Vision

Become the everyday operating system for life outside the home. Users naturally ask Gurman AI for help with daily decisions.

## 8. Target Markets

Phase 1 Uzbekistan → Phase 2 Central Asia → Phase 3 Middle East → Phase 4 Europe.

## 9. Target Users

Students, professionals, families, tourists, remote workers, creators, business owners.

## 10. User Problems

Too many apps · poor business information · fake reviews · no personalized recommendations · time-consuming planning · fragmented booking · no AI assistance.

## 11. Product Pillars

AI · Discovery · Booking · Community · Business Tools · Trust.

## 12. Gurman AI

Not a chatbot — an intelligent lifestyle agent: understanding intent, planning events, comparing businesses, generating packages, booking services, managing reservations, remembering preferences, proactive suggestions, text/voice/image input.

## 13. Discovery

Discovery inspires action. The feed contains short videos, stories, photos, events, promotions, trending places, recommendations. Every discovery item provides an immediate path to booking or saving.

## 14. Booking Philosophy

Never exceed three user decisions. The AI handles complexity behind the scenes.

## 15. Social Experience

Profiles, following, stories, video posts, reviews, collections, badges, reputation.

## 16. Business Platform

Verified profiles, booking management, analytics, content publishing, offers, promotions, customer engagement, AI insights.

## 17. Trust Framework

Verified businesses · verified visits · verified reviews · transparent sponsorship labels · fraud detection · community moderation · privacy by design.

## 18. Monetization

Booking commissions · premium business subscriptions · sponsored placements · AI Concierge subscription · advertising · payment processing · gift cards · event packages.

## 19. Brand Personality

Elegant, helpful, confident, modern, friendly, trustworthy, calm, intelligent. Never overwhelming.

## 20. Design Principles

Minimal interfaces · large touch targets · premium typography · motion with purpose · dark-first design (mobile 3.0; web currently ships the approved light Vibrant Marketplace — unification is a tracked decision) · accessible · AI always available.

## 21. Accessibility

WCAG compliance, voice support, large text, color-independent feedback, screen readers, keyboard navigation where applicable.

## 22. Security

Strong authentication, secure payments, encrypted communications, privacy-first data handling, transparent permissions, user control over personal data.

## 23. Product Success Metrics

MAU · DAU · bookings completed · booking conversion rate · average booking value · AI task completion rate · time-to-book · user retention · business retention · review quality · NPS.

## 24. MVP Scope

- **Consumer app:** authentication, AI home, discovery feed, business profiles, reviews, bookings, notifications.
- **Merchant dashboard:** business onboarding, booking management, analytics.
- **Administration:** verification, moderation.

## 25. Future Vision

Collaborative planning, group bookings, travel itineraries, healthcare, education, government integrations, wearables, AR navigation, smart loyalty, cross-border expansion.

## 26. Product Principles (feature gate)

Every feature must answer YES to: Does it reduce effort? Increase trust? Improve task completion? Delight the user? Support the AI-first experience? Otherwise reconsider.

## 27. North Star

Success is not time-in-app. Success is how quickly users accomplish meaningful real-world tasks and how confidently they return for the next one. The ultimate goal: the trusted AI companion for discovering and experiencing everyday life.

---

## Appendix A (v1.1, 2026-08-05) — Adopted from the pre-execution review

- **Core principle added:** **"Manzil sells confidence, not information."** Users don't want 300 results; they want confidence the chosen option is right for their budget, occasion, and preferences. Influences recommendations, ranking, booking, reviews, profiles, and the Smart Plan Workspace.
- **V1 Hero Use Case:** "Plan and book a birthday in under 3 minutes." (See [14-execution-review.md](14-execution-review.md).)

## What Comes Next (document order)

1. ✅ Product Bible (this document)
2. 🗺️ Information Architecture — every screen, flow, navigation path
3. 🧠 AI & User Journey Bible — Gurman AI behaviors, memory, booking logic, conversational patterns
4. 🏛️ Technical Architecture — services, APIs, data model, integrations
5. 🎨 Design System — visual language, components, motion, accessibility
6. 📱 Screen Bible — every screen with states, interactions, transitions (unique IDs: AUTH-001…, HOME-001…, BUS-001…, AI-001…; hierarchical prompt inheritance from the Master Prompt so nothing drifts)
7. 💻 Implementation Plan — app, backend, AI orchestration, testing, release
