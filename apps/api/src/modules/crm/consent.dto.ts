import { IsBoolean } from "class-validator";

export class SetConsentDto {
  /**
   * Explicit boolean, never inferred.
   *
   * Consent must be an affirmative act under Uzbek personal data law, so the
   * caller has to state it — there is no "default true" path into this field,
   * and withdrawal (false) is equally explicit.
   */
  @IsBoolean()
  consentMarketing!: boolean;
}
