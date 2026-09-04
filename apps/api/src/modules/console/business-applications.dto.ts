import { IsOptional, IsString, MaxLength } from "class-validator";

export const BUSINESS_APPLICATION_REVIEW_STATUSES = [
  "under_review",
  "changes_requested",
  "approved",
  "rejected"
] as const;

export type BusinessApplicationReviewStatus = (typeof BUSINESS_APPLICATION_REVIEW_STATUSES)[number];

export class BusinessApplicationDecisionDto {
  /** Required by the repository for changes_requested/rejected; optional for approval. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
