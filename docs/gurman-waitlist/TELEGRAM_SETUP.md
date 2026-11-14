# Gurman waitlist notifications: operator setup

Status, 14 November 2026: **needs account access; not configured or tested**.
No Make scenario, bot connection, destination chat or Tally completion setting
was changed. Public access does not establish ownership of a form.

The exact form is <https://tally.so/r/eqJLdQ>. A read-only HTTP GET returned
200 with the title **Gurman AI early access** at 04:40:30 UTC on 14 November
2026; see [the HTTP audit](evidence/live-http.json). No response was submitted.
Ownership, actual fields, submission acceptance and owner settings remain
unverified. Do not substitute another form if this URL fails.

## Minimal setup by the authorized operator

1. Create a **private Manzil team group or channel**. Create a bot with the
   official [BotFather](https://t.me/BotFather), or use an approved existing bot.
   Add it to the intended destination: permit sending messages in a group;
   grant posting permission in a channel. Confirm the destination with its
   owner. Enter its token only in Make's Telegram connection and its chat ID
   only in the restricted scenario configuration. Do not paste either into
   this repository, browser environment variables, tickets or screenshots.
2. In Make, create one scenario starting with **Tally → Watch New Responses**.
   Authorize the legitimate form owner's Tally account, choose the form whose
   published URL is exactly `https://tally.so/r/eqJLdQ`, and save the trigger.
   Inspect the actual response schema before mapping fields. This trigger
   responds to a submitted form, rather than a corporate-page CTA click.
   [Tally's Make setup](https://tally.so/help/make-integration)
3. Add **Telegram Bot → Send a Text Message or Reply** (the current name of
   the requested Send a Text Message action). Select the secure bot connection
   and verified private chat. Leave reply/message-thread options unset unless
   the verified destination requires a specific topic.
   [Make's Telegram module](https://apps.make.com/telegram)
4. Map only actual fields that the form collects and the team needs. Use the
   template below, deleting unavailable name/email/phone/submission-ID lines.
   Map the actual submission timestamp, including timezone, rather than the
   scenario's execution time. If that metadata is absent, label a separately
   mapped Make timestamp `Received`, without claiming it is the submission time.
5. Click **Run once**, submit one clearly identified test through the published
   Tally form using the operator's own test details, and verify one stored
   Tally response, one successful scenario execution and **exactly one message
   in the intended private chat**. Match submission ID when available. Merely
   opening the waitlist must produce no notification. Save and activate the
   scenario only after this test passes; confirm its active schedule/instant
   trigger state. Record the result privately without respondent details.
   [Tally's test and activation instructions](https://tally.so/help/make-integration)

```text
🚀 New Gurman waitlist signup
Name: <actual name field, if collected>
Email: <actual email field, if collected>
Phone: <actual phone field, if collected>
Submitted: <actual submission timestamp with timezone>
Source: Gurman waitlist
Submission ID: <actual submission ID, if available>
```

## Message safety and reliable operation

Treat every answer as untrusted text. Leave the optional **Parse mode** unset
and verify the outgoing request has no Markdown/HTML parse mode or explicit
entities. Disable link previews. Map answers only into the message body, never
the destination, connection, parse mode or reply markup. If the module requires
a parse mode, use HTML and escape `&`, `<` and `>` in each answer before mapping;
do not interpolate raw answers into HTML.

Normalize embedded newlines/control characters in each answer to spaces so an
answer cannot imitate another labeled field. Bound each included answer to
200 characters and the total message to Telegram's 4,096-character limit.
Use a formatting probe such as `A&B <test> _name_ [text]` in an authorized test
to check that input stays literal. The API makes `parse_mode` optional.
[Telegram sendMessage](https://core.telegram.org/bots/api#sendmessage)

Keep one active notification scenario for this form and destination; check for
existing automations before enabling another. The two-module flow does not
guarantee exactly-once delivery during retries or ambiguous network failures.
Before replaying a failed run, check whether its submission ID already appears
in the private chat. If strict replay deduplication becomes necessary, design
it separately with the owner; no parallel waitlist/database is introduced here.
Review failed runs, retry deliberately, and reconcile against Tally, which
remains the submission source of truth. Restrict Make execution-history access
and retention because mappings may contain personal data.

## Optional completion destination

This candidate deliberately has **no `/gurman/thanks` page**. Retain Tally's
own completion experience. Before release, the form owner must inspect the
existing **Redirect on completion** setting and disable any redirect to
`https://manzilgroup.uz/gurman/thanks`, so successful respondents are not sent
to a route omitted from this candidate. The current production thanks page
was not changed by this work; its unconditional confirmation is not evidence
that a visitor submitted the form.

Only after an approved `/gurman/thanks` page exists and the form owner elects
to use it, open the published Tally form's **Settings**, enable **Redirect on
completion**, and enter exactly `https://manzilgroup.uz/gurman/thanks` without
personal-data parameters. Test on the published form: Tally's builder preview
does not perform this redirect. Until then retain Tally's completion experience.
This is separate from `/gurman/waitlist` sending visitors to the form; neither
a CTA click nor a direct thanks-page visit proves submission.
[Tally completion settings](https://tally.so/help/redirect-on-completion)

## Handoff and rollback

Pending operator record: form ownership verified; destination verified; mapped
field names reviewed; scenario active; one response → one message test passed;
click-without-submission test passed; optional completion setting checked.
All are currently **pending**. Do not report Telegram as operational until
the receipt test passes.

To pause notifications, disable only this Make scenario. Tally continues to
collect responses. To undo an optional completion redirect, disable that setting
and restore Tally's own completion experience. Self-email notifications may be
enabled by the form owner as a fallback, but do not replace Telegram delivery.
