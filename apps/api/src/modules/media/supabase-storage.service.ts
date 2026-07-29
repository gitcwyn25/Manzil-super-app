import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MediaStorage, PresignedUpload, PresignUploadOptions } from "./media-storage";

/**
 * Presigns direct-to-Supabase-Storage uploads with the service-role key.
 *
 * Supabase is already the Postgres provider for this project, so this is the
 * media backend that needs no new account: `createSignedUploadUrl(path)`
 * returns a URL the browser PUTs bytes to, which is the same two-step shape
 * `R2PresignService` already produces (see `MediaStorage`).
 *
 * Unlike R2's SigV4 signature, Supabase's authorisation lives in a token
 * embedded in the URL's query string (verified live against this project:
 * an unauthenticated PUT with no `apikey`/`Authorization` header reached
 * Supabase's "InvalidJWT" check rather than being rejected earlier by the
 * gateway for a missing API key) — so `Content-Length` isn't part of what's
 * signed, and `requiredHeaders` only needs `Content-Type`.
 */
@Injectable()
export class SupabaseStorageService implements MediaStorage {
  private readonly logger = new Logger(SupabaseStorageService.name);

  private readonly url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  private readonly serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  private readonly bucket = process.env.SUPABASE_STORAGE_BUCKET || "business-media";

  private client: SupabaseClient | null = null;

  get isConfigured(): boolean {
    return Boolean(this.url && this.serviceRoleKey);
  }

  /**
   * Constructed lazily (not in the constructor) so a missing service-role key
   * only breaks presigning, not app bootstrap — same reasoning as
   * `StripeService`'s lazy Stripe client.
   *
   * The service-role key lives only in this server-side client; it is never
   * put on the response sent back to the browser.
   */
  private get supabase(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(this.url!, this.serviceRoleKey!, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
    return this.client;
  }

  async presignUpload(storageKey: string, options: PresignUploadOptions): Promise<PresignedUpload> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        "Media storage is not configured. Set either CLOUDFLARE_R2_* or SUPABASE_* environment variables."
      );
    }

    const { contentType } = options;

    const { data, error } = await this.supabase.storage.from(this.bucket).createSignedUploadUrl(storageKey);

    if (error || !data) {
      this.logger.error(`Supabase createSignedUploadUrl failed for '${storageKey}': ${error?.message}`);
      throw new ServiceUnavailableException("Failed to presign the Supabase upload URL");
    }

    // The bucket's public object URL — only correct if the bucket is public,
    // which `scripts/ensure-media-bucket.ts` is what sets up.
    const publicUrl = `${this.url!.replace(/\/$/, "")}/storage/v1/object/public/${this.bucket}/${storageKey}`;

    return {
      uploadUrl: data.signedUrl,
      publicUrl,
      requiredHeaders: {
        "Content-Type": contentType
      }
    };
  }
}
