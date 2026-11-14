# Add trustworthy Docs and Gurman entry pages to Manzil V3

The V3 corporate package now has a restrained Docs overview and a Gurman preview
whose waitlist link issues a real HTTP 307 to exactly
`https://tally.so/r/eqJLdQ`. Tally owns submissions. The pages make no launch-date,
feature, invitation or successful-registration claims.

This is a review candidate. Nothing was deployed, merged, reassigned or shut
down by this extension. Telegram is **needs account access; not configured or
tested**.

## Review scope and branch

- Head: `feat/manzil-docs-gurman-waitlist-v3`.
- Base: `feat/manzil-v3-lovable`, the preserved V3 source commit `8459925`.
- The exact requested branch is already occupied by the legacy Next.js change
  in [PR #66](https://github.com/gitcwyn25/Manzil-super-app/pull/66), with unrelated
  product commits and a dirty checkout. It was preserved. The distinct branch
  and stacked base keep this diff limited to `apps/marketing` and this review
  record. The base was published unchanged solely to make that diff reviewable.
- Only the corporate package is edited. Customer/business apps, authentication,
  APIs, schemas, production settings and standalone retirement remain outside
  this change. Existing homepage sections and approved vector geometry are
  preserved; the footer gains Docs/Gurman links, and its existing waitlist
  destination matches the current live `/gurman` entry.
- Current hosting/source observations are in [AUDIT.md](AUDIT.md). Earlier
  `docs/v3` production records are historical. Review both the preserved V3
  baseline and this extension before a release to the default branch.

## Routing and SEO

| Route | Candidate behavior |
| --- | --- |
| `/docs` | Prerendered overview, explicitly preparing/planned content, canonical apex URL, always noindex and excluded from sitemap. |
| `/gurman` | Prerendered forthcoming-experience page; plain anchor to `/gurman/waitlist`. |
| `/gurman/waitlist` | Literal `Location: https://tally.so/r/eqJLdQ`, HTTP 307, `Cache-Control: no-store`; input query parameters are discarded. |
| `/{en,uz,ru}/gurman/waitlist` | Preserved waitlist aliases with the same exact redirect. |
| `/business`, `/businesses` | Retained HTTP 307 to `https://business.manzilgroup.uz/`, including observed nested/localized mappings. |
| `/waitlist/gurman`, `/{en,uz,ru}/waitlist/gurman` | Retained temporary entry redirects to `/gurman`. |
| `/gurman/thanks` | Omitted. No success page is shown on click or direct navigation. |

The provider rule uses a fixed response header rather than the high-level
redirect rule that currently forwards incoming queries. The local preview
reads the same configuration. Vercel documents the combination of `routes`
with higher-level settings and status/Location redirects in its
[configuration reference](https://vercel.com/docs/project-configuration/vercel-json#routes).
Provider execution of the new rule still needs an isolated preview check
before any approved production release; local HTTP behavior is verified.

Default builds retain the existing preview/noindex policy. Production indexing
requires the existing explicit build opt-in, which was tested locally only.
Docs remains noindex even with that opt-in. Planned Docs sections use stable
content keys/fragments, ready for approved Markdown/MDX or CMS content; no
unwritten technical routes or guides are represented as available.

## Preview and verification

Local review: from `apps/marketing`, run `npm run build` and
`npm run preview`. No new hosted preview was published.

| Page | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Docs | [375 px](screenshots/docs-375x812.png) | [768 px](screenshots/docs-768x1024.png) | [1440 px](screenshots/docs-1440x900.png) |
| Gurman | [375 px](screenshots/gurman-375x812.png) | [768 px](screenshots/gurman-768x1024.png) | [1440 px](screenshots/gurman-1440x900.png) |

Build, typecheck, lint, unit checks, production-mode static assertions and
browser results are recorded in [QA_REPORT.md](QA_REPORT.md). The six screenshots
were visually inspected. Browser checks cover keyboard/reduced-motion behavior,
mobile layout, canonical/robots/sitemap output, no-JavaScript CTA behavior,
literal HTTP redirects, existing homepage behavior and account/business links.
No real submission or Telegram message was sent. The cached browser does not
match the Playwright runner's expected revision; a matching CI/browser run and
interactive acceptance review remain release gates.

## Telegram operator setup

The exact public Tally form returned HTTP 200; reachability does not verify
ownership, actual field mapping, successful submissions or notifications.
No legitimate Tally/Make account or intended private chat was connected here.
Full instructions and official references: [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md).

1. Create the private Manzil team group/channel, add an appropriately permissioned
   bot, and verify the destination with its owner. Keep the bot token in Make's
   secure connection and the chat ID in restricted scenario configuration.
2. Add **Tally → Watch New Responses** in Make, authorize the form owner's
   account and select the existing form at `https://tally.so/r/eqJLdQ`.
3. Add **Telegram Bot → Send a Text Message or Reply** and choose the verified
   private chat. Use plain text with Parse mode unset; disable link previews.
4. Inspect the actual response schema and map only available, appropriate
   name/email/phone fields, actual submission timestamp and submission ID.
   Normalize/bound untrusted answers; never map answers into connection/chat
   controls or interpolate raw formatting. Use the runbook's labeled template.
5. Run once, make one authorized test submission, and verify one stored Tally
   response produces exactly one message in that private chat. Opening the CTA
   alone must send nothing. Check for an existing scenario before activating
   this one; inspect delivery before replaying failed runs.

Before release, the form owner must inspect Redirect on completion and retain
Tally's completion experience: this candidate omits `/gurman/thanks`. Only use
that optional destination after a separate approved page exists and Tally's
owner explicitly configures it. Never pass personal data in its URL.

## Approval and rollback

No production launch is authorized by this PR. Before release: verify a
matching browser and isolated Vercel preview, confirm the exact host rules and
completion setting, review content, complete the Telegram receipt test (or
explicitly accept its pending state), and obtain approval for the exact artifact
and indexing policy. Do not copy yesterday's provider identity or deploy only
HTML while omitting the checked-in host configuration.

Current read-only rollback baseline: Vercel `manzil-v3-marketing` in
`manzil-group`, production deployment `dpl_G71QGF62PVNxbvH22ATqAvvauEPw`, immutable
URL `https://manzil-v3-marketing-7luruup93-manzil-group.vercel.app`. Reconfirm and
record the serving deployment immediately before any approved release; retain
it. If that later release fails, use Vercel's rollback to the recorded preceding
corporate deployment, then verify apex/www, root, Docs/Gurman redirects and
customer/business entry links. Leave independent services and DNS untouched.

For source rollback, revert this PR's extension commit and rebuild the reviewed
baseline; do not reset the user's dirty product checkout. If notifications have
subsequently been activated, disable only the dedicated Make scenario to pause
delivery; Tally continues to own responses. Restore Tally completion settings
only through its verified owner. No rollback operation was executed here.
