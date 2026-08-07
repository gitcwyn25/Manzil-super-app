import { BadRequestException, Body, Controller, Headers, Post, Req, UseGuards } from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { requireOwnedBusiness } from "../crm/business-ownership.util";
import { NoIdempotency } from "../idempotency";
import { PrismaService } from "../prisma.service";
import { ThrottleWebhook, ThrottleWrite } from "../security/throttle.config";
import { CreateCheckoutSessionDto } from "./billing.dto";
import { StripeService } from "./stripe.service";

/** Minimal shape we need off the request — just the raw body Nest attaches when `rawBody: true`. */
type RawBodyCarrier = { rawBody?: Buffer };

function resolveWebOrigin(): string {
  const first = (process.env.WEB_ORIGIN ?? "").split(",")[0]?.trim();
  return first && first.length > 0 ? first : "http://localhost:3000";
}

@Controller("billing")
export class BillingController {
  constructor(
    private readonly stripe: StripeService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Starts a Stripe Checkout subscription upgrade. Authenticated, and the
   * caller must own the business — `requireOwnedBusiness` throws otherwise.
   * The price is resolved server-side from `Plan.stripePriceId`; nothing from
   * the client ever reaches Stripe as a price or amount.
   */
  @Post("checkout")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  @ThrottleWrite()
  async checkout(@Body() body: CreateCheckoutSessionDto, @Req() request: ManzilRequest) {
    const business = await requireOwnedBusiness(this.prisma, body.businessSlug, request.manzilActor!);
    const locale = body.locale ?? "uz";
    const webOrigin = resolveWebOrigin();

    const { url } = await this.stripe.createCheckoutSession({
      business,
      tier: body.tier,
      locale,
      successUrl: `${webOrigin}/${locale}/dashboard?billing=success`,
      cancelUrl: `${webOrigin}/${locale}/dashboard?billing=cancelled`
    });

    return { data: { url } };
  }

  /**
   * Stripe webhook receiver. Deliberately outside `ManzilAuthGuard` — Stripe
   * cannot authenticate as a Manzil user — and outside the DTO/whitelist
   * pipe, since the payload is Stripe's, not ours to shape. The signature
   * check inside `verifyWebhookEvent` is what stands in for auth here.
   */
  @Post("webhook")
  @ThrottleWebhook()
  // Stripe has its own redelivery contract keyed on the event id, and the
  // signature is computed over the exact bytes; a second deduplication scheme
  // layered on top could only ever disagree with the first.
  @NoIdempotency()
  async webhook(@Req() request: RawBodyCarrier, @Headers("stripe-signature") signature?: string) {
    if (!request.rawBody) {
      // Only reachable if `rawBody: true` were ever removed from main.ts —
      // fail loudly rather than let signature verification run against `{}`.
      throw new BadRequestException("Raw request body is unavailable");
    }

    const event = this.stripe.verifyWebhookEvent(request.rawBody, signature);
    await this.stripe.handleEvent(event);

    return { data: { received: true } };
  }
}
