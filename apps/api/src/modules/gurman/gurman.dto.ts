import { IsIn, IsString, Length } from "class-validator";
import type { GurmanLocale } from "./gurman.types";

const GURMAN_LOCALES: GurmanLocale[] = ["uz", "ru", "en"];

/**
 * `Length(1, 500)` caps the query so a caller cannot inflate token cost by
 * stuffing the request — the same rationale as `ThrottleOtpSend`'s "each
 * request costs money", applied to a paid LLM call instead of an SMS.
 */
export class GurmanAskDto {
  @IsString()
  @Length(1, 500)
  query!: string;

  @IsIn(GURMAN_LOCALES, { message: "locale must be one of: uz, ru, en" })
  locale!: GurmanLocale;
}
