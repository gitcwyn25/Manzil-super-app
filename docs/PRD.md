# Product Requirements Document
## Manzil Super-app — Local Business Discovery & Reviews Platform for Uzbekistan

**Version:** 0.1 (draft)  
**Status:** Pre-build planning  
**Owner:** Team Manzil

---

## 1. Executive Summary

A Yelp-style platform purpose-built for Uzbekistan: users discover and review local businesses (restaurants, cafes, beauty, auto services, repairs, health, etc.), and businesses claim and manage their own listing. Tashkent-first, Uzbek/Russian/English from day one, with the explicit goal of feeling locally built rather than a translated import of a Western product.

The single hardest problem this PRD is built around is not a feature — it's the **empty platform problem**: a discovery app with no listings and no reviews has no value to anyone. Every phase below is sequenced to attack that problem directly, not just to ship features.

---

## 2. Problem Statement

- Uzbek consumers currently rely on Google Maps (thin local review depth, weak coverage outside Tashkent), Telegram channels/group chats, and word of mouth to find local businesses. None of these are purpose-built for structured discovery (filter by category, compare ratings, browse photos).
- Small and medium businesses have no easy, low-cost way to manage an online reputation or be found by new local customers — most have, at best, an Instagram page.
- There is no platform that natively supports Uzbek (Latin script) alongside Russian and English, which matters for trust and adoption outside a narrow expat/tech-savvy segment.

---

## 3. Goals and Non-goals

### Goals (MVP)
- Let users search and browse local businesses by category, name, and location.
- Let users leave star ratings, written reviews, and photos.
- Let business owners claim, edit, and respond to reviews on their own listing.
- Solve the cold-start problem deliberately, not accidentally.
- Ship in Uzbek, Russian, and English from the first release.

### Non-goals (explicitly out of scope for MVP)
- Online booking/reservations or payments.
- Loyalty programs or paid advertising products.
- AI-powered features (Phase 2+ after enough data exists).
- Coverage outside Tashkent at launch.

---

## 4. Success Metrics (MVP, first 90 days)

| Metric | Target |
|---|---|
| Claimed/verified businesses in Tashkent | 500+ |
| Listings with 3+ reviews | 40% of claimed |
| Weekly active users | Track growth rate |
| Reviews submitted per week | Upward trend |
| Search-to-profile-view rate | >50% |
| Business owner reply rate | >30% within 7 days |

---

## 5. Target Users

| Persona | Description | Core Need |
|---|---|---|
| **The Discoverer** | Lives in Tashkent, checks reviews before trying new places | Fast, trustworthy answer to "is this place good" |
| **The Claimant** | Runs SMB (cafe, salon, repair); not very technical | Visibility to new customers, easy way to respond |
| **The Seed Reviewer** | Power-user, enjoys being first; motivated by recognition | Reason to contribute when platform is empty |

---

## 6. MVP Feature Requirements

### Accounts & Auth
- Consumer sign-up/login (email, phone, or OAuth)
- Business owner sign-up + listing claim
- Password reset, profile (name, avatar, locale)

### Business Listings
- Profile page: name, category, description, hours, address, phone, photos, map pin, price tier
- Owner can edit their listing and upload photos
- Lightweight claim verification (phone or admin approval)

### Search & Discovery
- Keyword search (name, category)
- Category browse/filter
- Geo-based "near me" with map view
- Sort by rating, distance, review count

### Ratings & Reviews
- 1–5 star rating, required text (minimum length), optional photos
- One review per user per business
- Helpfulness upvote
- Business owner reply (one per review)
- Abuse reporting

### Photos & Media
- Multi-photo upload for businesses and reviews
- Manual moderation queue

### Maps
- Map pin per business, directions, map-based browse

### Localization
- Full UI in Uzbek (Latin), Russian, and English

### Admin/Moderation
- Approve business claims, moderate flagged content, manage categories

---

## 7. Go-to-Market: Solving Cold-Start

1. **Pre-seed listings:** Compile real Tashkent businesses (name, address, phone) from public sources before launch
2. **Manually recruit 100–200 businesses:** Direct outreach to claim free listings
3. **Seed reviewer incentive:** Early reviewers get "Founding Reviewer" badge
4. **Dense categories first:** Focus on cafes + restaurants rather than spreading thin
5. **Personal onboarding:** Start with your own network before public marketing

---

## 8. Phased Roadmap

- **Phase 0 (4–6 weeks):** Pre-seed data, build MVP, recruit first 100–200 businesses
- **Phase 1 (launch):** Public launch with MVP in Tashkent, 3–5 dense categories
- **Phase 2 (post-traction):** AI features, push notifications, premium listings, expand categories
- **Phase 3 (scale):** Geographic expansion, deeper monetization

---

See companion docs: [ARCHITECTURE.md](./ARCHITECTURE.md), [FEATURES.md](./FEATURES.md)
