import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import type { BusinessEventType } from "@prisma/client";

/**
 * Client-reported funnel event.
 *
 * `type` is restricted to the `BusinessEventType` enum values — an unvalidated
 * string would fail at the database layer as a 500 instead of a 400, and would
 * let a caller pollute the funnel with invented stage names.
 */
export class RecordEventDto {
  @IsIn(["view", "call", "directions", "message", "photo_view"], {
    message: "type must be one of: view, call, directions, message, photo_view"
  })
  type!: BusinessEventType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  source?: string;
}
