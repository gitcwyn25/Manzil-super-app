import {
  IsBoolean,
  IsIn,
  IsInt,
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
 * DTOs for review, claim, and admin/console moderation bodies.
 *
 * Length caps matter here beyond type safety: `reason` and `text` are persisted
 * and rendered back in the admin console and business dashboard, so an
 * unbounded field is both a storage and a rendering hazard.
 */

export class ReviewReplyDto {
  @IsString()
  @MinLength(1, { message: "Reply text cannot be empty" })
  @MaxLength(3000)
  text!: string;
}

export class ReportReviewDto {
  @IsString()
  @MinLength(1, { message: "A reason is required" })
  @MaxLength(1000)
  reason!: string;
}

/** Ownership claim on an existing listing. Mirrors `ClaimRequest` in @manzil/shared. */
export class ClaimCreateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessSlug?: string;

  @IsString()
  @MinLength(1, { message: "Business name is required" })
  @MaxLength(200)
  businessName!: string;

  @IsString()
  @MinLength(1, { message: "Owner name is required" })
  @MaxLength(200)
  ownerName!: string;

  @IsString()
  @MinLength(1, { message: "Phone is required" })
  @MaxLength(40)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

/** Optional free-text note attached to a claim rejection. */
export class RejectClaimDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class ResolveReportDto {
  @IsOptional()
  @IsIn(["pending", "approved", "rejected"])
  moderationStatus?: "pending" | "approved" | "rejected";
}

/**
 * Destructive admin actions. `reason` stays optional at the DTO layer because
 * `requireReason()` in the repository enforces the >=10 character rule and
 * owns that error message — duplicating the threshold here would let the two
 * drift apart.
 */
export class AdminReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

export class MergeBusinessDto {
  @IsString()
  @MaxLength(200)
  targetId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

export class SetPlanFeatureDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  key!: string;

  @IsOptional()
  @IsBoolean()
  included?: boolean;
}

/**
 * Admin business edit. The repository already allowlists these same keys before
 * touching Prisma; declaring them here moves the rejection to the edge and adds
 * the type checking the allowlist loop does not do (it copies values verbatim,
 * so `name: {}` would reach the database driver).
 */
export class ConsoleBusinessEditDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

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
  @IsIn(["$", "$$", "$$$"])
  priceTier?: "$" | "$$" | "$$$";
}

/** Dynamic pricing update. Bounds mirror the repository's own price guard. */
export class PlanUpdateDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  priceMonthly?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  priceYearly?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameUz?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameRu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameEn?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  photoLimit?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  staffLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  locationLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
