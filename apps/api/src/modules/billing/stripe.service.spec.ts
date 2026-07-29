import { BadRequestException } from "@nestjs/common";
import type Stripe from "stripe";
import { StripeService } from "./stripe.service";

/**
 * `StripeService` never receives a real Stripe SDK instance in these tests.
 * The client is built lazily behind a private getter that only reads
 * `STRIPE_SECRET_KEY` the first time it's touched, so poking the private
 * field directly swaps in a mock before that getter ever runs — the tests
 * below never need a real (or fake) secret key configured.
 */
function makeStripeMock() {
  return {
    products: { create: jest.fn() },
    prices: { create: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
    subscriptions: { retrieve: jest.fn() },
    webhooks: { constructEvent: jest.fn() }
  };
}

function makeService(prismaOverrides: Record<string, unknown> = {}) {
  const prisma = {
    plan: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn()
    },
    businessSubscription: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({})
    },
    ...prismaOverrides
  };

  const cache = { invalidate: jest.fn().mockResolvedValue(undefined) };
  const stripe = makeStripeMock();

  const service = new StripeService(prisma as never, cache as never);
  // Bypass the lazy getter's STRIPE_SECRET_KEY check entirely.
  (service as unknown as { stripeClient: unknown }).stripeClient = stripe;

  return { service, prisma, cache, stripe };
}

const subscriptionFixture = (overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription =>
  ({
    id: "sub_123",
    status: "active",
    customer: "cus_123",
    cancel_at_period_end: false,
    metadata: {},
    items: { data: [{ current_period_end: 1_700_000_000 }] },
    ...overrides
  }) as unknown as Stripe.Subscription;

describe("StripeService.verifyWebhookEvent", () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it("rejects every request when STRIPE_WEBHOOK_SECRET is empty, without touching the Stripe SDK", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "";
    const { service, stripe } = makeService();

    expect(() => service.verifyWebhookEvent(Buffer.from("{}"), "sig_whatever")).toThrow(BadRequestException);
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it("rejects a request with no Stripe-Signature header", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const { service, stripe } = makeService();

    expect(() => service.verifyWebhookEvent(Buffer.from("{}"), undefined)).toThrow(BadRequestException);
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it("rejects a badly-signed payload", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const { service, stripe } = makeService();
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    expect(() => service.verifyWebhookEvent(Buffer.from("{}"), "sig_bad")).toThrow(BadRequestException);
  });

  it("returns the parsed event once the signature checks out", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const { service, stripe } = makeService();
    const fakeEvent = { id: "evt_1", type: "checkout.session.completed" } as Stripe.Event;
    stripe.webhooks.constructEvent.mockReturnValue(fakeEvent);

    const result = service.verifyWebhookEvent(Buffer.from("{}"), "sig_good");

    expect(result).toBe(fakeEvent);
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(expect.any(Buffer), "sig_good", "whsec_test");
  });
});

describe("StripeService.handleEvent — checkout.session.completed", () => {
  it("activates the right business's subscription", async () => {
    const { service, prisma, stripe } = makeService();
    stripe.subscriptions.retrieve.mockResolvedValue(subscriptionFixture());

    const event = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          metadata: { businessId: "biz_1", tier: "pro" },
          client_reference_id: "biz_1",
          subscription: "sub_123"
        }
      }
    } as unknown as Stripe.Event;

    await service.handleEvent(event);

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_123");
    expect(prisma.businessSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "biz_1" },
        update: expect.objectContaining({
          plan: "pro",
          status: "active",
          provider: "stripe",
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123"
        }),
        create: expect.objectContaining({
          businessId: "biz_1",
          plan: "pro",
          status: "active",
          provider: "stripe"
        })
      })
    );
  });

  it("applying the same event twice is idempotent", async () => {
    const { service, prisma, stripe } = makeService();
    stripe.subscriptions.retrieve.mockResolvedValue(subscriptionFixture());

    const event = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          metadata: { businessId: "biz_1", tier: "pro" },
          client_reference_id: "biz_1",
          subscription: "sub_123"
        }
      }
    } as unknown as Stripe.Event;

    await service.handleEvent(event);
    await service.handleEvent(event);

    expect(prisma.businessSubscription.upsert).toHaveBeenCalledTimes(2);
    // Same event applied twice must resolve to the same final row, not an
    // accumulating one — the two upsert calls carry identical data.
    const [firstCall, secondCall] = prisma.businessSubscription.upsert.mock.calls;
    expect(firstCall).toEqual(secondCall);
  });

  it("ignores an event missing businessId/tier/subscription instead of throwing", async () => {
    const { service, prisma, stripe } = makeService();

    const event = {
      id: "evt_2",
      type: "checkout.session.completed",
      data: { object: { mode: "subscription", metadata: {}, client_reference_id: null, subscription: null } }
    } as unknown as Stripe.Event;

    await expect(service.handleEvent(event)).resolves.toBeUndefined();
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(prisma.businessSubscription.upsert).not.toHaveBeenCalled();
  });
});

describe("StripeService.handleEvent — customer.subscription.updated/deleted", () => {
  it("resolves the business from subscription metadata and maps status", async () => {
    const { service, prisma } = makeService();

    const event = {
      id: "evt_3",
      type: "customer.subscription.deleted",
      data: { object: subscriptionFixture({ status: "canceled", metadata: { businessId: "biz_9", tier: "max" } }) }
    } as unknown as Stripe.Event;

    await service.handleEvent(event);

    expect(prisma.businessSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "biz_9" },
        update: expect.objectContaining({ plan: "max", status: "canceled" })
      })
    );
  });

  it("falls back to the stored business when metadata is absent", async () => {
    const { service, prisma } = makeService({
      businessSubscription: {
        findUnique: jest.fn().mockResolvedValue({ businessId: "biz_legacy", plan: "pro" }),
        upsert: jest.fn().mockResolvedValue({})
      }
    });

    const event = {
      id: "evt_4",
      type: "customer.subscription.updated",
      data: { object: subscriptionFixture({ metadata: {} }) }
    } as unknown as Stripe.Event;

    await service.handleEvent(event);

    expect(prisma.businessSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: "biz_legacy" } })
    );
  });

  it("ignores a subscription it cannot resolve to any business", async () => {
    const { service, prisma } = makeService();

    const event = {
      id: "evt_5",
      type: "customer.subscription.updated",
      data: { object: subscriptionFixture({ metadata: {} }) }
    } as unknown as Stripe.Event;

    await service.handleEvent(event);

    expect(prisma.businessSubscription.upsert).not.toHaveBeenCalled();
  });
});

describe("StripeService.createCheckoutSession", () => {
  it("fails cleanly, without calling Stripe, when the tier has no stripePriceId", async () => {
    const { service, stripe } = makeService({
      plan: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ tier: "pro", isActive: true, stripePriceId: null }),
        update: jest.fn()
      }
    });

    await expect(
      service.createCheckoutSession({
        business: { id: "biz_1", slug: "caravan-coffee" },
        tier: "pro",
        locale: "en",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel"
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejects the free tier before ever consulting the Plan table", async () => {
    const { service, prisma, stripe } = makeService();

    await expect(
      service.createCheckoutSession({
        business: { id: "biz_1", slug: "caravan-coffee" },
        tier: "free",
        locale: "en",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel"
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.plan.findUnique).not.toHaveBeenCalled();
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("creates a session from the server-resolved price, ignoring any client-supplied price", async () => {
    const { service, stripe } = makeService({
      plan: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ tier: "pro", isActive: true, stripePriceId: "price_pro_123" }),
        update: jest.fn()
      }
    });
    stripe.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.com/session_1" });

    const result = await service.createCheckoutSession({
      business: { id: "biz_1", slug: "caravan-coffee" },
      tier: "pro",
      locale: "ru",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel"
    });

    expect(result).toEqual({ url: "https://checkout.stripe.com/session_1" });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_pro_123", quantity: 1 }],
        client_reference_id: "biz_1",
        metadata: { businessId: "biz_1", tier: "pro" }
      })
    );
  });
});

describe("StripeService.syncPlans", () => {
  it("is idempotent — a plan with a stripePriceId already set is left untouched", async () => {
    const { service, prisma, stripe } = makeService({
      plan: {
        findMany: jest.fn().mockResolvedValue([
          { id: "plan_1", tier: "pro", nameEn: "Pro", priceMonthlyUsdCents: 7900, stripePriceId: "price_existing" }
        ]),
        findUnique: jest.fn(),
        update: jest.fn()
      }
    });

    const result = await service.syncPlans();

    expect(result).toEqual([{ tier: "pro", stripePriceId: "price_existing", created: false }]);
    expect(stripe.products.create).not.toHaveBeenCalled();
    expect(prisma.plan.update).not.toHaveBeenCalled();
  });

  it("creates a Product + Price and persists the id for a plan not yet synced", async () => {
    const { service, prisma, stripe } = makeService({
      plan: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "plan_2", tier: "max", nameEn: "Max", priceMonthlyUsdCents: 15900, stripePriceId: null }]),
        findUnique: jest.fn(),
        update: jest.fn()
      }
    });
    stripe.products.create.mockResolvedValue({ id: "prod_1" });
    stripe.prices.create.mockResolvedValue({ id: "price_new" });

    const result = await service.syncPlans();

    expect(stripe.products.create).toHaveBeenCalledWith(expect.objectContaining({ name: expect.stringContaining("Max") }));
    expect(stripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "usd", unit_amount: 15900, product: "prod_1", recurring: { interval: "month" } })
    );
    expect(prisma.plan.update).toHaveBeenCalledWith({ where: { id: "plan_2" }, data: { stripePriceId: "price_new" } });
    expect(result).toEqual([{ tier: "max", stripePriceId: "price_new", created: true }]);
  });
});
