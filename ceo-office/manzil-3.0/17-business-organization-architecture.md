# 🏢 MANZIL — Business Organization Architecture (v1.0)

> Captured 2026-08-06. The second moat after Gurman: **Organization → Brand → Locations → Experiences**, not Business → Listing. Scales from a barber shop to Marriott.

## Core model

Organization { members, brands, locations, services, staff, workspace, marketing, analytics, billing } — the Stripe/Shopify/Meta-Business-Suite pattern. Owner journey: signup → create organization → choose business type → create first location → complete profile → publish. **One owner, many businesses, one login, one CRM** (Ali Holding → Burger House · Coffee Time · Car Wash · Beauty Salon), Instagram-style switcher (top-left dropdown, bottom sheet, no logout).

## Roles

Owner (everything) · Admin · Marketing (no billing; stories/ads/campaigns/announcements/coupons) · Manager (bookings/calendar/staff/reviews/customers) · Reception (bookings only) · Staff (own appointments only) · Analyst · Viewer. **Never hardcode permissions** — permission policies (`booking.read`, `campaign.publish`, `analytics.export`…); roles are collections. Authorization chain: JWT → user → organization → role → permission → resource → action; 403 otherwise.

## Multi-location

Chain → corporate + per-location analytics, separate staff/inventory, shared marketing.

## CRM — six pillars

1. **Customer** — a relationship timeline (visits, occasions, reviews, stories, favorites, LTV), not just bookings.
2. **Bookings** — upcoming/completed/cancelled/no-show/pending, searchable.
3. **Workspace** (business-side) — today/tomorrow/weekend/month, staff, bookings, revenue, tasks.
4. **Marketing Hub** — campaigns (seasonal), announcements (operational, auto-distributed to profile/feed/bookings/notifications — "pool closed today" notifies tomorrow's reservations), stories (24h), posts, offers, coupons, events.
5. **Targeting** — radius/age/gender/language/budget/interest/visit history/favorites/lapsed customers/lookalikes (Meta-Ads-like; e.g. 2km · coffee lovers · 18-30 · visited before · not in 60 days).
6. **Ads** — separate from subscriptions; objectives (awareness/traffic/bookings/followers/stories/events/calls/messages) with AI assist.

## Gurman for Business (killer feature)

"We are empty on Tuesdays" → occupancy analysis + campaign suggestion + expected lift + budget. "Reviews mention parking 35×" → partnership recommendation. Analytics as AI summaries with recommendations, not raw charts.

## Lifecycle & verification

Listing lifecycle: draft → pending verification → published → featured → paused → archived → deleted (never immediate delete). Verification ladder: business/owner/location/phone/tax/payment/menu/staff → confidence.

## Five progressively unlocked products

Business Core (org, locations, staff, verification) → Operations (bookings, workspace, calendar, customers) → Marketing Hub → Business Intelligence (analytics, AI insights, segmentation, LTV) → Business OS (inventory, payments, invoices, loyalty, API integrations, automation).
