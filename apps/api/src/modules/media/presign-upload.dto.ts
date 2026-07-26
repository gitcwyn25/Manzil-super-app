import { IsIn, IsInt, IsString, Max, Min, MaxLength } from "class-validator";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MIN_IMAGE_BYTES } from "./upload-policy";

export class PresignUploadDto {
  @IsIn(["business", "review"], { message: 'ownerType must be "business" or "review"' })
  ownerType!: "business" | "review";

  @IsString()
  @MaxLength(200)
  ownerId!: string;

  /**
   * Validated against the MIME allowlist rather than the file name. The stored
   * object's extension is derived from this value, so a mismatched or spoofed
   * file name cannot influence what gets written.
   */
  @IsIn(Object.keys(ALLOWED_IMAGE_TYPES), {
    message: `contentType must be one of: ${Object.keys(ALLOWED_IMAGE_TYPES).join(", ")}`
  })
  contentType!: string;

  /**
   * Declared size, signed into the presigned URL so the actual upload cannot
   * exceed it. Without a cap the URL authorises an unbounded write.
   */
  @IsInt()
  @Min(MIN_IMAGE_BYTES)
  @Max(MAX_IMAGE_BYTES, {
    message: `File exceeds the ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))}MB limit`
  })
  contentLength!: number;
}
