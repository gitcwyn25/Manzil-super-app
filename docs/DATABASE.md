# Database Schema Documentation

## Manzil Super-app Database Design

This document describes the core database model for Manzil: users, business listings, reviews, moderation, claims, saves, social graph features, and future monetization tables.

## Tables Overview

### Users (`users`)

Stores consumer, business-owner, and admin accounts.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | Primary key, usually a CUID |
| `clerkId` | TEXT | Unique Clerk user ID |
| `email` | TEXT | Unique email address |
| `displayName` | TEXT | User display name |
| `avatar` | TEXT | Optional avatar URL |
| `role` | ENUM | `CONSUMER`, `BUSINESS_OWNER`, or `ADMIN` |
| `locale` | TEXT | Preferred language, such as `uz`, `ru`, or `en` |
| `createdAt` | TIMESTAMP | Account creation time |
| `updatedAt` | TIMESTAMP | Last update time |

Key indexes: unique indexes on `clerkId` and `email`.

### Businesses (`businesses`)

Stores business listings with location, category, ownership, and ranking metadata.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | Primary key |
| `name` | TEXT | Business name |
| `categoryId` | TEXT | Foreign key to `categories.id` |
| `description` | TEXT | Optional business description |
| `address` | TEXT | Street address |
| `latitude` | FLOAT | Latitude coordinate |
| `longitude` | FLOAT | Longitude coordinate |
| `phone` | TEXT | Optional phone number |
| `hours` | JSON | Optional operating hours |
| `priceTier` | TEXT | `BUDGET`, `MODERATE`, `EXPENSIVE`, or `LUXURY` |
| `status` | ENUM | `UNCLAIMED`, `CLAIMED`, or `PENDING` |
| `claimedByUserId` | TEXT | Optional owner user ID |
| `qualityScore` | FLOAT | Denormalized ranking score |
| `createdAt` | TIMESTAMP | Creation time |
| `updatedAt` | TIMESTAMP | Last update time |

Relationships: `categoryId` references `categories.id`; `claimedByUserId` references `users.id` and is nullable.

### Categories (`categories`)

Stores category taxonomy with localized labels.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | Primary key |
| `name` | JSON | Localized labels, for example `{ "uz": "...", "ru": "...", "en": "..." }` |
| `icon` | TEXT | Optional icon or emoji |
| `parentId` | TEXT | Optional parent category ID |
| `createdAt` | TIMESTAMP | Creation time |

### Reviews (`reviews`)

Stores user reviews and ratings for businesses.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | Primary key |
| `businessId` | TEXT | Foreign key to a business |
| `userId` | TEXT | Foreign key to the reviewer |
| `rating` | SMALLINT | Rating from 1 to 5 |
| `text` | TEXT | Review body |
| `helpfulCount` | INT | Helpful vote count |
| `createdAt` | TIMESTAMP | Creation time |
| `updatedAt` | TIMESTAMP | Last update time |

Constraint: `UNIQUE(businessId, userId)` enforces one review per user per business.

### Review Replies (`review_replies`)

Stores business-owner responses to reviews.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | Primary key |
| `reviewId` | TEXT | Foreign key to review |
| `businessOwnerId` | TEXT | Foreign key to responding owner |
| `text` | TEXT | Reply body |
| `createdAt` | TIMESTAMP | Creation time |

### Photos (`photos`)

Stores user- and business-uploaded media.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | Primary key |
| `storageUrl` | TEXT | Cloudflare R2 or CDN URL |
| `uploaderUserId` | TEXT | Uploading user ID |
| `businessId` | TEXT | Optional business photo target |
| `reviewId` | TEXT | Optional review photo target |
| `moderationStatus` | TEXT | `PENDING`, `APPROVED`, or `REJECTED` |
| `createdAt` | TIMESTAMP | Creation time |

Either `businessId` or `reviewId` should be set, not both.

### Claims (`claims`)

Stores business ownership verification history.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | Primary key |
| `businessId` | TEXT | Claimed business ID |
| `userId` | TEXT | Claiming user ID |
| `status` | ENUM | `PENDING`, `APPROVED`, or `REJECTED` |
| `verificationMethod` | TEXT | `PHONE`, `EMAIL`, or `MANUAL` |
| `reviewedByAdminId` | TEXT | Optional reviewing admin ID |
| `createdAt` | TIMESTAMP | Claim creation time |
| `reviewedAt` | TIMESTAMP | Optional review time |

### Reports (`reports`)

Stores abuse and spam reports.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | Primary key |
| `targetType` | TEXT | `REVIEW` or `PHOTO` |
| `targetId` | TEXT | Target record ID |
| `reporterUserId` | TEXT | Reporting user ID |
| `reason` | TEXT | Report reason |
| `status` | TEXT | `PENDING`, `REVIEWED`, or `RESOLVED` |
| `createdAt` | TIMESTAMP | Report creation time |

### Social and Saved Items

`follows` stores the social graph with a unique `(followerId, followedId)` constraint.

`saves` stores saved businesses with a unique `(userId, businessId)` constraint.

### Monetization and Recognition

`subscriptions` stores business subscription tiers.

`achievements` and `user_achievements` store achievement definitions and earned badges.

`business_badges` stores business profile badges such as family-friendly, eco-friendly, or good-for-work.

## Key Design Decisions

Localized data uses JSON objects keyed by locale, usually `uz`, `ru`, and `en`.

Photos are polymorphic and can attach to businesses or reviews.

Reviews are unique per user and business, so edits update the existing review instead of creating duplicates.

Claims provide an audit trail for business ownership verification.

`qualityScore` is denormalized and should be recalculated by background jobs when ratings, reviews, photos, or listing quality signals change.

## Migration Strategy

Use `npm run db:push` for quick local schema synchronization during early development.

Use `npm run migrate:deploy --workspace db` for staging and production migrations.

Use `npm run db:seed --workspace db` or the repo seed tools to load initial categories and demo listings.
