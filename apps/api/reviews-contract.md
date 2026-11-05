# Manzil Reviews API contract

Base: `https://manzil-api-production.up.railway.app/v1`. Responses wrap payloads in `{ "data": ... }`; Nest errors use HTTP status plus `message`.

## Directory (public)

- `GET /reviews-directory?q=&category=all`: `{ businesses: Business[], categories: Category[] }`. Name, district, address and descriptions are searched, case-insensitively. Query/category max 120 characters. Up to 500 matches, sorted by genuine approved rating, review count, then name. Clients may apply price/rating/open/distance filters to those results; this is not an unlimited city-wide geospatial query.
- `GET /reviews-directory/businesses/:slug`: `{ business: Business, reviews: Review[] }`. Up to 200 newest approved reviews; suspended/merged/pending-claim listings return 404.

`Business` retains the shared shape: `id,slug,name,categorySlug,description:{uz,ru,en},address,district,city,lat?,lng?,phone?,hours,priceTier?,status,avgRating,reviewCount,photo,tags,foundingBusiness,email?,website?,instagram?,telegram?`. `photo: "business"` is a legacy placeholder key, **not** a photo URL. Load real media separately. `priceTier` is `$|$$|$$$`, omitted when unknown in the directory facade. `hours` is the legacy plain text range from hoursJson, not guaranteed weekly structured opening hours; missing or unparseable hours must be unknown, never “open”. Public responses omit legalName/taxId. Directory reads exclude pending submissions.

`Category`: `{id,slug,name:{uz,ru,en},parentId?}`.

Directory `Business` also contains `hoursSchedule:Record<string,string>`, copied from string-valued known keys in the stored JSON only: `daily`, `weekdays`, `weekend`/`weekends`, full English weekday names and `mon`–`sun`. Missing schedules return `{}`. Resolve the actual Asia/Tashkent weekday before applying a range, with exact weekday taking priority over weekday/weekend group then daily. Do not infer a seven-day schedule from the legacy `hours` label. Closed/unknown/overnight ranges need explicit client handling; no live availability is implied.

`Review`: `{id,businessSlug,authorName,authorBadge?,rating,text,locale,createdAt,helpfulCount,verifiedVisit,reply?}`. Reply includes `{id,reviewId,businessOwnerId,text,createdAt,updatedAt}`. No public user email/ID is exposed. Demo authors with an email ending `@seed.manzil.local` are excluded. All ratings/counts in this facade are recomputed from eligible approved reviews, including when a legacy seeded aggregate differs. No default reviews or ratings are fabricated.

## Accounts and saved lists (Bearer required)

Use the Supabase access token as `Authorization: Bearer …`. The API verifies it against only project `wfabehnihelxemztmvca`, requiring a confirmed, non-anonymous account, matching subject and a valid authenticated audience/expiry. Active MFA factors require `aal2`. Missing public Auth configuration returns 503. Invalid sessions return 401; suspended/banned local accounts 403; an email belonging to another existing account 409. There is no automatic account merge or metadata role assignment. New identities become consumers with `clerkId=supabase:<verified UUID>`; existing exact subjects retain the stored role.

- `GET /reviews-directory/profile`: `{user:{id,email,displayName,locale,role},reviews:(Review & {moderationStatus:'pending'|'approved'|'rejected'})[]}`. Own history only, up to 200 newest reviews.
- `GET /reviews-directory/favorites`: `{items:[{id,businessId,listType,createdAt,business:Business}]}`. Own entries only, newest first, max 1000; hidden listings omitted. Business rating counts use the same honest aggregation.
- `PUT /reviews-directory/favorites/:businessId?listType=favorites`: `{id,businessId,listType,createdAt}`. Idempotent per account/business/list. Business must be visible.
- `DELETE /reviews-directory/favorites/:businessId?listType=favorites`: `{removed:true}`. Idempotent and can remove a now-hidden business.

`listType` must be `favorites`, `want_to_try` or `visited`; default `favorites`. Never pass another user ID. These routes derive identity from the authenticated actor. SavedPlace has RLS enabled, no anon/authenticated direct table access or client policy; API Prisma must connect as the table owner or an appropriately privileged backend role.

## Existing writes reused by Reviews

- `POST /businesses/:slug/reviews` body `{rating:1..5,text:string}` (3–4000 chars), returns `{review:Review & {moderationStatus:'pending'}}`. One review per user/business, repeated writes edit/requeue it. **All new/edited reviews await moderation**, including edits of rejected reviews. Hidden submissions cannot receive reviews. The page should confirm “submitted for review”, not “published”.
- `POST /reviews/:id/helpful`, `POST /reviews/:id/report` body `{reason}`, `POST /reviews/:id/replies` body `{text}`. Replies require server-checked business ownership.
- `POST /claims` body `{businessSlug?,businessName,ownerName,phone,note?}`. Manual admin verification; receipt is not a verified-owner badge.
- `POST /reviews-directory/businesses` body `{name,categorySlug,descriptionUz,address,district,city?,phone?,email?,website?,priceTier?,acceptedTerms:true,acceptedTermsVersion?}`. Validate/display current legal terms first; requires agreed terms. Produces a pending business/claim without assigning claimed ownership or elevating a consumer role; show the pending listing read-only until admin approval. The server checks terms version and records IP/user agent. The existing `/crm/register` route retains its immediate self-registration policy for other Manzil pages; Reviews must use its own endpoint.
- `GET /businesses/mine`: `{businesses:Business[],reviews:Review[]}` (owner scope, includes own pending submissions and legal fields). Owner ratings/reviews also exclude seeded review authors. `PATCH /businesses/:slug` is guarded by role plus actual ownership.
- `GET /media/businesses/:slug/photos` returns approved public business gallery. `GET /media/business-covers?slugs=a,b` returns existing covers. Inspect existing MediaController response wrappers when consuming.
- `POST /media/presign` body `{ownerType:'business'|'review',ownerId,contentType,contentLength}` returns `{photoId,uploadUrl,requiredHeaders,storageKey,publicUrl,moderationStatus,isCover}`. PUT original bytes to uploadUrl with exact requiredHeaders. Review target must belong to the current reviewer; its photos remain pending. Files may require cross-origin upload access from the storage provider. Do not treat a presign response as upload completion.

Admin moderation remains the separate `/console` credential-cookie system and existing admin app. A Supabase consumer session never grants console access. Never expose an admin token or service key in the Reviews client.

Console `POST /console/businesses/:id/approve` atomically completes a pending registration only when its claim has `verificationMethod=registration` and its requester matches the business's `createdByUserId`. It assigns claimed ownership/time, approves that claim, promotes only a consumer to business_owner and writes the actual console AdminUser actor into AuditLog. It does not approve unrelated manual claims or demote an existing role. Credential-only console AdminUser IDs are not written into the ClaimReviewer User foreign key.

## Release requirements

1. Generate Prisma client for the changed schema during the API build. Apply only `prisma migrate deploy --schema packages/db/schema.prisma` with the backend database environment. The new additive migration is `20261104090000_reviews_saved_places`; do **not** run production seeds or the generic pasted password schema.
2. Configure backend `SUPABASE_URL=https://wfabehnihelxemztmvca.supabase.co` and `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`), and append `https://review.manzilgroup.uz` to existing `WEB_ORIGIN` origins. Preserve other production origins.
3. Add `https://review.manzilgroup.uz/**` to Supabase Auth redirect allowlist; keep the existing Site URL and Discover redirects. Existing custom SMTP needs an actual signup/reset inbox round trip.
4. Deploy the new API before the Reviews UI. Verify native Clerk clients still work, invalid tokens cannot write, directory reads are genuine, own favorites persist, new reviews stay pending, and separate admin review works.

Implementation is local source until those deployment/environment/database checks are complete. PostGIS, unlimited/paginated distance search, paid placements, booking integrations and social feed are later work; none are simulated here.
