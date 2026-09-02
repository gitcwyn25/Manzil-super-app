# Manzil documentation integration handoff

## Current finding

The approved folder contains the documentation drafts and planning/design artifacts, but no deployable web application source. No `package.json`, route tree, `src`, `app`, or `pages` folder was found under `D:\Desktop\Manzil\ceo-office`.

Therefore, no production code or deployed Vercel application has been modified in this run.

## Intended route map

Use the project’s existing locale convention. Recommended routes:

### Uzbek

- `/uz/about`
- `/uz/founders`
- `/uz/contact`
- `/uz/legal/terms`
- `/uz/legal/privacy`
- `/uz/legal/cookies`
- `/uz/legal/reviews`
- `/uz/legal/ai-transparency`
- `/uz/business/advertising-rules`

### Russian

Use the same route map under `/ru/`.

### English

Use the same route map under `/en/`.

## Footer placement

Add three groups:

1. **Manzil** — About, Founders, Mission/Vision, Contacts
2. **Trust & Legal** — Terms, Privacy, Cookies, Reviews, AI Transparency
3. **For Businesses** — Add a business, Verify a profile, Business terms, Advertising rules

## Integration acceptance criteria

- All three locales render the same document sections and version dates.
- Every page has canonical metadata, title, description, and `last updated` date.
- All placeholders are resolved before publication.
- Internal links use the active locale.
- Footer links are reachable from home, discover, concierge, and business pages.
- Legal pages are not blocked behind login.
- Privacy and cookie contact actions work.
- Sponsored listings are visibly labeled.
- Build, lint, route, mobile, and accessibility checks pass.
- The lawyer-review matrix is completed and signed off before legal pages become final.

## Next required input

Provide the actual source repository or application folder containing the production frontend. Once available, implement the routes and footer, run the project’s checks, and report the exact files changed.