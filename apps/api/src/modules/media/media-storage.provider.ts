import type { Provider } from "@nestjs/common";
import { MEDIA_STORAGE, UnconfiguredMediaStorage, type MediaStorage } from "./media-storage";
import { R2PresignService } from "./r2-presign.service";
import { SupabaseStorageService } from "./supabase-storage.service";

/**
 * Picks the media backend at runtime rather than at build time, so switching
 * providers is an env var change, not a code change.
 *
 * R2 wins when both are configured — it was the original, better-exercised
 * path. Supabase is the fallback: it needs no new account since this project
 * already runs its Postgres on Supabase. If neither is configured, requests
 * fail through `UnconfiguredMediaStorage`, whose error names both options.
 */
export const MEDIA_STORAGE_PROVIDER: Provider = {
  provide: MEDIA_STORAGE,
  useFactory: (r2: R2PresignService, supabase: SupabaseStorageService): MediaStorage => {
    if (r2.isConfigured) return r2;
    if (supabase.isConfigured) return supabase;
    return new UnconfiguredMediaStorage();
  },
  inject: [R2PresignService, SupabaseStorageService]
};
