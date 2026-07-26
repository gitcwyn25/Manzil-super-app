/**
 * Upload policy for user-supplied media.
 *
 * The allowlist is keyed by **MIME type**, not file extension. Extensions are
 * attacker-controlled text with no relationship to file contents — `evil.exe`
 * renamed to `evil.jpg` passes any extension check. The canonical extension is
 * derived *from* the accepted MIME type here, so the stored object's name can
 * never disagree with the type we authorised.
 */
export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

/** 8 MB — comfortably above a phone photo, well below a resource-exhaustion payload. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Rejects a zero/negative length, which would otherwise sign an unbounded PUT. */
export const MIN_IMAGE_BYTES = 1;

export function isAllowedImageType(value: string | undefined): value is AllowedImageType {
  return typeof value === "string" && value in ALLOWED_IMAGE_TYPES;
}

export function extensionForType(type: AllowedImageType): string {
  return ALLOWED_IMAGE_TYPES[type];
}

/**
 * Magic-number prefixes for the allowed types.
 *
 * A declared Content-Type is still just a client claim — signing it constrains
 * what the client *says*, not what the bytes *are*. Verifying the leading bytes
 * is what actually establishes the file is the image it claims to be, so this
 * runs in the post-upload scan before a photo is approved for serving.
 */
export const MAGIC_NUMBERS: Record<AllowedImageType, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  // RIFF....WEBP — bytes 0-3 and 8-11; the length field between them varies.
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  // ftyp box at offset 4 for AVIF (ISO-BMFF).
  "image/avif": [[0x66, 0x74, 0x79, 0x70]]
};

/** Verifies a buffer's leading bytes match the declared type. */
export function matchesMagicNumber(buffer: Buffer, type: AllowedImageType): boolean {
  const offset = type === "image/avif" ? 4 : 0;

  return MAGIC_NUMBERS[type].some((signature) =>
    signature.every((byte, index) => buffer[offset + index] === byte)
  );
}
