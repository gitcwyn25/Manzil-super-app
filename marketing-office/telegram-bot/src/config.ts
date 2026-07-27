import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Bot-local .env first, then the monorepo root, so DATABASE_URL can be shared
// without duplicating it. Earlier files win — dotenv does not overwrite.
dotenv.config({ path: path.join(here, "..", ".env") });
dotenv.config({ path: path.join(here, "..", "..", "..", ".env") });

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is required. Copy .env.example to .env and fill it in — see marketing-office/telegram-bot/README.md`
    );
  }

  return value;
}

export const config = {
  botToken: required("TELEGRAM_BOT_TOKEN"),

  /**
   * Telegram user ids allowed to use admin commands.
   *
   * An empty list means nobody has admin access, which is the safe default: an
   * unset variable must not silently grant it to whoever messages first.
   */
  adminIds: (process.env.TELEGRAM_ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number)
    .filter((id) => Number.isFinite(id)),

  webUrl: (process.env.MANZIL_WEB_URL ?? "https://manzil-business.vercel.app").replace(/\/$/, ""),

  /** Optional: without it the bot runs, but live stats are reported unavailable rather than faked. */
  databaseUrl: process.env.DATABASE_URL?.trim() || null
};

export function isAdmin(userId: number | undefined): boolean {
  return typeof userId === "number" && config.adminIds.includes(userId);
}
