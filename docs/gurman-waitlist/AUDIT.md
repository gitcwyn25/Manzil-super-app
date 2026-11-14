# Docs and Gurman repository/hosting audit

Observed on 14 November 2026. Exact UTC timestamps and bounded HTTP chains are
in [evidence/live-http.json](evidence/live-http.json). All external operations
were read-only. No response, message, account setting, deployment or domain
assignment was created or changed by this audit.

## Target and existing work

- The approved V3 source is `apps/marketing` in `manzil-v3-review`, commit
  `8459925e73b92a131f5b242e04f8361ca070bb48`. It is an independently installed
  TanStack Start/React/Vite package that prerenders static `dist/client` output.
- `App` is the separate `gitcwyn25/manzil-customer-app` repository. It is not
  the corporate implementation target. `Landing page` is the original
  downloaded source, without a Git repository, and should remain preserved.
- The populated legacy `manzil-source/gitcwyn25-Manzil-super-app-9dc1fff`
  checkout already occupies `feat/manzil-docs-gurman-waitlist`, tracking its
  remote at `fae269119857f2390d5b78bd991c4430e9b1cfcb`. That commit adds Docs,
  Gurman and a thank-you screen to the old Next.js `apps/web`, not V3. That
  checkout also contains extensive unrelated, uncommitted product/auth work.
- V3 and the occupied requested branch diverge at
  `9dc1fff8e4bb19f59ed9cc1eeee90ee9d17f1057`. The latter includes 19 additional
  legacy/product commits. Preserving both branches and using a distinct V3
  extension branch avoids rewriting published history or importing those
  unrelated changes.
- GitHub CLI initially returned HTTP 401 inside the restricted process.
  Read-only calls using the approved elevated process recovered access to the
  user's existing credential. Repository/branch metadata reads now succeed;
  no account reconnection is required on that evidence. This audit has not
  published branches or opened a PR.
- Current GitHub metadata confirms the default branch is
  `feat/faq-gurman-video`. The remote
  `feat/manzil-v3-domain-consolidation` remains
  `e436cfa94ef355eb5704c9249fef1ec2c51211c5`; its complete recursive tree has
  neither `apps/marketing` nor `docs/v3`. It carries 18 unrelated
  API/Reviews/Discover/founder commits since the common default baseline and
  is not a narrow V3 PR base. The local `feat/manzil-v3-lovable` source branch
  has not yet been published. A narrow extension PR needs that preserved V3
  baseline to exist remotely, with the extension reviewed against it.

## Current production differs from yesterday's records

The historical `docs/v3` records describe the prior `manzil-web` deployment
and a paused business portal. They are not current deployment evidence.

A read-only `vercel inspect https://manzilgroup.uz --scope manzil-group
--format=json` now identifies the serving deployment as:

- Project: `manzil-v3-marketing`, team `manzil-group`.
- Deployment: `dpl_G71QGF62PVNxbvH22ATqAvvauEPw`, production/READY.
- Immutable URL:
  `https://manzil-v3-marketing-7luruup93-manzil-group.vercel.app`.
- Static hosting: `outputDirectory: "."`, framework null, no server middleware.
- Existing aliases include the corporate apex and www. Their assignment
  predates this audit; this task has not changed them.

Live root HTML loads `/assets/index-C3Ukyj1P.js`, as does the existing local
marketing build. The bundle hashes differ: a direct byte comparison isolates
the difference to the minified `gurmanWaitlist` destination (`${ed}/en/waitlist/gurman`
locally versus `${Y}/gurman` live). This strongly connects production to the
V3 artifact, but the deployment does not establish an exact Git SHA. The
legacy Next.js app would use `/_next` assets instead. The current Docs,
Gurman and thank-you responses are standalone static HTML without scripts.

## Observed routes and release implications

| Route | Current observation |
| --- | --- |
| `/` | 200, V3 corporate page; global `noindex, nofollow` header. |
| `/docs` | 200; documentation placeholder; noindex. Existing copy labels references as published and outlines unverified technical capabilities. |
| `/gurman` | 200; existing copy promises curated suggestions, contextual discovery and priority beta invitations. These claims are not verified by this audit. |
| `/gurman/thanks` | 200; unconditionally displays "Confirmed" and says the response was recorded. Form-owner completion redirect access has not been verified. |
| `/gurman/waitlist` | 307 to exactly `https://tally.so/r/eqJLdQ`; final form 200. |
| `/gurman/waitlist?source=route-audit&next=%2Fdocs` | 307 forwards the query string to Tally, so the Location is no longer the exact authoritative URL. |
| `/business`, `/businesses` | 307 to `https://business.manzilgroup.uz/`, then `/uz`, final 200. |
| Customer root | 307 to `/community`, final 200. |
| Customer `/auth` | 307 to `/auth?mode=login&next=%2Fcommunity`, final 200. |
| Business root | 307 to `/uz`, final 200. The prior 503 is not reproduced. |
| Exact Tally form | 200, title `Gurman AI early access`; no submission attempted. |

The candidate should replace unsupported preview copy and remove or neutralize
the unconditional thank-you page until the form owner activates a completion
redirect. These are existing production findings, not changes made by this
audit. Publishing corrections remains subject to the owner's explicit release
approval.

Plain provider redirect rules currently preserve incoming query parameters.
The candidate needs an exact, server-side temporary redirect that discards
incoming query strings before sending visitors to the existing Tally form.
Do not create a submission endpoint or redirect to a substitute form.

HTTP checks establish reachability, not successful customer authentication,
Tally submission storage or Telegram delivery. Tally ownership, the intended
private chat and Make access remain unverified. Telegram must remain explicitly
pending until the operator completes and tests that connection.
