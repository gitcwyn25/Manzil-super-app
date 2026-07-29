import { ServiceUnavailableException } from "@nestjs/common";

/** DI token. Lets the concrete backend (R2, Supabase, or neither) be swapped without touching `MediaController`. */
export const MEDIA_STORAGE = "MEDIA_STORAGE";

export interface PresignUploadOptions {
  contentType: string;
  contentLength: number;
  /** Only R2 currently honours this — Supabase's signed-upload token has a fixed, non-configurable TTL. */
  expiresSeconds?: number;
}

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string | null;
  requiredHeaders: Record<string, string>;
}

/**
 * A media storage backend capable of presigning a direct-from-browser upload.
 *
 * Both `R2PresignService` and `SupabaseStorageService` implement this with the
 * exact same return shape, so `MediaController` never needs to know which one
 * answered a given request — see `media-storage.provider.ts` for how the
 * concrete instance is chosen.
 */
export interface MediaStorage {
  readonly isConfigured: boolean;
  presignUpload(storageKey: string, options: PresignUploadOptions): Promise<PresignedUpload>;
}

/**
 * Fallback used when neither R2 nor Supabase is configured.
 *
 * The error message deliberately names both options — a business owner (or a
 * future maintainer reading a Sentry report) should not be pointed at
 * Cloudflare alone when Supabase is the easier path to get unblocked.
 */
export class UnconfiguredMediaStorage implements MediaStorage {
  readonly isConfigured = false;

  async presignUpload(): Promise<PresignedUpload> {
    throw new ServiceUnavailableException(
      "Media storage is not configured. Set either CLOUDFLARE_R2_* or SUPABASE_* environment variables."
    );
  }
}
