import { Bot, InputFile } from "grammy";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, isAdmin } from "./config.js";
import { buttons, copy } from "./copy.js";
import { aboutMenu, adminMenu, backOnly, mainMenu } from "./keyboards.js";
import {
  findBusinessForStatus,
  getPendingClaims,
  getPlatformStats,
  getRecentBusinesses,
  getRecentReviews
} from "./data.js";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Brand art shown on /start.
 *
 * Gurman's portrait is preferred; the app icon is the fallback. Both are
 * optional — a missing file degrades to a text-only welcome rather than
 * crashing the handler, because a bot that will not start is worse than one
 * without a picture.
 */
const BRAND_IMAGES = [
  path.join(here, "..", "..", "..", "apps", "web", "public", "gurman", "gurman-ai.png"),
  path.join(here, "..", "..", "..", "apps", "web", "public", "icons", "icon-512.png")
];

function findBrandImage(): string | null {
  return BRAND_IMAGES.find((candidate) => fs.existsSync(candidate)) ?? null;
}

/**
 * What the user is currently being asked for.
 *
 * In memory deliberately: this is a single-step prompt, and persisting it would
 * mean a restart could leave someone stuck in a state they cannot see. A
 * restart simply returns them to the menu.
 */
type PendingAction = "ask" | "status";
const pending = new Map<number, PendingAction>();

/** Maps a relayed admin message back to the user who sent it, so replies route home. */
const relayTargets = new Map<number, number>();

export function createBot(): Bot {
  const bot = new Bot(config.botToken);

  /* ---------------------------------------------------------------- */
  /* Public commands                                                    */
  /* ---------------------------------------------------------------- */

  bot.command("start", async (ctx) => {
    pending.delete(ctx.from?.id ?? 0);

    const image = findBrandImage();

    if (image) {
      await ctx.replyWithPhoto(new InputFile(image), {
        caption: copy.intro,
        parse_mode: "Markdown",
        reply_markup: mainMenu()
      });
      return;
    }

    await ctx.reply(copy.intro, { parse_mode: "Markdown", reply_markup: mainMenu() });
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(copy.about, { parse_mode: "Markdown", reply_markup: aboutMenu() });
  });

  /** Lets someone find the id they need to be granted admin access. */
  bot.command("whoami", async (ctx) => {
    const id = ctx.from?.id;
    await ctx.reply(
      [
        `🆔 Sizning Telegram ID: \`${id}\``,
        "",
        isAdmin(id)
          ? "✅ Sizda admin huquqi bor."
          : "ℹ️ Admin huquqi uchun bu ID ni TELEGRAM_ADMIN_IDS ga qo'shing."
      ].join("\n"),
      { parse_mode: "Markdown" }
    );
  });

  /* ---------------------------------------------------------------- */
  /* Menu callbacks                                                     */
  /* ---------------------------------------------------------------- */

  bot.callbackQuery("menu", async (ctx) => {
    pending.delete(ctx.from.id);
    await ctx.answerCallbackQuery();
    await ctx.reply(copy.intro, { parse_mode: "Markdown", reply_markup: mainMenu() });
  });

  bot.callbackQuery("about", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(copy.about, { parse_mode: "Markdown", reply_markup: aboutMenu() });
  });

  bot.callbackQuery("ask", async (ctx) => {
    pending.set(ctx.from.id, "ask");
    await ctx.answerCallbackQuery();
    await ctx.reply(copy.askPrompt, { parse_mode: "Markdown", reply_markup: backOnly() });
  });

  bot.callbackQuery("status", async (ctx) => {
    pending.set(ctx.from.id, "status");
    await ctx.answerCallbackQuery();
    await ctx.reply(copy.statusPrompt, { parse_mode: "Markdown", reply_markup: backOnly() });
  });

  /* ---------------------------------------------------------------- */
  /* Admin                                                              */
  /* ---------------------------------------------------------------- */

  bot.command("admin", async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.reply(copy.notAdmin);
      return;
    }

    await ctx.reply("🛠 *Admin panel*\n\nNimani ko'rmoqchisiz?", {
      parse_mode: "Markdown",
      reply_markup: adminMenu()
    });
  });

  bot.callbackQuery(/^admin:/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: copy.notAdmin, show_alert: true });
      return;
    }

    await ctx.answerCallbackQuery();
    const action = ctx.callbackQuery.data.split(":")[1];

    if (action === "stats") {
      const stats = await getPlatformStats();

      if (!stats) {
        await ctx.reply(copy.dbUnavailable);
        return;
      }

      await ctx.reply(
        [
          "📈 *Platforma statistikasi*",
          "",
          `🏢 Bizneslar: *${stats.businesses}*`,
          `✅ Tasdiqlangan: *${stats.claimed}*`,
          `⏳ Kutilayotgan arizalar: *${stats.pendingClaims}*`,
          `⭐️ Sharhlar: *${stats.reviews}*`,
          `👥 Mijozlar (CRM): *${stats.customers}*`,
          `📣 Kampaniyalar: *${stats.campaigns}*`
        ].join("\n"),
        { parse_mode: "Markdown", reply_markup: adminMenu() }
      );
      return;
    }

    if (action === "businesses") {
      const rows = await getRecentBusinesses();

      if (!rows) {
        await ctx.reply(copy.dbUnavailable);
        return;
      }

      if (rows.length === 0) {
        await ctx.reply("🏢 Hali biznes yo'q.", { reply_markup: adminMenu() });
        return;
      }

      await ctx.reply(
        [
          "🏢 *Oxirgi qo'shilgan bizneslar*",
          "",
          ...rows.map(
            (row) =>
              `• *${escapeMarkdown(row.name)}* — ${escapeMarkdown(row.district)}\n  ${statusEmoji(row.status)} ${row.status} · ⭐️ ${row.reviewCount > 0 ? row.avgRating.toFixed(1) : "—"}`
          )
        ].join("\n"),
        { parse_mode: "Markdown", reply_markup: adminMenu() }
      );
      return;
    }

    if (action === "pending") {
      const rows = await getPendingClaims();

      if (!rows) {
        await ctx.reply(copy.dbUnavailable);
        return;
      }

      if (rows.length === 0) {
        await ctx.reply("✅ Kutilayotgan arizalar yo'q.", { reply_markup: adminMenu() });
        return;
      }

      await ctx.reply(
        [
          "⏳ *Kutilayotgan arizalar*",
          "",
          ...rows.map(
            (row) =>
              `• *${escapeMarkdown(row.businessName)}* — ${escapeMarkdown(row.district)}\n  ${row.createdAt.toISOString().slice(0, 10)}`
          )
        ].join("\n"),
        { parse_mode: "Markdown", reply_markup: adminMenu() }
      );
      return;
    }

    if (action === "reviews") {
      const rows = await getRecentReviews();

      if (!rows) {
        await ctx.reply(copy.dbUnavailable);
        return;
      }

      if (rows.length === 0) {
        await ctx.reply("⭐️ Hali sharh yo'q.", { reply_markup: adminMenu() });
        return;
      }

      await ctx.reply(
        [
          "⭐️ *Oxirgi sharhlar*",
          "",
          ...rows.map(
            (row) =>
              `${"⭐️".repeat(Math.max(1, Math.min(5, row.rating)))} *${escapeMarkdown(row.businessName)}*\n  _${escapeMarkdown(row.text.slice(0, 90))}_`
          )
        ].join("\n"),
        { parse_mode: "Markdown", reply_markup: adminMenu() }
      );
    }
  });

  /* ---------------------------------------------------------------- */
  /* Free-text: the relay                                               */
  /* ---------------------------------------------------------------- */

  bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;

    // An admin replying to a relayed message routes back to the original
    // sender — this is what makes the bot two-way rather than a suggestion box.
    if (isAdmin(userId) && ctx.message.reply_to_message) {
      const targetId = relayTargets.get(ctx.message.reply_to_message.message_id);

      if (targetId) {
        try {
          await ctx.api.sendMessage(
            targetId,
            `💬 *Manzil jamoasidan javob:*\n\n${text}`,
            { parse_mode: "Markdown", reply_markup: mainMenu() }
          );
          await ctx.reply("✅ Javob yuborildi.");
        } catch {
          await ctx.reply("⚠️ Javobni yetkazib bo'lmadi — foydalanuvchi botni bloklagan bo'lishi mumkin.");
        }
        return;
      }
    }

    const action = pending.get(userId);

    if (action === "status") {
      pending.delete(userId);
      const business = await findBusinessForStatus(text);

      if (!business) {
        await ctx.reply(copy.statusNotFound, {
          parse_mode: "Markdown",
          reply_markup: mainMenu()
        });
        return;
      }

      await ctx.reply(
        [
          `🏢 *${escapeMarkdown(business.name)}*`,
          "",
          `📍 ${escapeMarkdown(business.district)}`,
          `${statusEmoji(business.status)} Holat: *${business.status}*`,
          `⭐️ Reyting: *${business.reviewCount > 0 ? business.avgRating.toFixed(1) : "hali baho yo'q"}* (${business.reviewCount} sharh)`
        ].join("\n"),
        { parse_mode: "Markdown", reply_markup: mainMenu() }
      );
      return;
    }

    if (action === "ask") {
      pending.delete(userId);
      await relayToAdmins(bot, ctx.from, text);
      await ctx.reply(copy.messageSent, { reply_markup: mainMenu() });
      return;
    }

    // Unprompted message: still relay it. Someone who types without pressing a
    // button is trying to reach a human, and dropping that is the fastest way
    // to make the bot feel like a wall.
    await relayToAdmins(bot, ctx.from, text);
    await ctx.reply(copy.messageSent, { reply_markup: mainMenu() });
  });

  bot.catch((error) => {
    console.error("[bot] handler error:", error.message);
  });

  return bot;
}

/** Forwards a user's message to every configured admin, recording the mapping for replies. */
async function relayToAdmins(
  bot: Bot,
  from: { id: number; first_name: string; username?: string },
  text: string
): Promise<void> {
  if (config.adminIds.length === 0) {
    console.warn("[bot] message received but TELEGRAM_ADMIN_IDS is empty — nobody will see it");
    return;
  }

  const header = [
    "📨 *Yangi xabar*",
    "",
    `👤 ${escapeMarkdown(from.first_name)}${from.username ? ` (@${from.username})` : ""}`,
    `🆔 \`${from.id}\``,
    "",
    escapeMarkdown(text),
    "",
    copy.adminReplyHint
  ].join("\n");

  for (const adminId of config.adminIds) {
    try {
      const sent = await bot.api.sendMessage(adminId, header, { parse_mode: "Markdown" });
      relayTargets.set(sent.message_id, from.id);
    } catch (error) {
      console.error(
        `[bot] could not relay to admin ${adminId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }
}

function statusEmoji(status: string): string {
  if (status === "claimed") return "✅";
  if (status === "pending_claim") return "⏳";
  if (status === "suspended") return "⛔️";
  return "⚪️";
}

/** Escapes the characters Telegram's legacy Markdown treats as formatting. */
function escapeMarkdown(value: string): string {
  return value.replace(/([_*`\[])/g, "\\$1");
}
