import { createBot } from "./bot.js";
import { config } from "./config.js";
import { disconnect } from "./data.js";

const bot = createBot();

async function main() {
  const me = await bot.api.getMe();

  console.log(`[bot] running as @${me.username}`);
  console.log(`[bot] admins: ${config.adminIds.length > 0 ? config.adminIds.join(", ") : "NONE — set TELEGRAM_ADMIN_IDS"}`);
  console.log(`[bot] database: ${config.databaseUrl ? "connected" : "not configured (stats disabled)"}`);

  // Long polling. A webhook would need a public HTTPS endpoint; polling works
  // anywhere, including a laptop, which is the right default until the bot has
  // a permanent home.
  await bot.start({
    onStart: () => console.log("[bot] listening for updates")
  });
}

// Graceful stop so in-flight updates finish rather than being dropped mid-reply.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    console.log(`\n[bot] ${signal} received, stopping…`);
    await bot.stop();
    await disconnect();
    process.exit(0);
  });
}

main().catch(async (error) => {
  console.error("[bot] failed to start:", error instanceof Error ? error.message : error);
  await disconnect();
  process.exit(1);
});
