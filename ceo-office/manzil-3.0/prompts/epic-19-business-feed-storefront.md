# Epic 19 — Business Feed: connecting Workspace to Marketplace

## Sequencing addendum (ko'chirilgan)

Ushbu epic dastlab pozitsiya 19'da rejalashtirilgan edi, lekin amalga oshirish ustuvorligi bo'yicha Epic 00 blokiga (00A dan keyin) ko'chirildi: bu yangi arxitektura talab qilmaydigan, mavjud sxema (BusinessPackage, Announcement, Campaign) ustida ishlaydigan proyeksiya qatlami, va Truth & Trust muammosining to'g'ridan-to'g'ri davomi hisoblanadi. Raqam (19) hujjat identifikatori sifatida saqlanadi; BAJARILISH TARTIBI o'zgaradi.

> **QUEUED.** Numbered 19; Autonomous Marketplace moves to 20. See [EPIC-LADDER.md](EPIC-LADDER.md).

## The verified problem

Manzil currently runs **two disconnected products**. Owners publish into the Business Workspace; customers never see it.

**Verified against the codebase 2026-08-07:**

| Owners can create (schema) | Rendered on the public business page |
|---|---|
| `BusinessPackage` (services) | ✅ packages |
| `Announcement` | ❌ **nothing** |
| `Campaign` (offers/promos) | ❌ **nothing** |
| photos | ✅ gallery |
| reviews | ✅ reviews |

The public page renders gallery · photos · packages · reviews and stops. **Announcements and campaigns reach no customer.** Every hour an owner spends in the workspace produces value that evaporates — and Gurman has less real data to reason over.

They should be **the same data viewed from different perspectives.**

## Architecture: one source of truth, one feed

Introduce a **Business Feed**. Every published object becomes a feed item: `ServicePublished` · `OfferPublished` · `AnnouncementPublished` · `EventPublished` · `MenuUpdated` · `PhotoAdded` · `ReviewAdded`.

The business profile renders this feed in sections. **Discover and Gurman consume the same published data. There must never be two sources of truth.**

## Modular business profile (section order)

1. **Hero** — cover, info, rating, follow, save, book, share
2. **Services** — each published service: name, price, duration, description, availability, featured badge, Book button
3. **Current offers** — active discounts, expiry, conditions, AI explanation ("best value")
4. **Menu** (restaurants) — categories, photos, prices, popular items
5. **Announcements** — newest first: news, new dishes, renovation, holiday hours, live music
6. **Events** — date, seats, Book now
7. **Gallery** · 8. **Reviews** · 9. **AI summary** · 10. **Similar businesses**

A customer must immediately learn: what does this business offer · what can I book · what is new · what is on sale · what events are happening · why does Gurman recommend it — **without leaving the page.**

## Visibility state machine (every publishable entity)

`Draft → Scheduled → Published → Expired → Archived`. **Only `Published` is publicly visible.** This is a security boundary as much as a product one — see the concurrent security audit: draft content must be unreachable from any public route.

## Publishing pipeline

```
Workspace draft → Publish → validation → database → search index
  → consumer business page → Gurman retrieval
```

With live feedback (no page refresh): spinner → "Publishing…" → invalidate cache → revalidate business page → revalidate Discover → revalidate Gurman retrieval → "Published successfully".

**Reuses Epic 17's mutation system** — this is exactly the loading/success/error/idempotency infrastructure it builds. Do not hand-roll another one.

## Binding constraints

1. **Honesty rules apply.** A business with no services/offers/announcements shows honest empty sections or omits them — never placeholder content. "AI summary" renders only when Epic 06 can actually compute one; otherwise it is absent, not invented.
2. **Menus and Events have no schema today.** Report what they require; do not invent models mid-epic. Announcements and campaigns exist and are the immediate win.
3. **No new table or migration is required for this epic.** The Business Feed is a projection, not a second store: it reads the existing `BusinessPackage`, `Announcement`, and `Campaign` Prisma models directly. If a future scope change ever requires a new table, it must follow the M1 gating discipline (`packages/db/migrations-gated-m1/`, double-signal activation) used by Epics 04-06.
4. **The feed is a projection, not a second store.** It reads published entities; it does not duplicate them.
5. **No dependency on Epic 04-06 — reads existing Announcement/Campaign models directly.**

## Why it matters

This turns the public profile from a static business card into a living storefront: every owner action immediately increases customer-facing value **and** gives Gurman more real data to reason over — which is the flywheel the whole platform depends on.
