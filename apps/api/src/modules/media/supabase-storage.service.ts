import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MediaStorage, PresignedUpload, PresignUploadOptions } from "./media-storage";

export type BucketStat = {
  name: string;
  public: boolean;
  objectCount: number;
  totalBytes: number;
  /** True if the walk stopped early against `MAX_OBJECTS_PER_BUCKET` or
   * `MAX_LIST_CALLS_PER_BUCKET` — the counts above are a lower bound, not a
   * miscount, for a bucket this large. */
  truncated: boolean;
};

export type StorageOverview = {
  /** False when neither SUPABASE_URL nor SUPABASE_SERVICE_ROLE_KEY is set —
   * the admin console renders "not configured" rather than an error. */
  configured: boolean;
  buckets: BucketStat[];
};

// Safety caps on the recursive bucket walk below — this is an occasional
// admin-console read, not a background job, so it must not turn into an
// unbounded crawl against a bucket with hundreds of thousands of objects.
const MAX_OBJECTS_PER_BUCKET = 5000;
const MAX_LIST_CALLS_PER_BUCKET = 200;
const LIST_PAGE_SIZE = 1000;

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

  /**
   * Every bucket in the project, with an object count and total byte size
   * for each — for the admin console's read-only storage summary. Never
   * returns object contents or download URLs, only counts.
   *
   * Walks each bucket's folder tree via `storage.from(bucket).list()`:
   * Supabase Storage represents a folder as an entry with `id: null` and no
   * `metadata`, so those get queued as a deeper prefix while everything else
   * is counted as a file. Bounded by `MAX_OBJECTS_PER_BUCKET` and
   * `MAX_LIST_CALLS_PER_BUCKET` so one very large bucket can't turn an
   * admin-console page load into an unbounded crawl.
   */
  async getStorageOverview(): Promise<StorageOverview> {
    if (!this.isConfigured) {
      return { configured: false, buckets: [] };
    }

    const { data: buckets, error } = await this.supabase.storage.listBuckets();
    if (error || !buckets) {
      this.logger.error(`Supabase listBuckets failed: ${error?.message}`);
      return { configured: true, buckets: [] };
    }

    const stats = await Promise.all(
      buckets.map(async (bucket) => {
        const { objectCount, totalBytes, truncated } = await this.countBucketObjects(bucket.name);
        return { name: bucket.name, public: bucket.public, objectCount, totalBytes, truncated };
      })
    );

    return { configured: true, buckets: stats };
  }

  private async countBucketObjects(
    bucketName: string
  ): Promise<{ objectCount: number; totalBytes: number; truncated: boolean }> {
    let objectCount = 0;
    let totalBytes = 0;
    let listCalls = 0;
    let truncated = false;
    const prefixQueue: string[] = [""];

    while (prefixQueue.length > 0) {
      if (listCalls >= MAX_LIST_CALLS_PER_BUCKET || objectCount >= MAX_OBJECTS_PER_BUCKET) {
        truncated = true;
        break;
      }

      const prefix = prefixQueue.shift()!;
      listCalls += 1;

      const { data: entries, error } = await this.supabase.storage
        .from(bucketName)
        .list(prefix, { limit: LIST_PAGE_SIZE });

      if (error || !entries) {
        this.logger.warn(`Supabase list failed for bucket '${bucketName}' prefix '${prefix}': ${error?.message}`);
        continue;
      }

      if (entries.length === LIST_PAGE_SIZE) {
        // A folder with more entries than one page holds — the count below
        // will undercount this folder specifically.
        truncated = true;
      }

      for (const entry of entries) {
        // A folder placeholder: no id, no metadata. A real object has both.
        if (entry.id === null && !entry.metadata) {
          prefixQueue.push(prefix ? `${prefix}/${entry.name}` : entry.name);
          continue;
        }

        objectCount += 1;
        totalBytes += entry.metadata?.size ?? 0;

        if (objectCount >= MAX_OBJECTS_PER_BUCKET) {
          truncated = true;
          break;
        }
      }
    }

    return { objectCount, totalBytes, truncated };
  }
}
