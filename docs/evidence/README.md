# Evidence Log

Milestone record per `ceo-office/manzil-3.0/15-engineering-governance.md` (v1.2):
each milestone gets a dated folder or file capturing **screenshot · build number ·
commit SHA · performance snapshot · user feedback · decision made · follow-up
actions**. This is the record of *why* the product evolved — used for investor
updates, retrospectives, and onboarding.

Format: `YYYY-MM-DD-<milestone-slug>/` (assets + `NOTES.md`) or a single
`YYYY-MM-DD-<milestone-slug>.md` for text-only milestones.

Genesis Records are versioned (v1.0, v1.1, v2.0…) with a STABLE template so
trends stay comparable across releases. The template changes only when: (1) a
production incident revealed missing evidence, (2) a retrospective identified a
recurring blind spot, or (3) a new governance principle was formally adopted
through ADR + review. Genesis Records record what actually shipped, never what
was planned.

First entry lands with the Vibrant Marketplace web launch gate, formatted as the
**Genesis Record**: release name · date · git commit + tag · build ID · design
system version · Product Bible version · ADR count · platform · environment ·
build status · typecheck · lint · tests · bundle size · performance snapshot ·
accessibility summary · known limitations · next milestone ·
**architecture drift** reported as detected / merged / resolved-before-launch (the informative story, not just a zero; target: merged = 0) ·
**component reuse ratio** (shared component usages ÷ new component definitions — should rise over time; a design system that mints dozens of new components per sprint is failing).
