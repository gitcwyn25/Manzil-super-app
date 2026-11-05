# Manzil app hub and Reviews

The public hub is `https://manzilgroup.uz/discover` (localized by the main
website). Its two application destinations have separate frontends and sessions:

- `https://discover.manzilgroup.uz/`: the complete Manzil-branded planner; see
  [Discover operations](../discover/README.md).
- `https://review.manzilgroup.uz/`: local business search, maps, reviews, saved
  places and verified owner workflows, built from `apps/reviews`.

## Hosting

Reviews has its own Vercel project `manzil-reviews`, ID
`prj_qpfMfwvRDA1Uvg96S1a0JPhAVw6h`, in the Manzil Group team. Its root directory
is `apps/reviews`; it must never reuse the main `manzil-web` project identity.
The custom domain is verified and its CNAME points to
`4c88f927f995cf90.vercel-dns-017.com`.

The shared API remains `https://manzil-api-production.up.railway.app/v1`:

- Railway project `b2ad1a54-7083-4405-a56f-754e2a36391a`.
- Production environment `671e04bf-0c83-4bf4-88ce-9f516503b318`.
- Service `62eb2e6e-7b8b-41a6-9fee-0f598bba0323`.
- Dockerfile `apps/api/Dockerfile`, readiness `/v1/health`.
- Previous successful deployment `821eae3b-e5ab-4e86-b97c-68983fb85890`.

The API deployment archive is exported from an exact Git commit, including only
the root build inputs, API, shared package and database package. This keeps
unfinished frontend work and local configuration outside the API release.

Published frontend source: `21af6c1e4d2f9e9d5e602b32c9c1d7119f33495f`.
Reviews production deployment `dpl_Hr2ai2yBfgQSLfhxGbpvChXcPXF1` and main-site
deployment `dpl_8Me7vB2PaCLsTxCHLKcLQoxiHJMh` are READY. The API deployment is
`e3711d3a-9e9a-4415-ac2e-27d3b11f1b4d` from `a908840b842d`.

The 5 November 2026 visual release gives the landing page `#F0F0F0`, `#105BFF`
and a small `#FE8500` accent; the localized Discover hub uses `#0009FF`,
`#FDFDFE` and a small `#F42902` accent; Reviews uses `#F42902`, `#FDFDFF`
and `#83FD90`. All three use viewport-sized photo headers and simpler actions.
Approved business cover photos also extend across the Reviews detail page.
The latest update replaces small hero assets with native 5985px Chorsu, 4472px
metro and 3840px café photographs, using responsive Next Image delivery and
visible photo credits. All three live optimizers returned actual 3840 × 2560
JPEGs (approximately 477 KB, 1045 KB and 934 KB respectively). See
[photography sources and licences](PHOTOGRAPHY.md).
The landing page now has four concise benefit summaries and a simpler FAQ;
the hub and Reviews have clearer actions, stronger contrast, more readable
type and calmer spacing. Development status remains explicit in all locales.
Main web and Reviews typechecks, both Vercel production builds, nine live hub
HTTP checks, and public palette/image checks passed. Browser visual and
interaction QA remain unverified because the browser host is unavailable.

Live checks passed for Reviews pages, real cards/details, signup entry, browser
public configuration, sitemap, responsive CSS and unknown-business 404. All nine
hub HTTP checks passed. Temporary confirmed-account API checks verified private
saved-list persistence/idempotency and account isolation; both test accounts were
removed. Browser interaction, actual email inbox delivery and browser uploads
remain unverified because the browser host is unavailable.

## Accounts, data and moderation

Public Reviews settings are `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_URL` and
`NEXT_PUBLIC_SITE_URL`. Only public connection values belong in this frontend.
The API has the matching fixed Supabase project settings and its existing
server-side database/storage credentials. Existing CORS origins are preserved,
with the Review and current Manzil domains appended.

The owner confirmed `https://review.manzilgroup.uz/**` in Supabase Auth redirect
URLs. Keep the existing Site URL and Discover redirects. SMTP configuration is
not a substitute for checking a real confirmation/recovery email in an inbox.

Consumer passwords are managed by Supabase. API identities are verified against
project `wfabehnihelxemztmvca`; confirmed non-anonymous accounts, active local
status and provider MFA are required. Email collisions never auto-merge accounts,
and user metadata cannot grant roles. Separate console administrator credentials
remain separate from consumer accounts.

`POST /reviews-directory/businesses` creates a pending listing and registration
claim. Console approval assigns the matching registrant ownership atomically.
The existing `/crm/register` policy is preserved for the Cooperation product.
New or edited Reviews submissions await moderation. Directory counts exclude
seed review authors; media comes from approved gallery/cover endpoints.

See the [exact API contract](../../apps/api/reviews-contract.md).

## Database rollout

The production migration history was audited before applying these additive
migrations successfully on 4 November 2026:

- `20260907110000_add_gurman_waitlist_profile`: four nullable fields on the
  existing private waitlist table.
- `20261104090000_reviews_saved_places`: saved lists with unique account,
  business and list membership, foreign keys, RLS and no direct client access.

Existing table RLS remains enabled. Prisma connects as the privileged backend
role. Do not run production seeds, schema resets, `db push`, or the raw schema
diff: the Prisma schema also declares gated intelligence models whose migrations
are intentionally not part of this release.

## Local checks

```sh
npm ci --ignore-scripts
npm run db:generate
npm run typecheck --workspace @manzil/api
npm run build --workspace @manzil/api
npm run typecheck --workspace @manzil/reviews
npm run build --workspace @manzil/reviews
npm run dev:reviews
```

The initial release provides the core search, detail, review, save, claim and
moderation loop. Advanced geospatial pagination, paid placements, booking
integrations and a social feed are future work. No simulated reviews, payment
flows or availability data stand in for those features.
