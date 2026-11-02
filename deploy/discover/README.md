# Manzil Discover

Discover is a separate installation of the complete upstream TREK application,
not a subset of its screens inside Next.js. Its own frontend, backend,
authentication, WebSockets, PWA, uploads and add-ons remain together.
The Manzil marketing site links to `https://discover.manzilgroup.uz/`; old
`/{uz,ru,en}/discover` bookmarks redirect there. Other Manzil pages keep their
existing implementation and styles.

## Pinned upstream

- Release: [TREK v5.1.0](https://github.com/liketrek/TREK/releases/tag/v5.1.0)
- Source: [dc36c21c08f681fd2806764fad8e17b270f6f175](https://github.com/liketrek/TREK/tree/dc36c21c08f681fd2806764fad8e17b270f6f175)
- Official image: `mauriceboe/trek:5.1.0`
- Image digest: `sha256:23bf3fa6a134dc38a3b4f40ef8f7e8040abc96965105dffdcfcf5f202fb5d0b7`
- License: [AGPL-3.0](https://github.com/liketrek/TREK/blob/v5.1.0/LICENSE)
- [Upstream third-party notices](https://github.com/liketrek/TREK/blob/v5.1.0/NOTICE.md)
- [Upstream trademark policy](https://github.com/liketrek/TREK/blob/v5.1.0/TRADEMARKS.md)

Application binaries are unmodified. This public directory supplies the hosting
wrapper; it only redirects the existing data/upload paths to one persistent
volume and then calls the upstream entrypoint. Upstream branding and notices
remain. This is an independently hosted instance, with no claimed TREK endorsement.

## Deployment

Create an independent Railway service with one replica and a volume mounted at
`/persist`. Upload **this directory as the build root**, not the Manzil monorepo.
Its `railway.json` uses the Dockerfile and `/api/health` readiness endpoint.
Do not mount a volume over `/app`; that would hide the application.

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
those external services. TREK's built-in public map/search/routing/weather
providers work independently of Manzil's old business database.

English and Russian are available upstream. This release has no Uzbek
translation; the Uzbek Manzil navigation still opens the complete app, which
uses browser detection or its English fallback. It has a separate user account
system; Manzil/Clerk sessions are not shared implicitly.

## Live installation and administrator access

- App: https://discover.manzilgroup.uz/
- Railway project: `5aaa0d04-d009-4043-b94f-8f22a3772f3e` (Manzil Discover)
- Service: `a10f212a-8102-4d9e-9b46-7b542fad98b1` (discover)
- Production environment: `820204e4-b355-4159-8eb7-504f2cbb5a6b`
- Volume: `e55b622c-dc7e-484c-82e7-0b73d9176034`, mounted at `/persist`
- Initial deployment: `25908533-c8d4-4e7b-af07-17b9f802c46a`

The initial administrator email is `hello.manzil.co@gmail.com`. Its unique
bootstrap password is stored only in the service's `ADMIN_PASSWORD` Railway
variable. Retrieve it from the authenticated Railway dashboard, sign in, and
choose your own password in the app. These variables only seed an empty
database; changing them later does not change an existing user's password.

To deploy future changes to this hosting wrapper from the repository root:

```sh
railway up deploy/discover --path-as-root --project 5aaa0d04-d009-4043-b94f-8f22a3772f3e --environment production --service a10f212a-8102-4d9e-9b46-7b542fad98b1 --detach
```

Validation: Railway build/readiness, trusted public HTTPS, the app and PWA
manifest/service worker, private-API authentication, administrator sign-in,
durable data/upload paths, trip create/read/delete, and an authenticated
WebSocket welcome handshake passed. The temporary verification trip was removed.
Interactive browser and offline-device testing were unavailable in this session.
