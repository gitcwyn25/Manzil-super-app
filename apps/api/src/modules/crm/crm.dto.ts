import {
  Equals,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

/**
 * Runtime DTOs for the CRM surface.
 *
 * These complement — rather than replace — the semantic checks already in
 * `CrmRepository`. The repository validates *meaning* (does this category
 * exist, is this slug unique); these validate *shape* (is `name` actually a
 * string, is `price` actually a number, are there fields here nobody asked
 * for). TypeScript types erase at runtime, so before this a client could send
 * `{ name: { $ne: null } }` or `price: "free"` and reach the repository with it.
 *
 * With the global pipe's `forbidNonWhitelisted`, any property not declared here
 * is rejected outright — so a client cannot smuggle `status`, `ownerId`, or
 * `verifiedAt` into a create/update and have it reach Prisma.
 */

const TRIMMED = { message: "Value cannot be blank" };

export class BusinessRegistrationDto {
  @IsString()
  @MinLength(2, { message: "Business name must be 2–120 characters" })
  @MaxLength(120, { message: "Business name must be 2–120 characters" })
  name!: string;

  @IsString()
  @MaxLength(120)
  categorySlug!: string;

  @IsString()
  @MinLength(10, { message: "Description must be at least 10 characters" })
  @MaxLength(5000)
  descriptionUz!: string;

  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(300)
  address!: string;

  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(120)
  district!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^https?:\/\/.+\..+/, { message: "Website must be a valid http(s) URL" })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  instagram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  telegram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: "Tax ID (STIR/INN) must be 9 digits" })
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  priceTier?: string;

  /**
   * Terms acknowledgment.
   *
   * `@Equals(true)` rather than `@IsBoolean()`: the requirement is that the
   * business actually agreed, so `false` and a missing field must both be
   * rejected. A merely-boolean field would let the client submit `false` and
   * register without agreeing to anything.
   */
  @Equals(true, {
    message: "You must accept the terms of service and contract to register a business"
  })
  acceptedTerms!: boolean;

  /**
   * Version the user saw. Checked against the currently published version so a
   * form left open across a terms update cannot record acceptance of text the
   * user never read.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  acceptedTermsVersion?: string;
}

export class AnnouncementDto {
  @IsOptional()
  @IsIn(["news", "discount", "broadcast"])
  kind?: "news" | "discount" | "broadcast";

  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsISO8601({}, { message: "startsAt must be an ISO-8601 date string" })
  startsAt?: string;

  @IsOptional()
  @IsISO8601({}, { message: "endsAt must be an ISO-8601 date string" })
  endsAt?: string;

  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";
}

/** PATCH variant: every field optional, same constraints when present. */
export class AnnouncementUpdateDto {
  @IsOptional()
  @IsIn(["news", "discount", "broadcast"])
  kind?: "news" | "discount" | "broadcast";

  @IsOptional()
  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(5000)
  body?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsISO8601({}, { message: "startsAt must be an ISO-8601 date string" })
  startsAt?: string;

  @IsOptional()
  @IsISO8601({}, { message: "endsAt must be an ISO-8601 date string" })
  endsAt?: string;

  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";
}

export class PackageDto {
  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Bounded on both ends: negative prices would invert revenue reporting. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  price!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class PackageUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class ChooseSubscriptionDto {
  @IsOptional()
  @IsIn(["free", "pro", "max"], { message: "plan must be one of: free, pro, max" })
  plan?: "free" | "pro" | "max";
}
