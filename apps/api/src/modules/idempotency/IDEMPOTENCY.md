# Idempotency & mutation integrity (Epic 18)

> Server half of the mutation system Epic 17 shipped on the client. The client
> stops the second click; this makes the second **request** harmless regardless
> of where it came from — double-click, slow network, browser retry, mobile
> reconnect, or an impatient client library.

## The contract

**Header: `Idempotency-Key`.** Not chosen here — the web client shipped it
first (`apps/web/app/lib/pxs/idempotency.ts`, commit 6f01a6e) and
`docs/design/PRODUCT-EXPERIENCE-SYSTEM.md` § "Server-side contract required"
specifies it. Value is a UUID v4 minted in the browser when a create form
mounts, kept across retries of the same attempt, rotated only after a confirmed
success. Sent on POST only.

| Request | Response |
|---|---|
| No key, or not a POST | Handler runs. Nothing recorded. Byte-identical to pre-Epic-18 behaviour. |
| Key, first use | Handler runs; its status and body are recorded for 24h. `Idempotency-Replayed: original`. |
| Key, completed, same request | The recorded status and body, verbatim. `Idempotency-Replayed: replay`. |
| Key, in flight, same request | Waits up to 5s for the original, then replays it. **409** if it is still running. |
| Key, **different** request | **409**, code `IDEMPOTENCY_KEY_REUSED`. Never a silent replay. |
| Key shorter than 8 chars or non-printable | **400**, code `IDEMPOTENCY_KEY_INVALID`. |

### Why a different body is 409 and not a replay

Silently returning the original response to a *changed* payload would tell a
user their correction saved when it was discarded. That is worse than the
duplicate this epic exists to prevent, because a duplicate is at least visible
in the catalogue. One key means one intent; a new intent needs a new key.

### A known doc divergence, stated rather than hidden

`PRODUCT-EXPERIENCE-SYSTEM.md` writes the different-payload case as **422**;
the Epic 18 brief writes it as **409**. 409 is implemented — it is what the
binding brief says, what the Stripe convention this header comes from uses, and
either way the client treats neither as retryable. Branch on the
machine-readable `code`, not the status. If the PXS doc is ever reconciled, it
should move to 409, not the code to 422.

### What is *not* replayed

Only a 2xx is recorded. A 4xx should be re-run once the client fixes the
payload; a 5xx should be retryable rather than frozen for 24h. Both release the
claim, leaving the key exactly as available as it was before. The gated
migration enforces this with a CHECK constraint, so it is a property of the
data and not only of the code that writes it.

## Concurrency: the database arbitrates

The obvious implementation is wrong. "Look the key up; if absent, create" has a
window between the read and the write, and that window is precisely the
condition idempotency exists for — two requests from one double-click arrive
milliseconds apart, both look, both find nothing, both create.

So the primitive is `claim()`: **insert-if-absent**, with the loser decided by
something that can arbitrate.

| Backend | Arbiter | `shared` | `durable` |
|---|---|---|---|
| `InProcessIdempotencyStore` | A `Map` read and write with **no `await` between them** — Node cannot interleave a synchronous pair | ✗ | ✗ |
| `RedisIdempotencyStore` | `SET … PX … NX` | ✓ | ✗ (TTL'd, evictable) |
| `PrismaIdempotencyStore` | `UNIQUE (scope, key)` rejecting the second `INSERT` | ✓ | ✓ |

`idempotency.interceptor.spec.ts` proves the property directly: two overlapping
requests, **one resource created, two identical responses returned** — and
again with a five-way pile-up.

### Store selection

```
API_IDEMPOTENCY_STORE=prisma  AND  the generated client has `idempotencyRecord`
  → PrismaIdempotencyStore          (post-M1; both signals required)
REDIS_URL set
  → RedisIdempotencyStore           (shared across replicas today)
otherwise
  → InProcessIdempotencyStore       (correct, bounded, per-replica)
```

Two signals for Postgres, for the same reason every gated store in this
codebase needs two: `prisma generate` mints the delegate on every image build
the moment the model appears in `schema.prisma`, while the migration is still
gated and the table still absent. Selecting on the delegate alone would switch
the store on at build time and fail at query time, on the write path.

A Redis outage **degrades, it does not fail**. Refusing a business registration
because a cache is down would trade one defect for a worse one, so every Redis
operation falls through to a per-process store and logs that protection has
narrowed to this replica.

## What is stored

`scope`, `key`, `route`, `fingerprint`, `state`, `responseStatus`,
`responseBody`, `createdAt`, `completedAt`, `expiresAt`. TTL 24h.

**The fingerprint is a SHA-256 of method + URL + canonicalized body — never the
body itself.** Otherwise this table would be a 24h copy of every registration
payload, contact address and campaign draft that passed through. A hash answers
the only question asked of it. Canonicalization sorts object keys, so a
reordered JSON body is recognised as the same request rather than 409'd.

## Scoping

Keys are scoped per principal so one caller's key can never collide with, or
read the recorded response of, another's.

- **Authenticated:** `user:<verified id>`, or `admin:<resolved admin id>` for a
  console credential session. Interceptors run after guards, so this identity
  comes from the same guard that authorized the request — never from the URL,
  params or body (Definition of Done #11). `POST /crm/register`, the endpoint
  that produced the duplicate, is in this category.
- **Anonymous:** `anon:<sha256(client address + user agent)>`.

### The anonymous tradeoff, honestly

Public creates exist (`POST /waitlist`) and they are exactly the endpoints a
double-click hits hardest, so leaving them unprotected was not an option. With
no identity to scope by, address + user agent is what remains.

- **It deduplicates.** Two submissions of one form from one browser share a
  scope, so the second is recognised. That is the goal, and it is met.
- **It is coarse.** Everyone behind one NAT running the same browser build
  shares a scope. They collide only if they present the *same* key, and keys
  are UUID v4 — an accidental collision will not happen. A deliberate one
  requires obtaining another user's key *and* sharing their egress address and
  user agent, for the payoff of one waitlist confirmation.
- **It is not a security boundary.** Authorization is still the guards' job; a
  scope only decides whose recorded response a replay may see. The standing
  constraint on any *public* create is therefore that its response must contain
  nothing the caller did not already supply — true of the waitlist's
  `{ ok, position }` today.
- **It degrades with the address.** A mobile client that changes network
  between the original and the retry lands in a different scope and executes
  again. That is the pre-existing behaviour, not a regression — but it is why an
  anonymous endpoint must not lean on this alone for correctness.

## Opting out

`@NoIdempotency()` on a handler. Two categories qualify, and only two:

- `POST /billing/webhook` — Stripe has its own redelivery contract keyed on the
  event id, and the signature covers the exact bytes. A second scheme layered
  on top could only ever disagree with the first.
- `POST /console/auth/login` — the response carries a session credential.
  Recording it for 24h would hand its lifetime to something other than the
  session logic that issued it.

"This endpoint is not a create" is **not** a reason to opt out. A non-create
POST that receives a key records and replays its own response, which is right.

---

## The audit: how the catalogue got the same business twice

`docs/evidence/TRUST-AUDIT.md` §6 records a duplicate listing — "Ravotsoy"
appearing twice, with conflicting 5.0 and 4.0 ratings — found by an external
reviewer and left for the API workstream. The data fix is an operator action
and is out of scope; the cause is not.

**The write path already carries a confession.**
`apps/api/src/modules/crm/crm.repository.ts:112-122`:

> `uniqueSlug()` always succeeds by suffixing, so a double submit used to
> create "caravan-coffee" AND "caravan-coffee-2" — two real businesses, two
> claims, two contracts. Registration is slow enough (a geocoding round trip
> plus a multi-statement transaction) that double submits are the normal case,
> not the edge case.

So the mechanism is documented in the codebase, by whoever hit it before. Three
facts make the double-click hypothesis the strongest available explanation for
the "Ravotsoy" pair:

1. **`Business.slug` is `@unique`, and `uniqueSlug()` never fails — it
   suffixes.** A second submission of the same name therefore cannot be
   rejected; it produces a *second row* with a `-2` slug. **Evidence to check
   in production: if the two "Ravotsoy" rows have slugs `ravotsoy` and
   `ravotsoy-2`, both were created through `registerBusiness` from the same
   name, which is the double-submit signature.** Two independently authored
   listings would far more often differ in spelling or punctuation, and would
   not produce the suffix pattern.
2. **Nothing else in the schema forbids it.** `Business` has no unique
   constraint on name, on (name, district), or on (name, createdByUserId).
   `slug` is the only uniqueness, and it is the one field the code guarantees
   it can always satisfy.
3. **The window is wide.** `registerBusiness` does a geocoding HTTP round trip
   and then a multi-statement interactive transaction before the row exists.
   Seconds, not milliseconds — long enough that a user who got no feedback
   would click again well within it.

**The guard added afterwards does not close it.** Lines 123–142 are a
`findFirst` on `(createdByUserId, name, mergedIntoId: null)` followed by a
`create` — read-then-write, the exact shape §"Concurrency" above rejects. It
stops a *sequential* double submit (the second click after the first request
returned) and it does nothing about a *concurrent* one (two requests in flight
together), which is what a double-click actually produces. It also cannot help
at all when the two submissions come from different accounts, or when the name
was retyped with different whitespace.

Epic 18 closes the concurrent case for any caller that sends a key, at the
protocol level, without the endpoint knowing anything about it.

**What to collect for a definitive answer** (operator action, production data,
no code required):

```sql
SELECT id, slug, name, "createdByUserId", "claimedByUserId", district,
       address, "avgRating", "reviewCount", "createdAt", "claimedAt"
  FROM "Business"
 WHERE name ILIKE '%ravotsoy%'
 ORDER BY "createdAt";
```

Read it as: identical `createdByUserId` + `district` + `address`, a
`ravotsoy` / `ravotsoy-2` slug pair, and `createdAt` values seconds apart
⇒ double submit, confirmed. Minutes or days apart, or different creators
⇒ two independent registrations, and the fix is a merge plus one of the
constraints below, not this epic.

`Business.mergedIntoId` and `POST /console/businesses/:id/merge` already exist,
so the operator remedy is a merge rather than a delete — which preserves both
review sets instead of discarding one of the conflicting ratings.

## Candidate unique constraints — reported, deliberately not added

Each of these would have prevented the duplicate. Each can also reject a
legitimate record, so none is added without the product owner's decision.

| Candidate | Prevents | Would wrongly reject |
|---|---|---|
| `UNIQUE (createdByUserId, lower(name))` | One owner registering the same name twice — the exact duplicate observed | Nothing obvious *unless* a genuine second location is registered under the identical name before `parentBusinessId` is used. That is a real flow (`Business.locations` exists for it), so this needs a decision about whether locations must differ by name. **The narrowest candidate, and the one to consider first.** |
| `UNIQUE (lower(name), district)` | Two accounts listing the same business in one district | Franchises and chains — "Chopar Pizza, Yunusobod" is legitimately several rows if a district has two branches. Rejects real businesses. |
| `UNIQUE (taxId)` where not null | The same legal entity registered twice | Multi-brand operators under one STIR/INN, and a single owner with several venues. Also unusable until `taxId` fill rate is known — it is optional today. |
| `UNIQUE (lower(name), address)` | The same venue at the same address | Address strings are free text (`"Kitob, Toshkent"` is in the catalogue, per TRUST-AUDIT §6). Uniqueness over unnormalized text enforces spelling, not identity. |

A note on sequencing: adding any of these requires the existing duplicates to
be merged **first**, or the migration fails on live data. That is another
reason they are a decision and not a patch.

---

## Applying the durable store, after M1

`packages/db/migrations-gated-m1/20260810000000_idempotency_record_GATED_ON_M1`.
Follow `packages/db/migrations-gated-m1/README.md`; the fifth step for this
table is `API_IDEMPOTENCY_STORE=prisma`. No API code changes at any step.

Before M1 the Redis store gives cross-replica protection with a 24h TTL, which
covers the failure this epic was opened for. What Postgres adds is survival of
a Redis eviction or flush — and a record an operator can query when auditing a
disputed create.
