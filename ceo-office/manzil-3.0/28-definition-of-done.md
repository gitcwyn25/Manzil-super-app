# ✅ MANZIL — Definition of Done (v1.0, binding)

> Adopted 2026-08-07. **No feature merges until every applicable line is satisfied.** This deliberately slows feature creation and dramatically reduces pre-launch rework. A line that genuinely does not apply is marked N/A *with a reason* — never silently skipped.

## The checklist

| # | Requirement | Notes |
|---|---|---|
| 1 | Backend implemented | |
| 2 | Frontend implemented | |
| 3 | Mobile compatible | if applicable — state N/A + reason otherwise |
| 4 | Loading states | via Epic 17 PXS components, not hand-rolled |
| 5 | Success states | |
| 6 | Error states | with retry where recoverable |
| 7 | Empty states | must convert or educate — never a dead end |
| 8 | Skeleton loading | honours `prefers-reduced-motion` |
| 9 | Optimistic updates | where appropriate, with revert-on-failure |
| 10 | **Idempotent mutations** | `Idempotency-Key`; see Epic 18 |
| 11 | **Authorization verified** | identity-based, never from URL/params/body |
| 12 | Audit logging | for every mutation |
| 13 | Accessibility checks | WCAG AA: keyboard, focus, contrast, live regions |
| 14 | Localization | uz/ru/en, hand-written, never machine-translated |
| 15 | Analytics events | |
| 16 | Automated tests | including the failure paths, not just the happy one |
| 17 | Documentation updated | |

## Manzil-specific additions (non-negotiable)

These come from failures already found in this codebase, not from theory:

18. **No fabricated data.** Every number shown to a user originates from real backend data. Absent data renders an honest empty state or omits the element. *(A fabricated "1,200+ businesses" claim shipped to production and was found by an external reviewer, not by us.)*
19. **No progress theatre.** Every stage/progress message corresponds to a real stage in a real process. Stage lists are emitted by the thing doing the work, never authored by the UI. *(Epic 17 binding rule.)*
20. **Insufficient data is a typed outcome**, not a guess. Below an evidence floor, return the taxonomy's insufficient-data kind — never interpolate. *(Epic 06 discipline; Epic 16 cold-start rule.)*
21. **Recommendations are explainable.** Anything user-facing that ranks or selects carries a trace. *(ADR-005 makes an unexplained recommendation unrepresentable — keep it that way.)*
22. **No vertical hardcoded below the presentation tier.** Category rules live in data or policy. *(Product Bible Appendix E.)*
23. **Secrets never enter source, logs, tests, or commits.** Fixtures use obvious fakes. Error responses are logged by status, not body. *(An OpenAI auth failure echoes a partially-redacted key — this is why.)*
24. **Draft/unpublished content is unreachable publicly.** Visibility state is a security boundary, not a display preference.

## Gate mechanics

- Gates run **sequentially on a quiet tree**: typecheck → lint/build → tests. A gate not run is a gate not passed; never report one as green without running it.
- **Commit working increments early.** Three agent sessions were interrupted with hours of uncommitted work in a single day — completeness is not worth the risk of loss.
- Concurrent work stages **only its own paths**. Never `git add -A`.
- Evidence lands in `docs/evidence/` for anything user-visible or security-relevant.

## Why this is worth the cost

Every item above traces to a specific defect this project actually shipped or nearly shipped: fabricated metrics on the conversion page, duplicate records from a double-clicked form, suspended businesses still reachable in search, 500s on `robots.txt`, a "Save" button whose store could never be cleared, English strings on Uzbek pages, raw i18n keys in a pricing table. None were exotic. All were preventable by a checklist.
