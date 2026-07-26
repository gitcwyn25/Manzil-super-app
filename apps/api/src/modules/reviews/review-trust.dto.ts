import { IsString, MaxLength, MinLength } from "class-validator";

export class LinkBookingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  bookingId!: string;
}
