# CRM M0 — Customer Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the already-in-progress Customer/CustomerVisit foundation — apply the migration, fix a bug in the backfill script, run it, and expose a read-only customer list through the API and a new dashboard page — so M0 is real and verifiable rather than schema-only.

**Architecture:** Additive-only Prisma migration baselined against the untracked live schema, a corrected backfill script populating `Customer`/`CustomerVisit` from existing `Booking` rows, a new `CustomersRepository` (NestJS) sharing the existing ownership-check logic with `CrmRepository` via an extracted utility, and a new read-only Next.js dashboard route.

**Tech Stack:** NestJS, Prisma 6.19.3 / PostgreSQL, Next.js (App Router, server components), TypeScript throughout. No test framework exists anywhere in `apps/api` today (no `test` script, no `@nestjs/testing`, zero `*.spec.ts` files) — this plan does not introduce one; verification uses booted-server + curl checks and small scratchpad scripts, matching the project's existing convention.

## Global Constraints

- No pagination anywhere in this codebase's list endpoints — cap at `take: 500`, matching `listBusinesses`/`search`.
- No new rate-limit tier for the new GET route — sibling authenticated GETs on `CrmController` rely on the global default throttle (300/min); do not add a bespoke `@Throttle`.
- Authorization for the customer list reuses the existing `claimedByUserId`-based ownership check (extracted from `CrmRepository`), **not** `BusinessStaff` — that model has zero authorization wiring anywhere in the codebase and building it is out of scope for this plan.
- Prisma `Decimal` fields are serialized as strings across the API boundary (`.toString()`), never as raw numbers — matches `AnalyticsRepository`'s `revenue.totalAmount` and `CrmPackage.price` conventions already in the codebase.
- All new user-facing copy must be trilingual (`uz`/`ru`/`en`) in `apps/web/app/lib/crm-copy.ts`, matching the existing `analytics` copy block's structure exactly.
- Tasks 3 and 4 mutate the live (shared, only existing) database. Each has an explicit **STOP — confirm with the user before proceeding** step. Do not skip it, even when running unattended — surface the pending action and wait.
- `git show HEAD:packages/db/schema.prisma` is the pre-Customer schema baseline reference throughout — do not use the working-tree `schema.prisma` for the "from" side of any diff, since it already includes the Customer changes.

---

### Task 1: Fix the backfill script's refunded-payment bug

**Files:**
- Modify: `packages/db/scripts/backfill-customers.ts:38-42`
- Verify: throwaway script at `/tmp/manzil-crm-m0-scratch/verify-spend-fix.mjs` (use your own scratchpad/temp directory if your environment provides one — this file is never part of the repo and is never committed)

**Interfaces:**
- Produces: `spendForBooking(booking: BookingRow): Prisma.Decimal` — unchanged signature, corrected behavior. Task 4 depends on this being correct before the real backfill runs.

- [ ] **Step 1: Write a throwaway script that demonstrates the current bug**

Create `/tmp/manzil-crm-m0-scratch/verify-spend-fix.mjs` (create the directory first if needed: `mkdir -p /tmp/manzil-crm-m0-scratch`) with the **current** (buggy) logic copied inline — do not import from the real script (it self-invokes `main()` on import, which would hit the live database as a side effect):

```js
// /tmp/manzil-crm-m0-scratch/verify-spend-fix.mjs — throwaway, demonstrates the bug then the fix.
function decimal(n) { return { toString: () => String(n), value: n }; } // stand-in for Prisma.Decimal in this throwaway check

function spendForBooking_BUGGY(booking) {
  if (booking.payment?.status === "paid") return booking.payment.amount;
  if (booking.depositAmount) return booking.depositAmount;
  return decimal(0);
}

function spendForBooking_FIXED(booking) {
  if (booking.payment?.status === "paid") return booking.payment.amount;
  if (!booking.payment && booking.depositAmount) return booking.depositAmount;
  return decimal(0);
}

const refundedWithDeposit = {
  payment: { status: "refunded", amount: decimal(50000) },
  depositAmount: decimal(50000)
};

const buggyResult = spendForBooking_BUGGY(refundedWithDeposit).value;
const fixedResult = spendForBooking_FIXED(refundedWithDeposit).value;

console.log("Buggy result for a refunded booking with a deposit:", buggyResult, "(expected bug: 50000, should be 0)");
console.log("Fixed result for a refunded booking with a deposit:", fixedResult, "(expected: 0)");

if (buggyResult !== 50000) throw new Error("Expected to reproduce the bug (buggy path should still return 50000)");
if (fixedResult !== 0) throw new Error("Fix did not work: expected 0, got " + fixedResult);

// No-payment-record case must still fall back to depositAmount (unaffected by the fix).
const noPaymentWithDeposit = { payment: null, depositAmount: decimal(30000) };
const fixedNoPayment = spendForBooking_FIXED(noPaymentWithDeposit).value;
if (fixedNoPayment !== 30000) throw new Error("Regression: no-payment-record case should still use depositAmount, got " + fixedNoPayment);

console.log("All checks passed.");
```

- [ ] **Step 2: Run it to confirm the bug is real and the fix works**

Run: `node /tmp/manzil-crm-m0-scratch/verify-spend-fix.mjs`
Expected output: all three console lines print, ending with `All checks passed.` (no thrown error).

- [ ] **Step 3: Apply the fix to the real script**

In `packages/db/scripts/backfill-customers.ts`, replace:

```ts
function spendForBooking(booking: BookingRow) {
  if (booking.payment?.status === "paid") return booking.payment.amount;
  if (booking.depositAmount) return booking.depositAmount;
  return new Prisma.Decimal(0);
}
```

with:

```ts
function spendForBooking(booking: BookingRow) {
  if (booking.payment?.status === "paid") return booking.payment.amount;
  // Only fall back to the raw deposit when there is no payment record at all —
  // a payment that exists but is failed/refunded must count as zero, not the
  // pre-refund deposit amount.
  if (!booking.payment && booking.depositAmount) return booking.depositAmount;
  return new Prisma.Decimal(0);
}
```

- [ ] **Step 4: Verify the script still parses**

Verified during pre-flight: `packages/db` has **no** `typecheck` script and no tsconfig of its own (its scripts are `migrate:dev`, `migrate:deploy`, `db:push`, `db:seed`, `studio`). Do not invent one.

Instead confirm the edited script still compiles under `tsx`:

```bash
npx tsx --version && node --input-type=module -e "console.log('ok')"
```

Then confirm the file parses by type-stripping it without executing (the script self-invokes `main()` on import, so it must not actually be run here):

```bash
npx tsc --noEmit --skipLibCheck --target es2022 --module node16 --moduleResolution node16 packages/db/scripts/backfill-customers.ts
```

Expected: no output (success). Type errors originating from `@prisma/client` internals can be ignored; errors pointing at `backfill-customers.ts` itself must be fixed.

- [ ] **Step 5: Commit**

```bash
git add packages/db/scripts/backfill-customers.ts
git commit -m "fix: don't count refunded/failed payments as customer spend in backfill"
```

---

### Task 2: Generate the baseline migration

**Files:**
- Create: `packages/db/migrations/20260725235959_baseline/migration.sql` (generated, not hand-written)
- Uses (temp, not committed): `/tmp/manzil-crm-m0-scratch/pre-customer-schema.prisma`

**Interfaces:**
- Produces: a migration directory Task 3 marks as applied via `prisma migrate resolve --applied 20260725235959_baseline`.

- [ ] **Step 1: Extract the pre-Customer schema**

Run from repo root:
```bash
mkdir -p /tmp/manzil-crm-m0-scratch
git show HEAD:packages/db/schema.prisma > /tmp/manzil-crm-m0-scratch/pre-customer-schema.prisma
```
Expected: file created, does **not** contain `model Customer` (verify with a quick grep — it should find nothing).

- [ ] **Step 2: Create the migration directory**

```bash
mkdir -p packages/db/migrations/20260725235959_baseline
```

- [ ] **Step 3: Generate the baseline SQL**

This command is read-only against any database — it only diffs two schema representations and does not connect to a live datasource:

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel=/tmp/manzil-crm-m0-scratch/pre-customer-schema.prisma \
  --script \
  -o packages/db/migrations/20260725235959_baseline/migration.sql
```

- [ ] **Step 4: Verify the generated file**

First establish the expected count from the source of truth (the pre-Customer schema itself, not a hardcoded number):

```bash
grep -c "^model " /tmp/manzil-crm-m0-scratch/pre-customer-schema.prisma
grep -c "CREATE TABLE" packages/db/migrations/20260725235959_baseline/migration.sql
```

Expected: the two counts are equal — one `CREATE TABLE` per model in the pre-Customer schema.

Also confirm it does **not** contain `"Customer"` or `"CustomerVisit"`:
Run: `grep -c "Customer" packages/db/migrations/20260725235959_baseline/migration.sql`
Expected: `0`

- [ ] **Step 5: Commit**

```bash
git add packages/db/migrations/20260725235959_baseline/
git commit -m "chore: generate baseline migration for pre-existing schema"
```

---

### Task 3: Apply the baseline + M0 migration to the database

**Files:** none created or modified — this is a database-state operation.

**Interfaces:**
- Consumes: `packages/db/migrations/20260725235959_baseline/` (Task 2), `packages/db/migrations/20260726000000_add_customer_crm_m0/` (pre-existing).
- Produces: a live `Customer`, `CustomerVisit` table and `Booking.customerId` column that Task 4 and Task 5 depend on.

- [ ] **Step 1: STOP — confirm with the user before proceeding**

This step creates a `_prisma_migrations` tracking table and adds new tables/a new column to the live database (the only database this project currently has — no staging exists). Every change is additive (nothing existing is altered or dropped), but it is a real, irreversible-without-effort change to shared state. **Do not proceed past this step without the user's explicit go-ahead in this session.**

- [ ] **Step 2: Baseline the existing schema as applied**

```bash
npx prisma migrate resolve --applied 20260725235959_baseline --schema packages/db/schema.prisma
```
Expected output: confirmation that the migration was recorded as applied, no SQL executed against the database (Prisma prints this explicitly).

- [ ] **Step 3: Deploy the real M0 migration**

```bash
npx prisma migrate deploy --schema packages/db/schema.prisma
```
Expected output: `1 migration found... Applying migration 20260726000000_add_customer_crm_m0... The following migration(s) have been applied: ...`

- [ ] **Step 4: Verify migration history**

Run this from repo root:
```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  const rows = await p.\$queryRaw\`SELECT migration_name, finished_at IS NOT NULL as finished FROM _prisma_migrations ORDER BY started_at\`;
  console.log(JSON.stringify(rows, null, 2));
  await p.\$disconnect();
})()"
```
Expected: exactly 2 rows — `20260725235959_baseline` and `20260726000000_add_customer_crm_m0`, both with `finished: true`.

- [ ] **Step 5: Verify the new tables/column exist and are empty**

```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  console.log('Customer count:', await p.customer.count());
  console.log('CustomerVisit count:', await p.customerVisit.count());
  const nullCustomerBookings = await p.booking.count({ where: { customerId: null } });
  console.log('Bookings with customerId still null:', nullCustomerBookings);
  await p.\$disconnect();
})()"
```
Expected: `Customer count: 0`, `CustomerVisit count: 0`, and the null-count equal to the total booking count (no backfill has run yet).

- [ ] **Step 6: Confirm CI's migration check still passes**

Run: `npx prisma validate --schema packages/db/schema.prisma`
Expected: `The schema at packages\db\schema.prisma is valid`

No commit for this task — it is a database operation, not a file change.

---

### Task 4: Run the customer backfill against real data

**Files:** none created or modified — this is a data-population operation using the script fixed in Task 1.

**Interfaces:**
- Consumes: `spendForBooking` (Task 1, corrected), live `Customer`/`CustomerVisit`/`Booking.customerId` (Task 3).
- Produces: populated `Customer`/`CustomerVisit` rows and `Booking.customerId` links that Task 5's endpoint reads.

- [ ] **Step 1: Dry run**

```bash
npx tsx packages/db/scripts/backfill-customers.ts
```
Expected: prints a summary (`bookingsScanned`, `customersToUpsert`, `apply: false`) and `Dry run only. Re-run with --apply to create Customer rows and link Booking.customerId.` If it instead prints an ambiguous-rows table and exits with code 1, **stop** — do not proceed to Step 2 until those specific `customerPhone` values are corrected at the source (in the `Booking` table) or explicitly accepted as out of scope by the user. Do not silently skip or drop them.

- [ ] **Step 2: STOP — confirm with the user before proceeding**

The dry run above is read-only. Applying it writes real `Customer`/`CustomerVisit` rows and sets `Booking.customerId` on existing production booking rows. **Do not run with `--apply` without the user's explicit go-ahead in this session**, even though the change is additive and reversible (rows can be deleted, `customerId` can be reset to null).

- [ ] **Step 3: Apply**

```bash
npx tsx packages/db/scripts/backfill-customers.ts --apply
```
Expected: `Customer backfill complete.`

- [ ] **Step 4: Verify against the dry run's own numbers**

```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  console.log('Customer count:', await p.customer.count());
  console.log('CustomerVisit count:', await p.customerVisit.count());
  console.log('Bookings still missing customerId:', await p.booking.count({ where: { customerId: null } }));
  const sample = await p.customer.findFirst({ include: { bookings: true, visits: true } });
  console.log('Sample customer:', JSON.stringify(sample, null, 2));
  await p.\$disconnect();
})()"
```
Expected: `Customer count` matches the dry run's reported `customersToUpsert`; `Bookings still missing customerId` is `0` (every booking was either linked or was already unambiguous); the sample customer's `totalSpend` reflects only `paid` payments or bare deposits (never a refunded/failed payment amount, per Task 1's fix) — spot-check this manually against the sample's `bookings` array if it has more than one booking.

No commit for this task — it is a data operation, not a file change.

---

### Task 5: Customer list API endpoint

**Files:**
- Create: `apps/api/src/modules/crm/business-ownership.util.ts`
- Create: `apps/api/src/modules/crm/customers.repository.ts`
- Modify: `apps/api/src/modules/crm/crm.repository.ts` (delegate the private ownership check to the shared util)
- Modify: `apps/api/src/modules/controllers/crm.controller.ts` (new route)
- Modify: `apps/api/src/modules/app.module.ts` (register `CustomersRepository`)

**Interfaces:**
- Consumes: `AuthActor` type from `apps/api/src/modules/repositories/database.repository.ts` (existing); `PrismaService` (existing).
- Produces: `requireOwnedBusiness(prisma: PrismaService, slug: string, actor: AuthActor)` — resolves and returns the business row (`{ id, slug, claimedByUserId, createdByUserId, status }`), throwing `NotFoundException`/`ForbiddenException`. Produces `CustomersRepository.listCustomers(slug: string, actor: AuthActor): Promise<CustomerSummary[]>` where `CustomerSummary = { id: string; phone: string; name: string | null; lastVisitAt: string | null; visitCount: number; totalSpend: string; tags: string[]; consentMarketing: boolean }`. Produces `GET /v1/crm/businesses/:slug/customers` returning `{ data: { customers: CustomerSummary[] } }`.

- [ ] **Step 1: Extract the shared ownership-check utility**

Create `apps/api/src/modules/crm/business-ownership.util.ts`:

```ts
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { AuthActor } from "../repositories/database.repository";

/**
 * Resolves a business by slug and asserts the acting user may manage it —
 * the claimed owner, or (while still pending claim) whoever registered it, or
 * an admin. Shared by CrmRepository and CustomersRepository so the ownership
 * rule is defined once, not duplicated.
 */
export async function requireOwnedBusiness(prisma: PrismaService, slug: string, actor: AuthActor) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, slug: true, claimedByUserId: true, createdByUserId: true, status: true }
  });

  if (!business) {
    throw new NotFoundException("Business not found");
  }

  const isOwner =
    business.claimedByUserId === actor.userId ||
    (business.status === "pending_claim" && business.createdByUserId === actor.userId);

  if (actor.role !== "admin" && !isOwner) {
    throw new ForbiddenException("Only the business owner or an admin can manage this business");
  }

  return business;
}
```

- [ ] **Step 2: Point `CrmRepository` at the shared utility**

In `apps/api/src/modules/crm/crm.repository.ts`, add the import (aliased to avoid shadowing the class's own method name):

```ts
import { requireOwnedBusiness as resolveOwnedBusiness } from "./business-ownership.util";
```

Replace the existing private method body:

```ts
  private async requireOwnedBusiness(slug: string, actor: AuthActor) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: { id: true, slug: true, claimedByUserId: true, createdByUserId: true, status: true }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const isOwner =
      business.claimedByUserId === actor.userId ||
      (business.status === "pending_claim" && business.createdByUserId === actor.userId);

    if (actor.role !== "admin" && !isOwner) {
      throw new ForbiddenException("Only the business owner or an admin can manage this business");
    }

    return business;
  }
```

with:

```ts
  private async requireOwnedBusiness(slug: string, actor: AuthActor) {
    return resolveOwnedBusiness(this.prisma, slug, actor);
  }
```

Leave every one of the 9 existing call sites (`this.requireOwnedBusiness(...)`) untouched — this keeps the diff minimal and low-risk.

- [ ] **Step 3: Create `CustomersRepository`**

Create `apps/api/src/modules/crm/customers.repository.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { AuthActor } from "../repositories/database.repository";
import { requireOwnedBusiness } from "./business-ownership.util";

export type CustomerSummary = {
  id: string;
  phone: string;
  name: string | null;
  lastVisitAt: string | null;
  visitCount: number;
  totalSpend: string;
  tags: string[];
  consentMarketing: boolean;
};

/**
 * Read-only customer directory (M0). Creation/editing is a later milestone —
 * Customer rows are populated by the booking-completion backfill/hook, never
 * written directly through this API.
 */
@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(slug: string, actor: AuthActor): Promise<CustomerSummary[]> {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    const customers = await this.prisma.customer.findMany({
      where: { businessId: business.id },
      // Most recently active first; a Customer row without a recorded visit
      // (should not normally happen post-backfill) sorts last, not first.
      orderBy: [{ lastVisitAt: { sort: "desc", nulls: "last" } }, { firstSeenAt: "desc" }],
      take: 500
    });

    return customers.map((customer) => ({
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      lastVisitAt: customer.lastVisitAt ? customer.lastVisitAt.toISOString() : null,
      visitCount: customer.visitCount,
      totalSpend: customer.totalSpend.toString(),
      tags: customer.tags,
      consentMarketing: customer.consentMarketing
    }));
  }
}
```

- [ ] **Step 4: Wire the new route into `CrmController`**

In `apps/api/src/modules/controllers/crm.controller.ts`, add the import:

```ts
import { CustomersRepository, type CustomerSummary } from "../crm/customers.repository";
```

Update the constructor:

```ts
  constructor(
    private readonly crm: CrmRepository,
    private readonly customers: CustomersRepository
  ) {}
```

Add the new route (place it near the other `businesses/:slug/...` GET routes, e.g. after `listPackages`):

```ts
  /* ---------- Customers (M0: read-only) ---------- */

  @Get("businesses/:slug/customers")
  async listCustomers(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    return { data: { customers: await this.customers.listCustomers(slug, request.manzilActor!) } };
  }
```

- [ ] **Step 5: Register the provider**

In `apps/api/src/modules/app.module.ts`, add the import:

```ts
import { CustomersRepository } from "./crm/customers.repository";
```

Add `CustomersRepository` to the `providers` array (alongside `CrmRepository`).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck --workspace @manzil/api`
Expected: no errors.

- [ ] **Step 7: Build and boot**

```bash
npm run build --workspace @manzil/api
```
Then (from repo root, background):
```bash
MANZIL_DEV_AUTH=true NODE_ENV=development WEB_ORIGIN=http://localhost:3000 PORT=4130 node apps/api/dist/main.js
```
Wait for `Manzil API listening on port 4130` in the log before proceeding.

- [ ] **Step 8: Verify as the owning business's dev-header actor**

First find a business slug with backfilled customers and its owner's dev header values:
```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  const business = await p.business.findFirst({ where: { customers: { some: {} } }, select: { slug: true, claimedByUserId: true } });
  console.log(JSON.stringify(business));
  await p.\$disconnect();
})()"
```
If `claimedByUserId` is null (business still pending claim, no owner yet), use `createdByUserId` instead and pass role `business_owner` with that user id in dev headers — check which field is populated from the query output first.

Then, using that slug and user id:
```bash
curl -s http://localhost:4130/v1/crm/businesses/<slug>/customers \
  -H "x-manzil-role: business_owner" \
  -H "x-manzil-user-id: <claimedByUserId-or-createdByUserId>"
```
Expected: `200` with `{"data":{"customers":[...]}}`, each entry matching the `CustomerSummary` shape, `totalSpend` as a string.

- [ ] **Step 9: Verify authorization is enforced**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4130/v1/crm/businesses/<slug>/customers \
  -H "x-manzil-role: business_owner" \
  -H "x-manzil-user-id: some-other-random-user-id"
```
Expected: `403`

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4130/v1/crm/businesses/not-a-real-slug/customers \
  -H "x-manzil-role: business_owner" \
  -H "x-manzil-user-id: <claimedByUserId-or-createdByUserId>"
```
Expected: `404`

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4130/v1/crm/businesses/<slug>/customers
```
Expected: `401` (no auth at all)

- [ ] **Step 10: Stop the test server**

Find and kill the process listening on port 4130 (e.g. via `netstat -ano | grep :4130` then `taskkill //F //PID <pid>` on Windows).

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/modules/crm/business-ownership.util.ts apps/api/src/modules/crm/customers.repository.ts apps/api/src/modules/crm/crm.repository.ts apps/api/src/modules/controllers/crm.controller.ts apps/api/src/modules/app.module.ts
git commit -m "feat(api): add read-only customer list endpoint"
```

---

### Task 6: Dashboard customer list page

**Files:**
- Modify: `apps/web/app/lib/crm-api.ts` (add `CustomerSummary` type + `getCustomers`)
- Modify: `apps/web/app/lib/crm-copy.ts` (add trilingual `customers` copy block)
- Create: `apps/web/app/[locale]/dashboard/customers/page.tsx`
- Modify: `apps/web/app/[locale]/dashboard/layout.tsx` (add menu entry)

**Interfaces:**
- Consumes: `GET /crm/businesses/:slug/customers` (Task 5), `crmGet` helper (existing, in `crm-api.ts`), `getMyBusinesses`/`getCrmCopy` (existing).
- Produces: a working `/[locale]/dashboard/customers` route reachable from the sidebar.

- [ ] **Step 1: Add the frontend type + fetcher**

In `apps/web/app/lib/crm-api.ts`, add after the existing `getSubscription` function:

```ts
export type CustomerSummary = {
  id: string;
  phone: string;
  name: string | null;
  lastVisitAt: string | null;
  visitCount: number;
  totalSpend: string;
  tags: string[];
  consentMarketing: boolean;
};

export function getCustomers(slug: string) {
  return crmGet<{ customers: CustomerSummary[] }>(`/crm/businesses/${slug}/customers`);
}
```

- [ ] **Step 2: Add trilingual copy**

In `apps/web/app/lib/crm-copy.ts`, add a `customers` block to each locale, immediately before that locale's `common:` block (same insertion point used for the `analytics` block earlier), and add `customers` to each locale's `menu` block right after `analytics`:

For `uz`, in `menu`:
```ts
      analytics: "Tahlil",
      customers: "Mijozlar",
      settings: "Sozlamalar",
```

Add before `uz`'s `common:` block:
```ts
    customers: {
      title: "Mijozlar",
      subtitle: "Bandlovlardan avtomatik yig'ilgan mijozlar ro'yxati.",
      empty: "Hozircha mijozlar yo'q. Birinchi bandlov qabul qilinganda bu yerda paydo bo'ladi.",
      colName: "Ism / Telefon",
      colLastVisit: "Oxirgi tashrif",
      colVisits: "Tashriflar",
      colSpend: "Jami xarajat",
      colTags: "Teglar",
      colConsent: "Marketingga rozilik",
      consentYes: "Ha",
      consentNo: "Yo'q",
      never: "Hech qachon"
    },
```

For `ru`, in `menu`:
```ts
      analytics: "Аналитика",
      customers: "Клиенты",
      settings: "Настройки",
```

Add before `ru`'s `common:` block:
```ts
    customers: {
      title: "Клиенты",
      subtitle: "Список клиентов, автоматически собранный из броней.",
      empty: "Пока нет клиентов. Появятся здесь после первой принятой брони.",
      colName: "Имя / Телефон",
      colLastVisit: "Последний визит",
      colVisits: "Визиты",
      colSpend: "Всего потрачено",
      colTags: "Теги",
      colConsent: "Согласие на маркетинг",
      consentYes: "Да",
      consentNo: "Нет",
      never: "Никогда"
    },
```

For `en`, in `menu`:
```ts
      analytics: "Analytics",
      customers: "Customers",
      settings: "Settings",
```

Add before `en`'s `common:` block:
```ts
    customers: {
      title: "Customers",
      subtitle: "Customer list, built automatically from bookings.",
      empty: "No customers yet. This fills in once your first booking is accepted.",
      colName: "Name / Phone",
      colLastVisit: "Last visit",
      colVisits: "Visits",
      colSpend: "Total spend",
      colTags: "Tags",
      colConsent: "Marketing consent",
      consentYes: "Yes",
      consentNo: "No",
      never: "Never"
    },
```

- [ ] **Step 3: Create the page**

Create `apps/web/app/[locale]/dashboard/customers/page.tsx`:

```tsx
import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { getMyBusinesses } from "../../../lib/api";
import { getCustomers } from "../../../lib/crm-api";
import { getCrmCopy } from "../../../lib/crm-copy";

export const dynamic = "force-dynamic";

function formatMoney(amount: string, locale: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value) || value === 0) return "—";
  return `${new Intl.NumberFormat(locale).format(Math.round(value))} UZS`;
}

export default async function CustomersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getCrmCopy(locale as Locale);
  const text = copy.customers;

  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) {
    notFound();
  }

  const result = await getCustomers(business.slug);
  const customers = result?.customers ?? [];

  return (
    <section>
      <header className="crm-page-head">
        <h1>{text.title}</h1>
      </header>
      <p className="crm-pending-note">{text.subtitle}</p>

      {customers.length === 0 ? (
        <p className="crm-pending-note">{text.empty}</p>
      ) : (
        <table className="crm-table">
          <thead>
            <tr>
              <th>{text.colName}</th>
              <th>{text.colLastVisit}</th>
              <th>{text.colVisits}</th>
              <th>{text.colSpend}</th>
              <th>{text.colTags}</th>
              <th>{text.colConsent}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  {customer.name ?? "—"}
                  <br />
                  <span className="crm-muted">{customer.phone}</span>
                </td>
                <td>
                  {customer.lastVisitAt
                    ? new Date(customer.lastVisitAt).toLocaleDateString(locale)
                    : text.never}
                </td>
                <td>{customer.visitCount}</td>
                <td>{formatMoney(customer.totalSpend, locale)}</td>
                <td>{customer.tags.length > 0 ? customer.tags.join(", ") : "—"}</td>
                <td>{customer.consentMarketing ? text.consentYes : text.consentNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
```

**Do not add any CSS for this task.** Verified during pre-flight: `.crm-table` already exists in `apps/web/app/globals.css:5684` (fully styled, including a mobile `overflow-x: auto` rule at line 6043), and `.crm-cell-sub` (line 5721) is the established class for a secondary line beneath a cell's primary text — use it for the phone under the name. `.crm-page-head` and `.crm-pending-note` also already exist and are used by `overview/page.tsx` and `dashboard/layout.tsx`. Adding new rules would duplicate existing ones.

Use `<p className="crm-cell-sub">{customer.phone}</p>` for the phone line rather than the `<br />` + `crm-muted` shown above — `crm-muted` is **not** a defined class in this codebase; `crm-cell-sub` is.

- [ ] **Step 4: Add the sidebar menu entry**

In `apps/web/app/[locale]/dashboard/layout.tsx`, add the new item to the `items` array right after the `analytics` entry added in the prior session:

```ts
    { key: "customers", label: copy.menu.customers, href: `${base}/customers` },
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck --workspace @manzil/web`
Expected: no errors.

- [ ] **Step 6: Build**

Run: `npm run build --workspace @manzil/web`
Expected: build succeeds, no errors. (This also validates the CSS/JSX compiles even though a full browser render isn't performed here.)

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/lib/crm-api.ts apps/web/app/lib/crm-copy.ts "apps/web/app/[locale]/dashboard/customers/page.tsx" "apps/web/app/[locale]/dashboard/layout.tsx" apps/web/app/globals.css
git commit -m "feat(web): add read-only customer list page to owner dashboard"
```

---

### Task 7: Document the CustomerVisit vs BusinessVisit decision

**Files:**
- Modify: `tech-office/docs/ARCHITECTURE.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Add rows to the entity table and a rationale note**

In `tech-office/docs/ARCHITECTURE.md`, section `## 4. Database Schema (Core MVP Entities)`, add two rows to the existing table (after the `claims` row) and a short rationale paragraph before the closing `---`:

Replace:
```markdown
| `claims` | Audit trail for business claim/verification flow |
| `reports` | Abuse reporting queue |
| `follows` | Social graph (Phase 2) |
| `lists` | Community-curated lists (Phase 2) |
| `subscriptions` | Tier assignment (Phase 2) |

Full schema: see [packages/db/schema.prisma](../packages/db/schema.prisma)

---
```

with:
```markdown
| `claims` | Audit trail for business claim/verification flow |
| `reports` | Abuse reporting queue |
| `follows` | Social graph (Phase 2) |
| `lists` | Community-curated lists (Phase 2) |
| `subscriptions` | Tier assignment (Phase 2) |
| `customers` | Per-business CRM directory — one row per (business, phone), auto-populated from bookings |
| `customer_visits` | Identified visit/transaction history for a `Customer`, linked to its source `Booking` |

Full schema: see [packages/db/schema.prisma](../packages/db/schema.prisma)

**`CustomerVisit` vs `BusinessVisit`:** these are deliberately separate models, not one folded into the other. `BusinessVisit` records *anonymous* traffic — a hashed IP+user-agent visitor key with no identity, used for public profile-view analytics. `CustomerVisit` records *identified* visits/transactions tied to a real `Customer` row, sourced from booking completions. Merging them would force an anonymous hash and a real identity into the same column on the same table — a modeling and privacy mismatch, not a simplification. `Customer` itself is scoped per-business (`@@unique([businessId, phone])`), not global, because a person is a customer of a specific business independently at each business they visit on the platform.

---
```

- [ ] **Step 2: Commit**

```bash
git add tech-office/docs/ARCHITECTURE.md
git commit -m "docs: document CustomerVisit vs BusinessVisit modeling decision"
```

---

### Task 8: Final end-to-end verification and progress update

**Files:**
- Modify: `tech-office/docs/IMPLEMENTATION_STATUS.md`

**Interfaces:** none — this task re-runs the full verification plan from the spec together and records completion.

- [ ] **Step 1: Full workspace typecheck**

Run: `npm run typecheck --workspaces --if-present`
Expected: all workspaces pass, no errors.

- [ ] **Step 2: Prisma validate**

Run: `npx prisma validate --schema packages/db/schema.prisma`
Expected: valid.

- [ ] **Step 3: Full build**

Run: `npm run build --workspaces --if-present`
Expected: all workspaces build successfully.

- [ ] **Step 4: Re-verify the live endpoint end-to-end**

Boot the API again (same command as Task 5 Step 7, any free port), re-run the Task 5 Step 8/9 curl checks (success case, 403, 404, 401), confirm identical results, then stop the server.

- [ ] **Step 5: Confirm final data state**

```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  console.log('Customers:', await p.customer.count());
  console.log('CustomerVisits:', await p.customerVisit.count());
  console.log('Bookings still unlinked:', await p.booking.count({ where: { customerId: null } }));
  await p.\$disconnect();
})()"
```
Expected: matches the numbers confirmed at the end of Task 4 (no drift).

- [ ] **Step 6: Update the progress doc**

Append a new dated section to `tech-office/docs/IMPLEMENTATION_STATUS.md` (matching the existing "Phase 2" section's style from the prior session) summarizing: migration baselined and applied, backfill bug fixed and run (with the actual customer/visit counts from Step 5), read-only customer list shipped in API + dashboard, `BusinessStaff` authorization explicitly deferred, M1 (directory editing, notes, tags) through M5 (legal-gated campaigns) not started.

- [ ] **Step 7: Commit**

```bash
git add tech-office/docs/IMPLEMENTATION_STATUS.md
git commit -m "docs: record CRM M0 completion in implementation status"
```
