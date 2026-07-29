import type { MediaStorage, PresignedUpload } from "./media-storage";
import { MEDIA_STORAGE_PROVIDER } from "./media-storage.provider";

/** The provider's own factory, called directly — no Nest DI container needed. */
function selectStorage(r2: MediaStorage, supabase: MediaStorage): MediaStorage {
  const provider = MEDIA_STORAGE_PROVIDER as unknown as {
    useFactory: (r2: MediaStorage, supabase: MediaStorage) => MediaStorage;
  };
  return provider.useFactory(r2, supabase);
}

function fakeStorage(isConfigured: boolean, tag: string): MediaStorage {
  const presigned: PresignedUpload = {
    uploadUrl: `https://${tag}.example/upload`,
    publicUrl: `https://${tag}.example/public`,
    requiredHeaders: { "Content-Type": "image/jpeg" }
  };

  return {
    isConfigured,
    presignUpload: jest.fn().mockResolvedValue(presigned)
  };
}

describe("MEDIA_STORAGE_PROVIDER selection", () => {
  it("falls through to UnconfiguredMediaStorage, naming both providers, when neither is configured", async () => {
    const r2 = fakeStorage(false, "r2");
    const supabase = fakeStorage(false, "supabase");

    const storage = selectStorage(r2, supabase);

    expect(storage.isConfigured).toBe(false);
    await expect(
      storage.presignUpload("k", { contentType: "image/jpeg", contentLength: 1 })
    ).rejects.toThrow(/CLOUDFLARE_R2_\* or SUPABASE_\*/);

    // Neither concrete backend should have been touched.
    expect(r2.presignUpload).not.toHaveBeenCalled();
    expect(supabase.presignUpload).not.toHaveBeenCalled();
  });

  it("falls back to Supabase when only Supabase is configured", () => {
    const r2 = fakeStorage(false, "r2");
    const supabase = fakeStorage(true, "supabase");

    const storage = selectStorage(r2, supabase);

    expect(storage).toBe(supabase);
  });

  it("prefers R2 when both R2 and Supabase are configured", () => {
    const r2 = fakeStorage(true, "r2");
    const supabase = fakeStorage(true, "supabase");

    const storage = selectStorage(r2, supabase);

    expect(storage).toBe(r2);
  });

  it("uses R2 alone when only R2 is configured", () => {
    const r2 = fakeStorage(true, "r2");
    const supabase = fakeStorage(false, "supabase");

    const storage = selectStorage(r2, supabase);

    expect(storage).toBe(r2);
  });
});
