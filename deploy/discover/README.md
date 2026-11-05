# Manzil Discover

Discover is a separate installation of the complete upstream TREK application,
not a subset of its screens inside Next.js. Its own frontend, backend,
authentication, WebSockets, PWA, uploads and add-ons remain together.
The Manzil app hub at `/{uz,ru,en}/discover` links to the independent planner at
`https://discover.manzilgroup.uz/` and Reviews at `https://review.manzilgroup.uz/`.
Other Manzil pages keep their existing implementation and styles.

## Pinned upstream

- Release: [TREK v5.1.0](https://github.com/liketrek/TREK/releases/tag/v5.1.0)
- Source: [dc36c21c08f681fd2806764fad8e17b270f6f175](https://github.com/liketrek/TREK/tree/dc36c21c08f681fd2806764fad8e17b270f6f175)
- Official image: `mauriceboe/trek:5.1.0`
- Image digest: `sha256:23bf3fa6a134dc38a3b4f40ef8f7e8040abc96965105dffdcfcf5f202fb5d0b7`
- License: [AGPL-3.0](https://github.com/liketrek/TREK/blob/v5.1.0/LICENSE)
- [Upstream third-party notices](https://github.com/liketrek/TREK/blob/v5.1.0/NOTICE.md)
- [Upstream trademark policy](https://github.com/liketrek/TREK/blob/v5.1.0/TRADEMARKS.md)

The current runtime is built from the public [Manzil fork](https://github.com/gitcwyn25/Manzil-Discover/tree/codex/manzil-branding-auth).
It contains Manzil branding, confirmed Supabase accounts and private S3 uploads,
while retaining the pinned upstream native dependencies, supporting assets and
license notices. This directory's original wrapper is retained as bootstrap
history; future releases use the fork's `manzil-branding/package-runtime.mjs`.

## Deployment

Use the existing independent Railway service, one replica, with its volume at
`/persist`. Follow the fork's [build and runtime packaging instructions](https://github.com/gitcwyn25/Manzil-Discover/blob/codex/manzil-branding-auth/MANZIL.md),
then upload the exact verified runtime package as the build root. The live
service uses `RAILWAY_DOCKERFILE_PATH=Dockerfile` and `/api/health` readiness.
Preserve its existing volume, keys, database and uploads across releases.

Set these service variables through Railway's secret-aware UI or CLI:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `TZ` | `Asia/Tashkent` |
| `DEFAULT_LANGUAGE` | `en` |
| `APP_URL` | `https://discover.manzilgroup.uz` |
| `ALLOWED_ORIGINS` | `https://discover.manzilgroup.uz` |
| `FORCE_HTTPS` | `true` |
| `COOKIE_SECURE` | `true` |
| `TRUST_PROXY` | `1` |
| `ADMIN_EMAIL` | Initial administrator's email |
| `ADMIN_PASSWORD` | Random, unique bootstrap password; never commit it |
| `SUPABASE_URL` | `https://wfabehnihelxemztmvca.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Project's public key |
| `SUPABASE_S3_REGION` | `ap-southeast-1` |
| `SUPABASE_S3_BUCKET` | `manzil-discover` (private) |
| `SUPABASE_S3_ACCESS_KEY_ID` / `SUPABASE_S3_SECRET_ACCESS_KEY` | Server-side S3 credentials |
| `MANZIL_PROVISION_SUPABASE_STORAGE` | `0` after the completed one-time rollout |

TREK persists its automatically generated encryption/JWT/Web Push keys with its
database. Preserve `/persist/data` **and** `/persist/uploads` in backups. Do not
rotate or discard the volume during deployments. Configure scheduled backups
in the admin panel and keep copies outside this volume.

Add the custom domain to Railway and put the returned CNAME and verification
records into Ahost DNS. Wait for valid HTTPS before publishing the marketing
site's new Discover links.

## Full feature availability

The complete upstream application is shipped: trips and maps, search/routing,
tours, bookings, costs, packing/to-dos, collaboration, files, notifications,
journals/Studio, Atlas/Vacay/Collections, offline PWA, admin/security, plugins,
AI and MCP. Nothing has been recreated as a placeholder or removed from the
upstream image.

In this installation the default modules are enabled, together with Photos,
Road Trip, Collections, Journey, MCP, AI Assistant and AI Parsing. Packing bag
tracking, hiking/cycling overlays, ski routing, place photos, autocomplete and
enrichment are enabled too. Features involving external accounts need their own
configuration: AI provider/model access, SMTP email, OIDC, Google/Amap keys,
Immich/Synology, Dawarich and AirTrail. Shipping their code does not provision
those external services. Supabase accounts and private storage are configured;
custom SMTP and Discover redirect URLs were confirmed by the owner. Actual
email inbox delivery still needs an end-to-end user check. TREK's built-in public map/search/routing/weather
providers work independently of Manzil's old business database.

English and Russian are available upstream. This release has no Uzbek
translation; the Uzbek Manzil navigation still opens the complete app, which
uses browser detection or its English fallback. It has a separate user account
session system; Supabase identities are verified before native HttpOnly sessions
are issued. Sessions are not shared implicitly with the other subdomains.

## Live installation and administrator access

- App: https://discover.manzilgroup.uz/
- Railway project: `5aaa0d04-d009-4043-b94f-8f22a3772f3e` (Manzil Discover)
- Service: `a10f212a-8102-4d9e-9b46-7b542fad98b1` (discover)
- Production environment: `820204e4-b355-4159-8eb7-504f2cbb5a6b`
- Volume: `e55b622c-dc7e-484c-82e7-0b73d9176034`, mounted at `/persist`
- Initial deployment: `25908533-c8d4-4e7b-af07-17b9f802c46a`
- Current fork source: `4235d7468ea26a83ff5775a4d2a02179db18a983`
- Runtime deployment: `72efa8a0-6931-48e8-8c54-86bbdc015dea`
- Private storage rollout deployment: `daee86ba-d2e6-4937-80cf-44923a2a7240`

The administrator email is `hello.manzil.co@gmail.com`. The owner completed
the initial password change on 2 November 2026. Use the password the owner
chose in the app; the old `ADMIN_PASSWORD` bootstrap variable is not the
current password. These variables only seed an empty database; changing them
later does not change an existing user's password. Native administrator sign-in
is available at `/login?auth=local`.

Deploy the fork's clean, built, verified runtime package:

```sh
railway up <verified-runtime-package> --path-as-root --project 5aaa0d04-d009-4043-b94f-8f22a3772f3e --environment production --service a10f212a-8102-4d9e-9b46-7b542fad98b1 --detach
```

Validation: Railway build/readiness, trusted public HTTPS, the app and PWA
manifest/service worker, private-API authentication, administrator sign-in,
durable data/upload paths, trip create/read/delete, and an authenticated
WebSocket welcome handshake passed. The temporary verification trip was removed.
The final backend public checks also passed: active Supabase configuration,
invalid provider signature rejection (401 without session cookies), and disabled
native registration (403). Railway confirmed all five user-upload category
migrations completed. The owner retained the 4 MB upload cap; photo caches and
backups stay local. Interactive browser, confirmation-email inbox and offline
device testing were unavailable in this session.
