# Product Experience System (PXS) — Epic 17

**Scope:** `apps/web` · **Components:** `app/components/pxs/` · **Hooks & types:** `app/lib/pxs/` · **Styles:** the `.pxs-` block at the end of `app/globals.css`

Users judge quality less by colour than by whether the product always tells them what is happening. PXS is the one framework that answers that question, so the platform reads as one product rather than twenty pages that each invented their own spinner.

---

## ⛔ The binding rule

> **Every progress or stage message must correspond to a real stage in a real process.**

Fake stages, invented counts, and spinners for work that is not happening are **forbidden**. This is the same category of failure as a fabricated metric, and it is governed by the same principle as the rest of the product (`docs/evidence/TRUST-AUDIT.md`): *an omitted claim costs a feature; a fabricated one costs the product.*

The tempting version of an AI thinking state looks like this:

```
Thinking… → Reading your preferences… → Comparing 24 restaurants…
  → Removing closed places… → Ranking by your budget… → Done ✓
```

If Gurman did not compare 24 restaurants, **nothing may say it did.** A progress bar that animates to 90% on a timer is a fabricated measurement wearing a different hat.

### How the rule is enforced structurally, not by convention

Rules that live only in a document get broken by the next person in a hurry. This one is enforced by the shape of the code:

| Mechanism | Effect |
|---|---|
| `StageList` takes `stages` as a **required prop with no default** | You cannot render a stage list without data |
| **No stage text exists anywhere in `app/components/pxs/`** | There is no plausible-looking sequence to copy-paste |
| `parseStages()` returns `[]` for any payload it cannot verify | A malformed response degrades to honesty, never to a placeholder |
| `StageList` renders `null` for an empty list when not busy | "The process reported nothing" is a complete, renderable answer |
| `ProgressBar` omits `aria-valuenow` entirely when indeterminate | The ARIA-correct way to say "running, amount unknown" |

The only text `StageList` owns is `copy.stages.waiting` — *"Waiting for a reply…"* — which describes **the request**, a fact the component can verify, rather than any step inside it.

### Today's reality

No Manzil backend emits stages. `POST /gurman/ask` returns text, grounded businesses and an availability flag. So every current caller passes `[]` and gets one indeterminate indicator. The contract below is shipped ahead of the implementation so Epic 18 builds against a fixed shape.

---

## Component inventory

### Runtime (mounted once, in `app/components/app-providers.tsx`)

| Component | Purpose |
|---|---|
| `PxsProvider` | Composes the three below. Nesting order is load-bearing: announcer outermost, because the toast system announces *through* it |
| `AnnouncerProvider` / `useAnnounce` | The app's single pair of ARIA live regions (polite + assertive) |
| `ToastProvider` / `useToast` | Queue, dedupe, auto-dismiss, action buttons, pause-on-hover |
| `ConnectionBanner` | Offline + reconnect states; renders nothing while the connection is up |

### Mutations — every write goes through one of these

| Export | Use for |
|---|---|
| `useMutation` | Client-side writes (fetch / XHR) |
| `MutationForm` + `MutationSubmit` | Server Action forms |

### Overlays

| Component | Notes |
|---|---|
| `Dialog` | Focus trap, ESC, backdrop click, focus restore, scroll lock, portal to `body` |
| `ConfirmDialog` | Nothing destructive is the default focus target |

### Loading & progress

`Skeleton` · `SkeletonText` · `SkeletonCard` · `SkeletonGrid` · `SkeletonRegion` · `ProgressBar` · `Spinner` · `UploadProgress`

Server-safe — usable directly in an RSC or as a `<Suspense>` fallback without opening a client boundary.

### States

`StatePanel` and its presets `EmptyState` · `NoResultsState` · `ErrorState` · `SuccessState` · plus `PxsErrorBoundary` (local failure containment with a real retry, unlike route-level `error.tsx` which blanks the whole page).

### Process reporting

`StageList` — see the binding rule above.

### Forms & feedback

`AsyncButton` · `FormSubmitButton` · `SaveIndicator` · `UnsavedChangesGuard` · `useFormDirty`

### Hooks (`app/lib/pxs/`)

`useOptimisticValue` · `useOptimisticAction` · `useFocusTrap` · `useScrollLock` · `useReducedMotion` · `useOnlineStatus` · `useOnReconnect` · `useKeyboardShortcut`

---

## The mutation system

### The bug it closes

> Click Save → nothing visible happens → the user clicks again → two requests → **two rows in the catalogue** for one business, which then accumulate separate reviews and separate ratings.

A duplicate listing produced this way is visible in the live catalogue today (`TRUST-AUDIT.md` §6 recorded it as a data-integrity problem; registration is the write path that most plausibly produced it).

### The five guarantees, inherited not reimplemented

1. **One request per intent.** The guard is a `useRef` checked and set *inside* the primitive, before the caller's `run` executes. It is a ref rather than state because `pending` is still `false` on the second click of a double-click. A form cannot opt out by forgetting a guard in its own handler, because the guard is not in the handler.
2. **Immediate acknowledgement.** `pending` flips synchronously; the button disables, shows a spinner and "Saving…", and sets `aria-busy`.
3. **Success is confirmed, never assumed.** The success toast, the `Saved ✓` hold and the refresh all hang off the *resolution* of the request. An interface that says "Saved" because a request left the browser is asserting an outcome it has not observed — the same failure the trust audit removed from the site's copy.
4. **Failure is loud and lossless.** A pinned red toast carries the API's own message; the control re-enables; **the form keeps everything the user typed.**
5. **The retry is identified.** An `Idempotency-Key` accompanies every POST and is *not* rotated on failure.

### Why a failed Server Action must return, not throw

A Server Action that throws is handled by the nearest `error.tsx`: the route is replaced and **thirteen fields of typing are destroyed**. Returning a `FormActionState` keeps the form mounted with its DOM values intact.

`FormActionState` carries a `token` so two identical consecutive failures are distinguishable — without it React would not re-run the toast effect, and the second click would once again appear to do nothing.

### Idempotency keys

- **Header:** `Idempotency-Key` (the Stripe convention). **Value:** UUID v4. **Method:** POST only — PATCH/DELETE against a resource URL are idempotent by construction.
- **Lifetime:** minted when a create form mounts; **kept across retries of the same attempt**; rotated only after a confirmed success or an explicit `reset()`.
- **Transport through Server Actions:** actions receive `FormData`, not headers, so the key travels as a hidden field (`MutationForm` renders it) and is lifted onto the header by the action (`idempotencyKeyFrom`).
- **Never minted server-side.** A key generated per request on the server differs on every attempt and deduplicates nothing — it would look like protection while offering none. `idempotencyHeaders()` returns `{}` when no client key exists.

The key is written to the hidden input imperatively in a mount effect, not during render: a UUID generated during render would differ between the server and hydration passes.

---

## Server-side contract required (NOT implemented here — for Epic 18)

`apps/api` is a concurrent workstream. The web client already sends everything below; the server half is outstanding. **Sending the header before the server honours it is harmless and is the correct ordering.**

### 1. Idempotency

On every `POST` carrying `Idempotency-Key`:

- **First use:** process normally; store `(key, userId, endpoint) → {status, responseBody}` with a TTL of at least 24h.
- **Replay of a *completed* request:** return the **stored response**, unchanged. Do not re-execute.
- **Replay while the first is still in flight:** `409 Conflict`.
- **Same key, different payload:** `422 Unprocessable Entity`. The key identifies one operation; reusing it for a different one is a client bug and must be loud.
- **Scope keys per authenticated user** so one user's key can never return another user's response.
- **First priority:** `POST /crm/register` — that is the endpoint producing duplicate listings.

### 2. Stage events

Any endpoint doing multi-step work may add a `stages` array. `StageList` renders it with no client change.

```jsonc
{
  "data": {
    "text": "…",
    "businesses": [ /* … */ ],
    "available": true,
    "stages": [
      { "id": "retrieve", "label": "Read your saved places", "status": "done",   "detail": "12 matched" },
      { "id": "ground",   "label": "Checked each suggestion exists", "status": "done" },
      { "id": "rank",     "label": "Ranked by your budget", "status": "active" }
    ]
  }
}
```

`status` ∈ `pending | active | done | failed | skipped`. `detail` is optional.

**The rule binds the API too.** Emit a stage only for work that ran, and a `detail` count only for a number the engine actually computed. An API that emits decorative stages moves the fabrication one layer down; it does not make it acceptable. Epic 03's `RecommendationTrace` and Epic 08's reason codes already record real stages — PXS renders them, it does not author them.

---

## Governance

**Every new feature MUST consume these components rather than inventing its own behaviour.** A surface that hand-rolls a spinner, a toast, a modal or a submit handler is a review rejection.

Concretely, a change is rejected if it:

- writes its own toast/snackbar instead of `useToast`;
- writes a modal without `useFocusTrap` + `useScrollLock`, or without restoring focus;
- calls a mutation endpoint outside `useMutation` / `MutationForm` (the single-flight guard and the idempotency key are not optional);
- shows a determinate progress value that no process measured;
- **renders any stage label that did not arrive as data** — the gravest one;
- adds a `@keyframes` animation with no `prefers-reduced-motion` handling;
- adds an empty/error state with nothing actionable in it.

---

## Motion spec

Motion tokens are the existing ones — PXS defines no new curves or durations.

| Token | Value | Used for |
|---|---|---|
| `--speed-fast` / `DUR.fast` | 180ms | Press, toggle, backdrop fade |
| `--speed-med` / `DUR.med` | 360ms | Toast/dialog entrance, progress fill |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances |
| `--ease-spring` | `cubic-bezier(0.22, 1, 0.36, 1)` | Press feedback (no bounce) |

JS-driven motion uses framer-motion via `components/motion/presets.ts`, and is already covered app-wide by `<MotionConfig reducedMotion="user">`.

### Reduced motion

One `@media (prefers-reduced-motion: reduce)` block at the end of the PXS CSS covers every animation the system defines. The distinction is deliberate, not a blanket `animation: none`:

- **Removed** — decorative or looping motion that conveys nothing on its own: skeleton shimmer, active-stage pulse, button press scale, and the global `main { animation: page-enter }` (a full-page translate on every navigation, previously with no reduced-motion escape — fixed here).
- **Kept, slowed to ~half speed** — motion that *is* the message. A spinner and an indeterminate bar say "this is still running"; freezing them turns them into a static graphic claiming the opposite. WCAG 2.3.3 asks for reduction, not removal of information.

No PXS component gates motion in JavaScript, so the behaviour is correct during SSR and before hydration.

---

## Accessibility spec (WCAG 2.1 AA)

| Area | Contract |
|---|---|
| **Announcements** | One pair of live regions, mounted at boot. Regions must exist *before* their content changes, so components that mount a region and fill it in the same tick announce nothing. `assertive` for failures; `polite` for everything else |
| **Repeat announcements** | The announcer clears and re-sets the message: setting a region to the string it already holds is not a mutation and would be silent |
| **No double-announcing** | The toast viewport is **not** a live region (`role="region"`, no `role="status"`), because the announcer already speaks. `Spinner` takes `decorative` for when adjacent text says the same thing |
| **Dialogs** | Focus moves in, cannot leave (Tab + Shift-Tab wrap, plus a `focusin` guard for programmatic focus), and returns to the trigger. `aria-modal` + `role="dialog"`. Scroll locked with scrollbar-width compensation |
| **Colour** | Never the sole signal. Each intent pairs a colour with a distinct icon and explicit text. Accents clear 4.5:1 on their own surfaces |
| **Skeletons** | `aria-hidden` per shape; the loading fact announced once by `SkeletonRegion` |
| **Progress** | `aria-valuenow` omitted when indeterminate |
| **Keyboard** | Everything reachable, visible focus via the global `:focus-visible` ring. Shortcuts are accelerators, never the only route (2.1.1), and ignore text-entry targets by default |

---

## Adopted surfaces

| Surface | What changed |
|---|---|
| **Business registration** (`business/register/page.tsx`, `crm/register-submit.tsx`, `crm-actions.ts`) | `MutationForm` + `MutationSubmit`. Single-flight guard, `Idempotency-Key`, action returns state instead of throwing (form values preserved), failure toast carries the API's own validation message, unsaved-changes guard on both exits |
| **Save control** (`business-action-buttons.tsx`, `user-preferences-provider.tsx`) | Optimistic toggle with real revert. `localStorage.setItem` throws on quota exhaustion and in Safari Private Browsing — previously swallowed by a `useEffect`, leaving "Saved" on screen for a change that reached no storage. Now reverts to the last confirmed snapshot and raises a pinned toast naming the cause. Share's silent clipboard failure also became visible |
| **Discover no-results** (`discover/page.tsx`) | `NoResultsState`. Same copy and actions; four near-identical hand-written empty states now have one component so the fifth surface cannot invent a fifth variant |
| **Gurman concierge** (`concierge-chat.tsx`) | `useMutation` replaces a hand-rolled in-flight ref (the endpoint is throttled 10 req / 15 min, so a double-tap costs a fifth of the user's daily budget). `StageList` renders the thinking state, data-driven, with `stages={[]}` |
| **Admin POSTs** (`lib/api.ts`) | All four routed through one `postJson` builder so the idempotency header is threaded once rather than remembered per call site |

---

## Migration path

Ordered by value, not by effort.

1. **Remaining create actions** in `crm-actions.ts` — `createBooking`, `createPackage`, `createAnnouncement`, `replyToReview`. Each needs the `useActionState` signature, a `try/catch` returning `formError()`, and `idempotencyKeyFrom(formData)` threaded into `crmSend`. The plumbing is already in `crmSend`; only the call sites are outstanding. *These are creates — same duplicate risk as registration.*
2. **`claim-form.tsx` and `review-form.tsx`** — client-side writes → `useMutation`.
3. **`photo-upload.tsx`** — currently `fetch()` for the R2 PUT, which **cannot report upload progress**. Switching to `XMLHttpRequest` yields real `ProgressEvent.loaded/total` for `UploadProgress`. *Deferred deliberately: faking the bar because the transport does not expose one is exactly what `UploadProgress`'s doc comment forbids, so a placeholder was not shipped in the meantime.*
4. **Remaining empty states** — Lists, Occasions, occasion detail → `EmptyState` / `NoResultsState`.
5. **Admin console mutations** — pass a browser-minted key into `approveClaim` / `rejectClaim` / `resolveReport` / `rejectReport`; the parameter already exists.
6. **Skeletons** — `SkeletonGrid` as the `<Suspense>` fallback for Discover and the home feed.

**Rule for the migration:** do not convert a surface without also giving it the honest failure path. A surface moved onto `useMutation` that still swallows its errors has gained nothing.

---

## Testing status

`apps/web` has **no unit-test runner** — no `test` script, no vitest/jest/testing-library. The repo's test setup for the web app is **Playwright** (`playwright.config.ts`, `tests/e2e/`, `npm run test:e2e`), which boots a production build and requires a live API, a database and Clerk credentials.

Per instruction, no test runner was added unasked. The behaviours worth covering — toast queueing and dedupe, optimistic revert-on-failure, focus trap, offline detection, reduced-motion — are mostly unit-shaped and are the strongest argument for adding vitest + testing-library to `apps/web` as a follow-up. Playwright can genuinely cover offline (`context.setOffline`) and reduced motion (`test.use({ reducedMotion: 'reduce' })`).

Verification for this change was `typecheck` → `lint` → `build`.
