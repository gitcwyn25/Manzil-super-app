<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Every outbound URL (auth, business, legal, social) lives in `src/lib/links.ts` and is covered by `src/lib/links.test.ts`, so there is one place to re-verify against live deployments.
- Customer auth is owned by the external app (`app.manzilgroup.uz/auth`, `?mode=signup`, relative `?next=`); this site never implements its own login forms.
- Marketing sections live in `src/components/marketing/`; the logo lives only in `src/components/brand/ManzilMark.tsx` (traced from official artwork) and must never be redrawn.
- Dark sections use the `.theme-ink` class to flip semantic tokens; components use semantic tokens only.
- Photos are Lovable asset pointers in `src/assets/*.asset.json`; every photo shown needs a visible credit/license (`photoCredits`).
