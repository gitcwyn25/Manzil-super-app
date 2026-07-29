# Admin console inside apps/web — design

**Date:** 2026-07-29 · **Branch:** `feat/frontend-elevation`

## What already exists

An audit before designing found the backend essentially complete and the
front door missing.

| Layer | State |
|---|---|
| Console API | **Built.** 34 endpoints in `apps/api/src/modules/console/console.controller.ts` |
| RBAC | **Built.** `AdminUser`, `Role`, `Permission`, `RolePermission`, `AdminUserRole`, plus `PermissionGuard` and `@RequirePermission` |
| Audit trail | **Built.** `AuditLog` model + `audit.util.ts`, `GET /console/audit` |
| Alerts | Partial. `alerts/alert.service.ts` dispatches (a business awaiting approval fires one), but there is **no persisted notification** and nothing to read them back |
| Admin UI in `apps/web` | **`(workspace)/admin/page.tsx` is a 0-byte empty file.** The footer links to a blank page |
| `apps/admin` | A **separate Next.js app** with its own Tailwind and pages for businesses, reviews, users, legal, plans, categories, analytics, audit |

Existing permissions, which the UI must respect rather than invent:
`analytics.view`, `business.view/edit/approve/reject/merge`,
`review.view/approve/reject/delete`, `media.approve`, `legal.view/publish`,
`category.manage`, `plan.manage`.

## The architectural decision

**Build the console inside `apps/web` under `(workspace)/admin/*`, and retire
`apps/admin`.**

Two admin surfaces against one API is the same "two half-existing systems"
problem this branch already resolved for Tailwind. `apps/admin` also carries a
second Tailwind install, a second Clerk config, and a second deployment — for
screens that belong beside the business dashboard the operator already uses.
The workspace shell, its density layer, and its auth are all in `apps/web`
already.

`apps/admin` is **not deleted in this pass** — it stays until the new console
reaches parity, then goes in a follow-up. Deleting a working tool before its
replacement is proven is how you end up with neither.

## Information architecture

```
/[locale]/admin                     overview + notification inbox
/[locale]/admin/companies           the list — search, status filter, bulk approve
/[locale]/admin/companies/[id]      one company, tabbed
        ├── Overview      status, owner, plan, claim, quick actions
        ├── Consumers     customers + reviewers for this business
        ├── Reviews       moderate: approve / reject / delete
        ├── Photos        moderate pending media
        ├── Contracts     view signed contract, publish/regenerate
        └── Audit         everything anyone did to this company
/[locale]/admin/notifications       full inbox
```

Companies is the landing surface, not a dashboard of charts: an operator opens
this tool to act on a queue, and the queue is businesses awaiting approval.

## Decisions taken (delegated to me)

| Question | Decision | Why |
|---|---|---|
| Where | Inside `apps/web`, retire `apps/admin` later | One surface, one auth, one deploy |
| Notifications | **New `AdminNotification` model**, persisted, with read state | `AlertService` fires and forgets; an operator needs a queue that survives a page load |
| What generates one | Business awaiting approval, review reported, photo pending moderation, contract awaiting publish | These are the four events that need a human |
| Per-company features | Overview, Consumers, Reviews, Photos, Contracts, Audit | Everything the API can already do, grouped by what an operator is trying to accomplish |
| Access | Reuse `PermissionGuard`; a tab the operator lacks permission for is **not rendered**, not rendered-and-disabled | A disabled tab advertises a capability and teaches nothing |
| Styling | The existing workspace density layer (`.ws-table`, `.ws-num`, `--ws-row`) | It is built and this is the same kind of surface |

## Data changes

One additive model:

```prisma
enum AdminNotificationKind {
  business_awaiting_approval
  review_reported
  photo_pending
  contract_pending
}

model AdminNotification {
  id         String                @id @default(cuid())
  kind       AdminNotificationKind
  title      String
  body       String?
  /// Subject of the notification, so the inbox can deep-link into the company.
  businessId String?
  /// Set when acted on. Null means it still needs a human.
  readAt     DateTime?
  readBy     String?
  createdAt  DateTime              @default(now())

  business Business? @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([readAt, createdAt])
  @@index([businessId])
}
```

`AlertService.dispatch` gains a persistence step so existing call sites start
producing inbox rows without changing their signatures.

## API additions

All under the existing `/console` controller, flat-registered, `{ data }` envelope:

- `GET /console/notifications?unread=true` — `notification.view`
- `POST /console/notifications/:id/read` — `notification.view`
- `POST /console/notifications/read-all` — `notification.view`
- `GET /console/businesses/:id/consumers` — `business.view`. Customers plus
  review authors for one business.

Everything else the UI needs already exists.

## Testing

Jest on the API: an unread notification appears in the inbox; marking read is
idempotent; a missing permission returns 403 rather than an empty list, because
an empty list reads as "nothing to do" and hides a misconfiguration.

Playwright specs ship written but unexecuted — this environment has no dev
server or Clerk credentials, consistent with the rest of the branch.

## Out of scope

- Deleting `apps/admin` — separate pass, after parity
- Realtime push. The inbox polls on navigation; websockets for a
  single-operator tool is scope nobody asked for
- Bulk actions beyond approve/reject on the company list
