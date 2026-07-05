# Manzil Admin

The operational console for Manzil — moderation, user management, and audit.
Separate Next.js app (App Router), deployed to its own subdomain. It holds no
business logic of its own: every action goes through the NestJS console API
(`/v1/console/*`), which enforces permissions and writes the audit log.

## Run locally

Prereqs: the API (`apps/api`) and Postgres (Supabase) running, and the admin
RBAC seeded.

```bash
# 1. one-time: push schema + seed roles/permissions/super_admin (from repo root)
npx prisma db push --schema packages/db/schema.prisma
npx tsx packages/db/prisma/seed-admin.ts

# 2. run the API (repo root)
npm run start:dev --workspace @manzil/api      # http://localhost:4000

# 3. run the admin app
npm run dev --workspace @manzil/admin          # http://localhost:3100
```

### Environment (`apps/admin/.env.local`)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Console API base, e.g. `http://localhost:4000/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Admin sign-in (same Clerk instance as the consumer app; authorization is by AdminUser, not Clerk membership) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `ADMIN_DEV_CLERK_ID` | **Local only.** When Clerk is disabled, impersonate this admin's `clerkId` via dev headers. Remove in any hosted env. |

To run without Clerk locally, leave `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` empty and
set `ADMIN_DEV_CLERK_ID` to a seeded admin's `clerkId`.

## Seeding the first super_admin

`packages/db/prisma/seed-admin.ts` is idempotent. It upserts all permissions +
roles and bootstraps one super_admin. Override the target with env:

```bash
BOOTSTRAP_ADMIN_EMAIL=you@example.com \
BOOTSTRAP_ADMIN_CLERK_ID=user_xxx \
BOOTSTRAP_ADMIN_NAME="Your Name" \
npx tsx packages/db/prisma/seed-admin.ts
```

If a `User` with that email already exists (they've signed in to the consumer
app), the admin row links to it automatically; otherwise it's created standalone
and links on first sign-in by email.

## How the permission system works

Table-driven RBAC lives in `packages/db/schema.prisma`:

```
AdminUser ─< AdminUserRole >─ Role ─< RolePermission >─ Permission
```

- An **AdminUser** is linked to a Clerk identity (`clerkId`) and optionally a
  consumer `User`. Not being an active AdminUser = no console access at all.
- **Roles** (`super_admin`, `moderator`, `support`, `analyst`) are seeded and
  marked `isSystem`. An admin can hold multiple roles.
- **Permissions** are granular slugs (`business.approve`, `review.delete`,
  `user.ban`, …). A role's effective permission set is the union of its roles'
  permissions.

Enforcement is entirely server-side:

- **API** — `PermissionGuard` (class-level on `ConsoleController`) resolves the
  AdminUser from the Clerk token and rejects non-admins (403). Each handler
  declares `@RequirePermission('...')`; the guard checks it. **Read endpoints on
  sensitive data are guarded too.**
- **Admin UI** — permission checks only decide what to *show*. Every mutation
  re-checks the live permission set (`lib/actions.ts → ensure()`) immediately
  before calling the API, so a revoked permission can't be exploited from a
  stale page. The API re-validates independently.

### Audit + reasons

Every mutating console endpoint writes an `AuditLog` row **inside the same
transaction** as the mutation (`apps/api/.../console/audit.util.ts → writeAudit`).
If the audit write fails, the mutation rolls back — they are atomic. Destructive
actions (`reject`, `ban`, `suspend`, `delete`, `merge`) require a reason of ≥10
characters, enforced by `requireReason()` server-side and by the confirm dialog
in the UI.

## How to add a new permission

1. Add a line to `PERMISSIONS` in `packages/db/prisma/seed-admin.ts`
   (`["thing.action", "category", "description"]`) and grant it to the relevant
   roles in `ROLES`.
2. Reseed: `npx tsx packages/db/prisma/seed-admin.ts` (idempotent).
3. Decorate the new/existing API handler with `@RequirePermission('thing.action')`.
4. In the UI, gate the control with `me.permissions.includes('thing.action')`.

No schema migration is needed — permissions are data.

## Phase 1 surfaces (this build)

- **Dashboard** — pending businesses, flagged reviews, banned users, your grants.
- **Business moderation** (`/businesses`) — queue by status, search, approve /
  reject (reason), duplicate detection + merge (API ready).
- **Review moderation** (`/reviews`) — flagged + pending, spam velocity signal,
  approve / reject / delete tied to the reviewer.
- **User management** (`/users`, `/users/[id]`) — search, activity timeline,
  suspend / ban / unban.
- **Audit log** (`/audit`) — every action, actor, reason, before/after, IP.

`⌘K` / `Ctrl+K` opens the command palette to jump between queues.

## Deployment

Separate Vercel project, root directory `apps/admin`, bound to `admin.manzil.uz`
(DNS + custom domain configured in Vercel). Same env vars as above with
production Clerk keys; **never** set `ADMIN_DEV_CLERK_ID` in production.
