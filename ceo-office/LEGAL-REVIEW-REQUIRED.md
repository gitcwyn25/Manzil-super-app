# ⚖️ BLOCKING: legal review required before campaigns reach real customers

**Status:** open · **Owner:** CEO (to engage counsel) · **Type:** non-engineering dependency
**Blocks:** CRM M4 (campaigns) going live. Nothing else.

This is not backlog. No amount of further engineering resolves it — it needs
someone who practises Uzbek commercial / data-protection law to read what we
have drafted and tell us whether it is sufficient.

Until it is closed, the system is **fail-closed by design**: with no messaging
provider credentials in production, campaign sends are recorded as `failed`
with an explicit reason, never as `sent`. An unreviewed deployment sends
nothing rather than sending something non-compliant.

---

## Why this exists

Uzbekistan's personal data protection law (No. ZRU-547, 2019, as amended)
governs the processing of personal data including phone numbers. Sending
marketing messages to a customer list is exactly that. We have implemented what
we believe a defensible consent model looks like, but **we are not qualified to
certify it**, and a consent record that does not hold up is worse than no
campaign feature at all.

## What we have built (for counsel to assess)

| Control | Implementation |
|---|---|
| Consent is explicit | `Customer.consentMarketing` defaults to `false`. Set only by a deliberate act — never inferred from a booking, a visit, or an existing relationship. |
| Consent is timestamped | `Customer.consentAt` is stamped alongside the flag; withdrawal clears it, so the pair can never read as "consented, at some point". |
| Consent is per business | Granted separately for each business the person is a customer of. Agreeing to hear from one salon does not agree to hear from every business on the platform. |
| Consent is checked at send | Re-read per send, never cached from when the campaign was created. |
| Withholding is recorded | Every blocked send writes a `CampaignSend` row with status `blocked_no_consent` and the consent flag as it stood. A table of successes alone cannot evidence that a message was correctly withheld. |
| Identity ≠ permission | Linking a Telegram account (via verified contact share) is a separate act from granting marketing consent. |
| Withdrawal | Available at any time from the Telegram bot's 🔔 screen. |

Code: `apps/api/src/modules/crm/campaigns.service.ts`,
`apps/api/src/modules/crm/customers.repository.ts`,
`marketing-office/telegram-bot/src/bot.ts`.

## What we specifically need answered

1. **Opt-out wording.** Every commercial message presumably must carry an
   opt-out. What exact wording and mechanism does UZ law require, and must it
   appear in every message or only the first?
2. **Retention.** How long may we keep `CampaignSend` records — which contain a
   phone number, the message body, and a consent flag? Is there a maximum, and
   does a withdrawal oblige us to delete history or only to stop sending?
3. **Per-channel consent.** Is consent granted for Telegram valid for SMS, or
   must each channel be consented to separately? Our model currently treats
   consent as per business, not per channel.
4. **Telecom operator rules.** Do Uzbek mobile operators impose requirements
   beyond the statute (sender registration, permitted hours, content approval)
   that apply to us or to whichever SMS aggregator we eventually use?
5. **The published terms themselves.** `LegalDocument` currently holds a
   **placeholder** terms-of-service and contract template that we wrote as
   scaffolding. They carry `TODO: LEGAL REVIEW` in their body and are **not fit
   to be agreed to by a real business.** They need replacing with drafted text
   before registration is promoted to real merchants.

## Where the markers are

- `apps/api/src/modules/crm/campaigns.service.ts` — the consent gate's own doc comment
- `LegalDocument` rows in the database — placeholder ToS and contract template bodies
- `tech-office/docs/ARCHITECTURE.md`, `tech-office/docs/IMPLEMENTATION_STATUS.md`

## Definition of done

- [ ] Counsel has reviewed the consent model above and confirmed or corrected it
- [ ] Opt-out wording supplied and implemented in the campaign templates
- [ ] Retention period agreed and applied to `CampaignSend`
- [ ] Per-channel consent question resolved; model adjusted if needed
- [ ] Real terms of service and contract template published, replacing the placeholders
- [ ] This file updated to closed, with the reviewer and date recorded

**Do not enable campaign sending to real customers until every box above is
ticked.** The fail-closed behaviour is what is currently protecting us; removing
it before this review is complete would remove the only safeguard.
