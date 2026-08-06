# Milestone 0 Retrospective — Vibrant Marketplace Web Launch

**Date:** 2026-08-06 · One page, per governance. Improving how we build, not what we build.

## What worked

- **Review-before-build:** the 12-agent design review (per-screen specs + critic + API mapper) meant 13 implementation tasks ran in parallel with ONE architectural violation total. The critic's file partitioning made parallelism safe; its conflict list (footer, radii, rating color, Cyrillic) killed every cross-track inconsistency before code existed.
- **Decisions as contracts:** D1-D14 + the honest-data rules appeared verbatim in code comments across six independent tracks ("omitted, not faked"). Encoding principles into task contracts beat enforcing them in review.
- **Micro-review per commit:** cheap (minutes each), caught the one token violation same-hour, and produced the Implementation Ledger for free.
- **Atomic scoped commits:** two agent crashes and one staged-file collision cost zero lost work; recovery was `checkout --` + resume every time.
- **Evidence discipline:** the Genesis Record filled itself from artifacts that already existed (gate logs, census greps, screenshots) — no archaeology.

## What failed / slowed us

- **Infrastructure flakiness:** 3 agent deaths from network drops (one overnight stall) cost ~10 hours of calendar time. Mitigation for next milestone: shorter task granularity so retries lose less.
- **Concurrent typecheck vs build race** on `.next/types` produced a phantom gate failure — sequence gates, don't parallelize them on one tree.
- **The C: disk crisis** (day 1) killed a session mid-dispatch. Watch free disk before long runs.
- **Two e2e locations** (tests/e2e vs tech-office/qa) caused config confusion at the gate; the stale saas.spec.ts should be retired or rewritten.

## Governance rules that prevented defects (exercised)

UI Isolation Rule (caught A1 gradients) · honest-data D7/D8 (blocked 5+ fabrication opportunities) · Protect the Kit (icons stayed one module through 3 extensions) · scoped staging (survived a staged-file collision) · tag-after-verification (the tag means something) · language audit (caught the ru Featured/Saved collision).

## Rules never exercised

Engineering budget (no sprint declared one — first real use will be 02A) · DoR checklist (implicitly satisfied, never formally checked) · no-bypass review policy (nobody tried) · ADR bar (no borderline case arose).

## Remove

Nothing yet — unexercised rules are one milestone old; prune only if still unexercised after the mobile foundation + 02A-C (first sprint that will genuinely test budgets/DoR).

## Keep immutable

UI Isolation · honest-data · Protect the Kit · tag-after-verification · evidence-before-claims. These carried the milestone.

## Change (evidence requires it)

1. **Gate sequencing rule:** typecheck/lint/build run sequentially on a quiet tree (the race is documented evidence).
2. **Retire tech-office/qa/e2e/saas.spec.ts** (deterministically stale; superseded by tests/e2e).
3. **Add "free disk ≥ 15GB" to the DoR checklist** for fleet-scale work.
4. **Prisma migration drift** (found by inspection, not by governance): schema-vs-migrations consistency should become a CI check — queue as the first Milestone 1 infra task, with the consolidation migration.
