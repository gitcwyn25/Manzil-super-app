# Changelog

All notable changes to Manzil are documented here.

## [0.3.0] - 2026-09-04

### Added

- Added application-first business onboarding with an owner-facing application status flow, change-request resubmission, and an admin review queue.
- Added admin operational surfaces for business applications, activation, outbox, signatures, waitlist, payments, team, and campaigns.

### Changed

- Routed the legacy `/crm/register` compatibility endpoint through the BusinessApplication review boundary instead of creating a public business directly.
- Restricted company activation initiation to qualified or accepted signups and added a separately gated M1 activation migration.

### Verification

- API: 78 test suites and 1,011 tests passed.
- Workspace typecheck passed.
- Web lint passed with 0 errors and 32 warnings.
- Full authenticated browser E2E remains pending because the required authenticated browser session is not available in this run.

## [0.2.0] - 2026-09-04

### Added

- Consolidated the public Manzil web experience around the startup landing page, local-business Discover directory, For Businesses surface, and Docs / Trust Center.
- Preserved the current Expo mobile client and onboarding work, including the required storage and worklets dependencies.
- Added shared day, night, and system theme behavior to the public web shell.
- Added QA evidence for the production-build investigation, route probes, and public Discover smoke-test collection.

### Changed

- Kept Gurman mobile-only for the current release. Web `/gurman` and `/concierge` now redirect to the localized Gurman waitlist instead of presenting a web chat or download claim.
- Retained the futuristic liquid-glass visual direction across the public web surfaces while keeping product claims aligned with the implemented experience.
- Updated the localized Docs / Trust Center content and public product references during the branch integration.

### Fixed

- Bounded public server-side catalogue, homepage, media, list, occasion, waitlist, sitemap, pricing, and legal reads with timeouts and safe empty-state fallbacks so production generation does not wait indefinitely when the API is unavailable.
- Resolved the feature-branch integration conflicts without dropping remote history or resetting the nested Android worktree.

### Verification

- Web and mobile typechecks passed.
- Web lint passed with 0 errors and 32 warnings.
- Production build passed with 109/109 static pages generated and build traces collected.
- Core public route probes passed, including the Gurman and Concierge waitlist redirects.
- Six Discover Playwright tests were collected. Full browser execution remains pending the repository's available Chromium executable.
