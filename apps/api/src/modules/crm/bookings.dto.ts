import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

/**
 * Shape validation for the bookings surface — see the comment atop crm.dto.ts
 * for the shape-vs-meaning split this codebase follows. `endsAt > startsAt`
 * and phone/service non-blankness after trimming are *meaning*, checked in
 * BookingsRepository instead.
 */

const TRIMMED = { message: "Value cannot be blank" };

export class CreateBookingDto {
  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(200)
  serviceName!: string;

  @IsString()
  @MinLength(1, TRIMMED)
  @MaxLength(32)
  customerPhone!: string;

  @IsISO8601({}, { message: "startsAt must be an ISO-8601 date string" })
  startsAt!: string;

  @IsOptional()
  @IsISO8601({}, { message: "endsAt must be an ISO-8601 date string" })
  endsAt?: string;

  /** A reference figure only — not a real charge unless a Payment is later attached. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000_000)
  depositAmount?: number;
}

const BOOKING_STATUSES = ["pending", "confirmed", "canceled", "completed", "no_show"] as const;

export class SetBookingStatusDto {
  @IsIn(BOOKING_STATUSES, {
    message: `status must be one of: ${BOOKING_STATUSES.join(", ")}`
  })
  status!: (typeof BOOKING_STATUSES)[number];
}
