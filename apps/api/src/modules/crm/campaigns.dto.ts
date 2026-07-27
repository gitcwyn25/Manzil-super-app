import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateCampaignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsIn(["welcome", "win_back", "birthday", "review_request"])
  trigger!: "welcome" | "win_back" | "birthday" | "review_request";

  @IsIn(["telegram", "sms"], {
    // Email is deliberately absent: in Uzbekistan the reachable channels are
    // Telegram and SMS, and offering email would create a channel nobody reads.
    message: "channel must be telegram or sms"
  })
  channel!: "telegram" | "sms";

  /** SMS is billed per segment, so an unbounded template is a cost bug as much as a UX one. */
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  template!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  windowDays?: number;
}

export class SetCampaignActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
