import { IsIn, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export const WAITLIST_TRANSITION_STATUSES = [
  "contacted",
  "qualified",
  "accepted",
  "rejected",
  "duplicate"
] as const;

export type WaitlistTransitionStatus = (typeof WAITLIST_TRANSITION_STATUSES)[number];

export class WaitlistTransitionDto {
  @IsIn(WAITLIST_TRANSITION_STATUSES)
  status!: WaitlistTransitionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @IsOptional()
  @IsISO8601()
  expectedUpdatedAt?: string;
}

export class WaitlistAssignmentDto {
  /** Null clears an assignment; omitted is rejected by the controller as no-op input. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  adminId?: string | null;

  @IsOptional()
  @IsISO8601()
  expectedUpdatedAt?: string;
}

export class WaitlistCompanyConnectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  businessId!: string;

  /** A connection is a consequential CRM link, so the operator must explain it. */
  @IsString()
  @MinLength(10, { message: "A connection reason of at least 10 characters is required" })
  @MaxLength(2000)
  reason!: string;

  @IsOptional()
  @IsISO8601()
  expectedUpdatedAt?: string;
}

export class WaitlistEmailDraftDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(12000)
  body?: string;
}

export class OutboxRetryDto {
  @IsString()
  @MinLength(10, { message: "A retry reason of at least 10 characters is required" })
  @MaxLength(2000)
  reason!: string;
}

export class SignatureProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;
}
