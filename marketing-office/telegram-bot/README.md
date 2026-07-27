# Manzil Business — Telegram bot

**[@manzilbiz_bot](https://t.me/manzilbiz_bot)** — the direct channel between businesses and the Manzil team.

A business messages the bot; the message is relayed to every configured admin. The admin **replies to that relayed message in Telegram**, and the reply routes back to the business. No separate inbox to check.

## What it does

**For businesses**

| Button | Behaviour |
|---|---|
| 📋 Ro'yxatdan o'tish | Opens the registration form as a Telegram **Web App** — inside the chat, not a browser tab |
| 💬 Savol berish | Message is relayed to the admins |
| 📊 Mening holatim | Looks up a business by name or phone and reports status and rating |
| ℹ️ Manzil haqida | What the platform is |
| 🌐 Saytni ochish | Opens the live site as a Web App |

Anything typed without pressing a button is relayed too — someone typing at a bot is trying to reach a human, and dropping that makes it feel like a wall.

**For admins** (`/admin`)

📈 Statistika · 🏢 Bizneslar · ⏳ Kutilayotgan · ⭐️ Sharhlar · 🛠 Admin panel (Web App)

Every number is read live from the platform database. If the database is unreachable the bot **says so** rather than showing a plausible-looking figure.

## Setup

```bash
cp .env.example .env      # fill in TELEGRAM_BOT_TOKEN
npm run setup             # one-off: commands, description, Web App menu button
npm start                 # long polling
```

### Granting yourself admin access

1. Message the bot and send `/whoami`
2. Put the id it returns into `TELEGRAM_ADMIN_IDS` in `.env` (comma-separated for several people)
3. Restart, then re-run `npm run setup` so the `/admin` command appears in *your* command menu only

**Until `TELEGRAM_ADMIN_IDS` is set, nobody has admin access and relayed messages go nowhere.** That is deliberate: an unset variable must not grant admin to whoever messages first. The bot logs a warning each time a message arrives with no admin configured.

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | yes | From [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_ADMIN_IDS` | yes, in practice | Comma-separated Telegram user ids |
| `MANZIL_WEB_URL` | no | Defaults to the production site |
| `DATABASE_URL` | no | Without it the bot runs, but stats report as unavailable |

`.env` is gitignored. **Never commit the token** — anyone holding it controls the bot.

## Security notes

- Admin checks run on every admin action, including the callback handlers behind the buttons — not only on `/admin`, so a copied button cannot be replayed by a non-admin.
- The public status lookup returns name, district, status and rating only. It deliberately never returns the owner's contact details, because anyone can type any business name into it.
- If the token is ever exposed, revoke it via **@BotFather → `/revoke`** and update `.env`.

## Notes

- **Long polling**, not webhooks: polling works anywhere, including a laptop, and needs no public HTTPS endpoint. Move to webhooks when the bot has a permanent home.
- Conversation state (which prompt you are answering) is in memory. A restart returns users to the menu rather than stranding them in a state they cannot see.
- `/start` shows Gurman's portrait if `apps/web/public/gurman/gurman-ai.png` exists, otherwise the app icon, otherwise text only — a missing asset degrades rather than crashing.
