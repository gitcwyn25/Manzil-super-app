# Business acquisition: photos, review media, and owner replies — design

**Date:** 2026-07-29
**Status:** approved in conversation, pending written review
**Branch:** `feat/frontend-elevation`

## Why this is smaller than it sounds

Most of this is already built. An audit of the repo before designing found:

| Capability | State |
|---|---|
| Presigned R2 upload, ownership-checked | **Built** — `POST /media/presign` ([media.controller.ts](../../../apps/api/src/modules/controllers/media.controller.ts)) verifies the target, builds a storage key that never trusts the client filename, and creates the `Photo` row |
| `Photo` model, polymorphic business/review | **Built** — `businessId?` / `reviewId?`, `storageKey`, `publicUrl`, `moderationStatus`, three indexes |
| Browser upload component | **Built** — `PhotoUpload` with MIME allowlist, 8MB cap, Clerk token. **Rendered nowhere.** |
| Review photo upload | **Built** — `review-form.tsx` has its own `uploadReviewPhoto`, duplicating the presign flow |
| Owner reply API | **Built** — `POST /reviews/:id/replies`, one per review via `ReviewReply.reviewId @unique` |
| Owner reply, public display | **Built** — `review-list.tsx` renders `review.reply` |
| Registration terms + contract | **Built** — `LegalDocument` / `LegalAcceptance` / `Contract` models, three `/legal` endpoints, version-pinned consent on the register form |

So this is not "build media upload." It is: **render the component that already exists, decide which photo is the cover, show photos where businesses appear, and give owners a reply box.**

Four real gaps:

1. `PhotoUpload` is orphaned — no page mounts it.
2. Photos are created `pending` and **nothing ever approves them**, so every upload is invisible forever.
3. Nothing reads `Photo.publicUrl` for display. Cards and the hero carousel use generated gradients.
4. `dashboard/reviews` has **no reply affordance** — the endpoint and the public display both exist, but owners cannot write one.

Plus one small addition, since contracts were named in the request: `GET /legal/businesses/:slug/contract` has no page.

## Decisions taken

| Question | Decision | Reason |
|---|---|---|
| Moderation | Owner photos of their own claimed business auto-approve. Review photos stay `pending`. | Pre-launch there is no moderator. A queue means no photo ever appears. An owner photographing their own business is a different risk from a stranger posting to it. |
| Register flow | Photos are a **separate step after the business exists**, with a real Skip. | `POST /media/presign` verifies `ownerId` before signing, so a photo cannot be uploaded before the business record exists. Staging bytes client-side would leave a confusing half-state when a create succeeds and an upload fails. |
| Cover selection | Explicit `Photo.isCover`, owner-chosen; first approved upload auto-covers. | "Newest wins" changes the face of a listing silently whenever anyone uploads. |
| Step order | Details+Terms → Plan → **Photos (skippable)** → Dashboard | An optional step must not sit in front of the monetisation step. |

## Architecture

### Data

One additive migration:

```prisma
model Photo {
  // ...existing fields
  isCover Boolean @default(false)

  @@index([businessId, isCover])
}
```

No unique constraint on `(businessId, isCover)` — Postgres treats every `false` as distinct under a plain unique index, and a partial unique index is not expressible in the Prisma schema language. Single-cover is enforced in the repository inside a transaction: clear the current cover, set the new one.

### Moderation, at the one place photos are created

`media.controller.ts` currently hardcodes `moderationStatus: "pending"`. It becomes conditional:

- `ownerType === "business"` **and** the authenticated user is the business's `claimedByUserId` → `approved`, and `isCover: true` when the business has no cover yet.
- Everything else → `pending`.

This is the only place a `Photo` row is created, which is what makes the change safe. The check must use the server-side claim, never a client-supplied flag.

### Reading photos

One helper, `getBusinessCover(businessId)`, returning `publicUrl | null` for the approved cover. Consumed by `BusinessCard`, `home-card`, and `HeroBusinesses`. Each renders `<img>` when a cover exists and **falls back to today's gradient when it does not** — with 0 businesses in production the fallback is the common path for a while, so it stays rather than being deleted.

### Surfaces

| Surface | Change |
|---|---|
| `/business/register/photos` | New step. Mounts `PhotoUpload`, thumbnail grid, "Make cover", prominent Skip → dashboard. |
| `dashboard/settings` | Same component, so photos are editable later. |
| `dashboard/reviews` | Reply form per review, posting to the existing endpoint. Read-only once replied. |
| `review-list.tsx` | Approved review photos strip. Pending photos render nothing — not a placeholder. |
| `review-form.tsx` | Replace private `uploadReviewPhoto` with shared `PhotoUpload`; delete the duplicate. |
| `dashboard/settings` | Link to the signed contract, from the existing `/legal/businesses/:slug/contract`. |

## Testing

- **Jest (API):** owner photo of own business → `approved`; non-owner → `pending`; review photo → `pending`; first business photo → `isCover`; second → not cover; setting a new cover clears the old one in one transaction.
- **Playwright:** register → photos step → Skip lands on dashboard; upload shows a thumbnail; reply box disappears after replying.

Playwright cannot execute in the current environment (no dev server, no Clerk credentials). Specs ship written but unverified, consistent with the rest of this branch.

## Deliberately out of scope

- Image resizing/variants. The R2 pipeline stores originals; an 8MB cap bounds the damage. Revisit when real traffic exists.
- Admin moderation queue UI for `pending` review photos. Nothing approves them yet, so review photos remain invisible after this work. That is a known, accepted gap — it needs a moderator to exist first, and it is a separate piece of work.
- Automated content scanning.

## What this does not fix

Two blockers sit outside this design and gate its value:

1. **Railway deploys are paused at the account level.** The live API is a build from 5 July; none of this reaches production until that clears.
2. **The production database has 0 businesses.** There is nothing to photograph and nothing to show a cover for. `tech-office/PRD.md` §8 names pre-seeding as the non-negotiable prerequisite, and it is unmet.
