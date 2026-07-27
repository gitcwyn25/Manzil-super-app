import { Bot } from "grammy";
import { config } from "./config.js";

/**
 * One-off configuration of the bot's public presentation.
 *
 * Separate from the runtime because these are account-level settings that only
 * need to change when the copy changes — running them on every boot would burn
 * API calls and risk rate limits for no benefit.
 *
 * Run with: npm run setup
 */
async function main() {
  const bot = new Bot(config.botToken);
  const me = await bot.api.getMe();

  // The command list drives Telegram's "/" autocomplete menu.
  await bot.api.setMyCommands([
    { command: "start", description: "🏠 Bosh menyu" },
    { command: "help", description: "ℹ️ Manzil haqida" },
    { command: "whoami", description: "🆔 Telegram ID ni ko'rsatish" }
  ]);

  // Admin-only commands are scoped to admin chats, so ordinary users never see
  // a command they cannot run.
  for (const adminId of config.adminIds) {
    try {
      await bot.api.setMyCommands(
        [
          { command: "start", description: "🏠 Bosh menyu" },
          { command: "admin", description: "🛠 Admin panel" },
          { command: "help", description: "ℹ️ Manzil haqida" },
          { command: "whoami", description: "🆔 Telegram ID ni ko'rsatish" }
        ],
        { scope: { type: "chat", chat_id: adminId } }
      );
    } catch (error) {
      console.warn(
        `[setup] could not scope admin commands to ${adminId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  await bot.api.setMyDescription(
    "Manzil Business — Toshkentdagi bizneslar uchun platforma. Biznesingizni ro'yxatdan o'tkazing, savol bering va arizangiz holatini kuzating. Gurman yordam beradi 👋"
  );

  await bot.api.setMyShortDescription(
    "Toshkent bizneslari uchun Manzil platformasi. Ro'yxatdan o'ting va mijozlarga yetib boring."
  );

  // Opens the site as a Web App straight from the chat's menu button.
  await bot.api.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "🌐 Manzil",
      web_app: { url: `${config.webUrl}/uz` }
    }
  });

  console.log(`[setup] configured @${me.username}`);
  console.log(`[setup] commands, description, and Web App menu button set`);
  console.log(`[setup] admin-scoped commands for: ${config.adminIds.join(", ") || "none"}`);
}

main().catch((error) => {
  console.error("[setup] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
