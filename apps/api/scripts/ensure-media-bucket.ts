/**
 * One-off bootstrap: creates the Supabase Storage bucket used for business
 * media if it doesn't exist yet, and makes sure it's public (so the
 * `publicUrl` `SupabaseStorageService` hands back is actually servable
 * without a signed download URL).
 *
 * Idempotent — safe to re-run. An existing public bucket is left untouched;
 * an existing private bucket is flipped to public; a missing bucket is
 * created public.
 *
 * Run from the repo root (so the API's env loader finds the root `.env`):
 *
 *   npm run ensure-media-bucket --workspace @manzil/api
 *
 * Requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and
 * SUPABASE_SERVICE_ROLE_KEY to be set in the root `.env`. Does not touch
 * CLOUDFLARE_R2_* or anything else — R2 keeps working unchanged if it's
 * already configured.
 */
import { loadEnv } from "../src/env";

loadEnv();

import { createClient } from "@supabase/supabase-js";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "../src/modules/media/upload-policy";

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "business-media";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set — check the root .env before running this script."
    );
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const bucketOptions = {
    public: true,
    // Mirrors the API's own upload allowlist (see upload-policy.ts) so the
    // bucket itself rejects anything our presign endpoint would never have
    // authorised in the first place.
    allowedMimeTypes: Object.keys(ALLOWED_IMAGE_TYPES),
    fileSizeLimit: MAX_IMAGE_BYTES
  };

  const { data: existing, error: getError } = await client.storage.getBucket(bucket);

  if (getError || !existing) {
    const { error: createError } = await client.storage.createBucket(bucket, bucketOptions);
    if (createError) {
      throw new Error(`Failed to create bucket '${bucket}': ${createError.message}`);
    }
    console.log(`Created Supabase Storage bucket '${bucket}' (public).`);
    return;
  }

  if (!existing.public) {
    const { error: updateError } = await client.storage.updateBucket(bucket, bucketOptions);
    if (updateError) {
      throw new Error(`Failed to make bucket '${bucket}' public: ${updateError.message}`);
    }
    console.log(`Bucket '${bucket}' existed but was private — set to public.`);
    return;
  }

  console.log(`Bucket '${bucket}' already exists and is public. Nothing to do.`);
}

main().catch((error) => {
  console.error("ensure-media-bucket failed:", error);
  process.exitCode = 1;
});
