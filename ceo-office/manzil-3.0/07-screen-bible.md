# 📱 MANZIL SCREEN BIBLE — v1.0

> Captured 2026-08-05. The transition from documents to **production artifacts** —
> the master blueprint designers and developers work from daily. Estimated scope:
> 220–300 unique screens, 700+ UI states, 1,500+ interactions, complete navigation
> graph, analytics events, and animation map.

## ID System

```
AUTH Authentication · HOME Home · AI Gurman AI · DISC Discovery · BUS Business
BOOK Booking · PAY Payments · SOC Social · USR User · MER Merchant
SET Settings · ADM Admin · SYS System
```

## Screen Catalog

**AUTH (17):** 001 Splash · 002 Welcome · 003-005 Onboarding 01-03 · 006 Sign In · 007 Register · 008 Verify Phone · 009 Verify Email · 010 OTP · 011 Face ID · 012 Forgot Password · 013 Create Password · 014 Permissions · 015 Interests · 016 AI Personalization · 017 Complete Profile

**HOME (10):** 001 AI Home · 002 For You · 003 Nearby · 004 Trending · 005 Continue Planning · 006 Saved Widgets · 007 Weather Widget · 008 Calendar Widget · 009 AI Suggestions · 010 Search Overlay

**AI (12):** 001 Conversation · 002 Voice · 003 Live Camera · 004 AI Thinking · 005 Planner · 006 Compare · 007 Booking Summary · 008 Memory · 009 History · 010 Settings · 011 Feedback · 012 Shared Plan

**DISC (10):** 001 Feed · 002 Story · 003 Video · 004 Collection · 005 Category · 006 Nearby · 007 Following · 008 Trending · 009 Popular · 010 Event

**BUS (13):** 001 Profile · 002 Gallery · 003 Reviews · 004 Story · 005 Menu · 006 Services · 007 Team · 008 Booking · 009 Events · 010 Offers · 011 Similar · 012 Directions · 013 Contact

**BOOK (10):** 001 Date · 002 Time · 003 Guests · 004 Package · 005 Payment · 006 Confirmation · 007 Receipt · 008 Reminder · 009 Reschedule · 010 Cancel

**PAY (7):** 001 Wallet · 002 Cards · 003 Coupons · 004 Gift Cards · 005 Split Payment · 006 Refund · 007 History

**SOC (10):** 001 Feed · 002 Story · 003 Create Story · 004 Reel · 005 Comments · 006 Likes · 007 Followers · 008 Following · 009 Messages · 010 Notifications

**USR (10):** 001 Profile · 002 Reviews · 003 Saved · 004 Collections · 005 Badges · 006 Activity · 007 Achievements · 008 Trips · 009 Plans · 010 Settings

**MER (10):** 001 Dashboard · 002 Analytics · 003 Bookings · 004 Calendar · 005 Customers · 006 Messages · 007 Promotions · 008 Team · 009 Business · 010 Settings

**SET (10):** 001 Account · 002 Notifications · 003 Privacy · 004 Security · 005 AI · 006 Language · 007 Appearance · 008 Accessibility · 009 Payments · 010 Help

**ADM (10):** 001 Dashboard · 002 Businesses · 003 Users · 004 Reports · 005 Verification · 006 Categories · 007 AI Monitor · 008 Payments · 009 Logs · 010 Feature Flags

## Standard Screen Template (every screen)

Screen ID · name · purpose · primary user · entry points · exit points · required components · required APIs · required permissions · navigation · AI integration · animations · loading state · error state · offline state · empty state · analytics events · accessibility notes · edge cases · future enhancements.

This template is the shared basis for design, engineering, QA, and analytics.

## ADOPTED REFINEMENT (user, 2026-08-05): Contextual navigation, not absent navigation

The original "no navigation bar" is softened to a principle: **navigation should be contextual, not absent.** Onboarding: no chrome. AI conversation: conversation stays the focus. Discovery: subtle chips / segmented control for Discover · Nearby · Following. Profiles/settings: conventional patterns where they genuinely help. Navigation appears exactly when it helps the task — no hard rules.

## EXECUTION SWITCH (user decision)

Documentation stops here; product execution begins. Not 220 one-by-one screens — complete **Figma-ready UX specifications per feature area**, in order:

1. Authentication Flow (17 screens)
2. Home & AI Experience (25)
3. Discovery Feed (30+)
4. Business Experience (40+)
5. Booking & Payments (35+)
6. Social & Profiles (40+)
7. Merchant Platform (40+)
8. Settings & System (20+)

Each spec: user flows, wireframes, visual hierarchy, interaction details, motion, accessibility, developer handoff notes — assets teams build from directly.
