import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Only `pro`/`max` are accepted — `free` has no `stripePriceId` and is
 * handled by the existing free-plan path, not Stripe Checkout. This also
 * means a client can only ever select a tier, never a price: the actual
 * Stripe Price id is looked up server-side from the Plan row in
 * `StripeService.createCheckoutSession`.
 */
export class CreateCheckoutSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  businessSlug!: string;

  @IsIn(["pro", "max"], { message: "tier must be one of: pro, max" })
  tier!: "pro" | "max";

  @IsOptional()
  @IsIn(["uz", "ru", "en"])
  locale?: "uz" | "ru" | "en";
}
