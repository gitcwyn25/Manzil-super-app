import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class SetFeaturedDto {
  @IsBoolean()
  featured!: boolean;
}

export class ModeratePhotoDto {
  @IsIn(["approve", "reject"])
  decision!: "approve" | "reject";

  /**
   * Optional here; `requireReason()` in the repository enforces the >=10
   * character rule for rejections and owns that error message, so the
   * threshold is not duplicated (and cannot drift).
   */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

export class PublishLegalDocumentDto {
  @IsIn(["terms_of_service", "privacy_policy", "contract_template"])
  kind!: "terms_of_service" | "privacy_policy" | "contract_template";

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  version!: string;

  @IsOptional()
  @IsIn(["uz", "ru", "en"])
  locale?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  /**
   * Generous cap: this is a full legal document, and truncating one silently
   * would be worse than rejecting an oversized request.
   */
  @IsString()
  @MinLength(1)
  @MaxLength(200_000)
  body!: string;
}

export class UpsertCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  id?: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: "slug may contain only lowercase letters, digits, and hyphens"
  })
  @MaxLength(120)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nameUz!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nameRu!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nameEn!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  parentId?: string | null;
}
