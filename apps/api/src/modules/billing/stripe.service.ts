import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";

const PURCHASABLE_TIERS: PlanTier[] = ["pro", "max"];

/** Stripe Checkout only supports a subset of locales; anything else falls back to `auto`. */
const STRIPE_CHECKOUT_LOCALES: Record<string, Stripe.Checkout.SessionCreateParams.Locale> = {
  ru: "ru",
  en: "en"
};

export type CreateCheckoutSessionInput = {
  business: { id: string; slug: string };
  tier: PlanTier;
  locale: string;
  successUrl: string;
  cancelUrl: string;
};

/**
 * Stripe integration for subscription billing.
 *
 * The Stripe client is constructed lazily (not in the constructor) so that a
 * missing `STRIPE_SECRET_KEY` only breaks the billing routes that actually use
 * it, rather than crashing app bootstrap the moment this provider is
 * instantiated.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripeClient: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  private get stripe(): Stripe {
    if (!this.stripeClient) {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured — Stripe billing is unavailable");
      }
      this.stripeClient = new Stripe(secretKey);
    }
    return this.stripeClient;
  }

  /* ------------------------------------------------------------------ */
  /* Product/price sync                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Mirrors every active, USD-priced Plan into a Stripe Product + recurring
   * monthly Price, and persists the resulting Price id.
   *
   * Idempotent: a plan whose `stripePriceId` is already set is left untouched
   * — re-running never creates a second Product/Price for the same tier.
   */
  async syncPlans(): Promise<Array<{ tier: PlanTier; stripePriceId: string; created: boolean }>> {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true, priceMonthlyUsdCents: { not: null } }
    });

    const results: Array<{ tier: PlanTier; stripePriceId: string; created: boolean }> = [];

    for (const plan of plans) {
      if (plan.stripePriceId) {
        results.push({ tier: plan.tier, stripePriceId: plan.stripePriceId, created: false });
        continue;
      }

      // Filtered by the query above, but narrowed again here for TypeScript —
      // `priceMonthlyUsdCents` is nullable on the model.
      const amount = plan.priceMonthlyUsdCents;
      if (!amount) continue;

      const product = await this.stripe.products.create({
        name: `Manzil — ${plan.nameEn}`,
        metadata: { planTier: plan.tier }
      });

      const price = await this.stripe.prices.create({
        currency: "usd",
        unit_amount: amount,
        recurring: { interval: "month" },
        product: product.id,
        metadata: { planTier: plan.tier }
      });

      await this.prisma.plan.update({
        where: { id: plan.id },
        data: { stripePriceId: price.id }
      });

      this.logger.log(`Synced Stripe price for plan '${plan.tier}': ${price.id}`);
      results.push({ tier: plan.tier, stripePriceId: price.id, created: true });
    }

    return results;
  }

  /* ------------------------------------------------------------------ */
  /* Checkout                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Creates a Stripe Checkout session for a subscription upgrade.
   *
   * The price charged is always looked up server-side from the Plan row for
   * `input.tier` — a client can select a tier, never a price or amount. A
   * tier with no `stripePriceId` (not yet synced, or the free tier) fails
   * with a 400 rather than silently creating an unpriced session.
   */
  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<{ url: string }> {
    if (!PURCHASABLE_TIERS.includes(input.tier)) {
      throw new BadRequestException(`Plan '${input.tier}' is not purchasable`);
    }

    const plan = await this.prisma.plan.findUnique({ where: { tier: input.tier } });

    if (!plan || !plan.isActive || !plan.stripePriceId) {
      throw new BadRequestException(`Plan '${input.tier}' is not available for purchase`);
    }

    // Reuse the existing Stripe customer for this business, if one exists, so
    // a plan change does not fragment billing history across two customers.
    const existing = await this.prisma.businessSubscription.findUnique({
      where: { businessId: input.business.id },
      select: { stripeCustomerId: true }
    });

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      client_reference_id: input.business.id,
      customer: existing?.stripeCustomerId ?? undefined,
      locale: STRIPE_CHECKOUT_LOCALES[input.locale] ?? "auto",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { businessId: input.business.id, tier: input.tier },
      subscription_data: {
        metadata: { businessId: input.business.id, tier: input.tier }
      }
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL");
    }

    return { url: session.url };
  }

  /* ------------------------------------------------------------------ */
  /* Webhook                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Verifies the Stripe-Signature header against the raw request body.
   *
   * This is the security boundary of the whole webhook: without it, anyone
   * who can reach this route can POST a forged `checkout.session.completed`
   * and grant their business a paid plan for free. There is deliberately no
   * fallback path that trusts an unverified payload — a missing or empty
   * `STRIPE_WEBHOOK_SECRET` always rejects, it never "passes through".
   */
  verifyWebhookEvent(rawBody: Buffer, signatureHeader: string | string[] | undefined): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.error(
        "STRIPE_WEBHOOK_SECRET is not configured — rejecting webhook request rather than trusting an unverified payload"
      );
      throw new BadRequestException("Webhook is not configured");
    }

    if (!signatureHeader || Array.isArray(signatureHeader)) {
      throw new BadRequestException("Missing Stripe-Signature header");
    }

    try {
      return this.stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
    } catch (error) {
      this.logger.warn(`Stripe webhook signature verification failed: ${(error as Error).message}`);
      throw new BadRequestException("Invalid Stripe signature");
    }
  }

  /**
   * Applies a verified Stripe event to `BusinessSubscription`.
   *
   * Idempotent by construction: every branch ends in an `upsert` keyed on
   * `businessId` (unique) that writes the *current* state described by the
   * event, rather than incrementing or appending anything. Stripe redelivers
   * events on retry and may deliver the same event more than once; replaying
   * this method with the same event therefore always lands on the same final
   * row instead of double-applying an effect.
   */
  async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription") {
          return;
        }

        const businessId = session.metadata?.businessId ?? session.client_reference_id ?? undefined;
        const tier = session.metadata?.tier as PlanTier | undefined;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (!businessId || !isPlanTier(tier) || !subscriptionId) {
          this.logger.warn(
            `checkout.session.completed (event ${event.id}) is missing businessId/tier/subscription — ignored`
          );
          return;
        }

        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        await this.upsertFromStripeSubscription(businessId, tier, subscription);
        return;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const resolved = await this.resolveBusinessAndTier(subscription, event.id);

        if (!resolved) {
          return;
        }

        await this.upsertFromStripeSubscription(resolved.businessId, resolved.tier, subscription);
        return;
      }

      default:
        return;
    }
  }

  /**
   * Subscription events don't carry `businessId`/`tier` unless we put them
   * there. We do, in `subscription_data.metadata` at checkout creation time,
   * so this is the expected path; the DB lookup by `stripeSubscriptionId` is
   * only a fallback for a subscription created before metadata existed.
   */
  private async resolveBusinessAndTier(
    subscription: Stripe.Subscription,
    eventId: string
  ): Promise<{ businessId: string; tier: PlanTier } | null> {
    const metaBusinessId = subscription.metadata?.businessId;
    const metaTier = subscription.metadata?.tier as PlanTier | undefined;

    if (metaBusinessId && isPlanTier(metaTier)) {
      return { businessId: metaBusinessId, tier: metaTier };
    }

    const existing = await this.prisma.businessSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (!existing) {
      this.logger.warn(
        `Cannot resolve a business for Stripe subscription ${subscription.id} (event ${eventId}) — ignored`
      );
      return null;
    }

    return {
      businessId: existing.businessId,
      tier: isPlanTier(metaTier) ? metaTier : existing.plan
    };
  }

  private async upsertFromStripeSubscription(
    businessId: string,
    tier: PlanTier,
    subscription: Stripe.Subscription
  ): Promise<void> {
    const status = mapStripeSubscriptionStatus(subscription.status);
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const periodEndSeconds = subscription.items.data[0]?.current_period_end;
    const currentPeriodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000) : null;

    await this.prisma.businessSubscription.upsert({
      where: { businessId },
      update: {
        plan: tier,
        status,
        provider: "stripe",
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd,
        renewsAt: currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      },
      create: {
        businessId,
        plan: tier,
        status,
        provider: "stripe",
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd,
        renewsAt: currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });

    // Entitlements are cached per business (see PlansRepository) — without
    // this, a Stripe upgrade/downgrade would not take effect until that
    // cache entry expires on its own.
    await this.cache.invalidate("plans");
  }
}

function isPlanTier(value: unknown): value is PlanTier {
  return value === "free" || value === "pro" || value === "max";
}

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "invoice_pending";
    case "canceled":
    case "incomplete_expired":
    case "paused":
    default:
      return "canceled";
  }
}
