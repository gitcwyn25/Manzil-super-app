import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Profile fields a user may set on themselves.
 *
 * Identity (`clerkId`, `userId`, `role`) is deliberately absent: it comes from
 * the verified token in `ManzilAuthGuard`, never from the body. With
 * `forbidNonWhitelisted`, a request that tries to include `role` is now
 * rejected outright rather than silently ignored.
 */
export class SyncUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsIn(["uz", "ru", "en"], { message: "locale must be one of: uz, ru, en" })
  locale?: "uz" | "ru" | "en";
}

export class CreateSessionDto {
  /** Clerk session JWT. Length-capped so an oversized body cannot be used to burn CPU on verification. */
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  token?: string;
}
