/**
 * One-off sync: mirrors the pro/max plans into Stripe (Product + recurring
 * monthly Price in USD) and persists the resulting Price id onto the Plan
 * row, then sets `priceMonthlyUsdCents` for pro/max if it isn't already set.
 *
 * Idempotent — safe to re-run. A plan whose `stripePriceId` is already set is
 * left untouched by `StripeService.syncPlans()` (see its docstring), and the
 * `priceMonthlyUsdCents` update below just re-writes the same constant.
 *
 * Run from the repo root (so the API's env loader finds the root `.env`):
 *
 *   npm run sync:stripe-plans --workspace @manzil/api
 *
 * Requires STRIPE_SECRET_KEY to be set in the root `.env`. Does not touch
 * STRIPE_WEBHOOK_SECRET or anything else.
 */
import { loadEnv } from "../src/env";

loadEnv();

// Must be imported before anything decorated with @Injectable() — that
// decorator calls Reflect.defineMetadata, which only exists once this
// polyfill has run. main.ts does the same thing in the same order.
import "reflect-metadata";
import { CacheService } from "../src/modules/cache/cache.service";
import { PrismaService } from "../src/modules/prisma.service";
import { StripeService } from "../src/modules/billing/stripe.service";

// Set on the DB in the task brief: free stays purchasable-null.
const USD_CENTS_BY_TIER: Record<"pro" | "max", number> = {
  pro: 7900,
  max: 15900
};

async function main() {
  if (!process.env.STRIPE_RESTRICTED_KEY && !process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "No Stripe API key set — set STRIPE_RESTRICTED_KEY (preferred) or STRIPE_SECRET_KEY in the root .env before running this script."
    );
  }

  const prisma = new PrismaService();
  const cache = new CacheService();
  const stripe = new StripeService(prisma, cache);

  try {
    await prisma.$connect();

    for (const [tier, cents] of Object.entries(USD_CENTS_BY_TIER) as Array<["pro" | "max", number]>) {
      await prisma.plan.update({
        where: { tier },
        data: { priceMonthlyUsdCents: cents }
      });
      console.log(`Set priceMonthlyUsdCents=${cents} for plan '${tier}'`);
    }

    const results = await stripe.syncPlans();

    console.log("\nStripe plan sync results:");
    console.table(results);

    const created = results.filter((r) => r.created).length;
    console.log(`\nDone. ${created} new Stripe Price(s) created, ${results.length - created} already up to date.`);
  } finally {
    // Without this the script hangs on the open Postgres/Redis sockets
    // instead of exiting once the sync is done.
    await prisma.$disconnect().catch(() => undefined);
    await cache.onModuleDestroy().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error("Stripe plan sync failed:", error);
  process.exitCode = 1;
});
