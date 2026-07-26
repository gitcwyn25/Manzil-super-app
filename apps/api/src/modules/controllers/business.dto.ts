import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";

/** Nested localized description. Validated so `description` cannot arrive as a string or array. */
export class LocalizedTextDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  uz?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  ru?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  en?: string;
}

/**
 * Owner-editable business fields.
 *
 * The allowlist here is the security boundary: `updateBusiness` passes these
 * straight into `prisma.business.update`. Fields absent from this DTO —
 * `status`, `ownerId`, `verifiedAt`, `avgRating` — are stripped by the global
 * pipe's `whitelist` and rejected by `forbidNonWhitelisted`, so an owner cannot
 * self-approve a listing or reassign ownership through this endpoint.
 */
export class BusinessUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto;

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
  @MaxLength(500)
  hours?: string;

  @IsOptional()
  @IsIn(["$", "$$", "$$$"])
  priceTier?: "$" | "$$" | "$$$";

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
}

export class ReviewCreateDto {
  /**
   * Integer 1-5. Previously coerced with `Number(body.rating)`, which turns
   * `"abc"` into NaN and `[]` into 0 — both of which would reach the database.
   */
  @IsInt({ message: "rating must be a whole number between 1 and 5" })
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(1, { message: "Review text cannot be empty" })
  @MaxLength(5000)
  text!: string;
}
