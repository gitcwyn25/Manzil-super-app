import { ServiceUnavailableException } from "@nestjs/common";
import { SupabaseStorageService } from "./supabase-storage.service";

/**
 * The Supabase client is built lazily behind a private getter that only
 * reads SUPABASE_SERVICE_ROLE_KEY the first time it's touched (same
 * reasoning as StripeService — see stripe.service.spec.ts), so this poke of
 * the private `client` field swaps in a mock before that getter ever runs.
 * No real Supabase project, network call, or SDK mocking is needed.
 */
function makeService(env: { url?: string; key?: string; bucket?: string } = {}): SupabaseStorageService {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalBucket = process.env.SUPABASE_STORAGE_BUCKET;

  setOrDelete("SUPABASE_URL", env.url);
  setOrDelete("SUPABASE_SERVICE_ROLE_KEY", env.key);
  setOrDelete("SUPABASE_STORAGE_BUCKET", env.bucket);

  const service = new SupabaseStorageService();

  setOrDelete("SUPABASE_URL", originalUrl);
  setOrDelete("SUPABASE_SERVICE_ROLE_KEY", originalKey);
  setOrDelete("SUPABASE_STORAGE_BUCKET", originalBucket);

  return service;
}

function setOrDelete(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

function attachMockClient(service: SupabaseStorageService, from: jest.Mock) {
  (service as unknown as { client: unknown }).client = { storage: { from } };
}

describe("SupabaseStorageService.isConfigured", () => {
  it("is false when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are both unset", () => {
    expect(makeService({}).isConfigured).toBe(false);
  });

  it("is false when only the URL is set", () => {
    expect(makeService({ url: "https://proj.supabase.co" }).isConfigured).toBe(false);
  });

  it("is true once both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set", () => {
    expect(
      makeService({ url: "https://proj.supabase.co", key: "service-role-key" }).isConfigured
    ).toBe(true);
  });
});

describe("SupabaseStorageService.presignUpload", () => {
  it("throws naming both storage providers when unconfigured, without touching the SDK", async () => {
    const service = makeService({});

    const promise = service.presignUpload("business/biz_1/abc.jpg", {
      contentType: "image/jpeg",
      contentLength: 1000
    });

    await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(promise).rejects.toThrow(/CLOUDFLARE_R2_\* or SUPABASE_\*/);
  });

  it("requests a signed upload URL for the configured bucket and given key, matching R2's return shape", async () => {
    const service = makeService({
      url: "https://proj.supabase.co",
      key: "service-role-key",
      bucket: "business-media"
    });

    const createSignedUploadUrl = jest.fn().mockResolvedValue({
      data: {
        signedUrl:
          "https://proj.supabase.co/storage/v1/object/upload/sign/business-media/business/biz_1/abc.jpg?token=tok123",
        path: "business/biz_1/abc.jpg",
        token: "tok123"
      },
      error: null
    });
    const from = jest.fn().mockReturnValue({ createSignedUploadUrl });
    attachMockClient(service, from);

    const result = await service.presignUpload("business/biz_1/abc.jpg", {
      contentType: "image/jpeg",
      contentLength: 12345
    });

    expect(from).toHaveBeenCalledWith("business-media");
    expect(createSignedUploadUrl).toHaveBeenCalledWith("business/biz_1/abc.jpg");

    expect(result).toEqual({
      uploadUrl:
        "https://proj.supabase.co/storage/v1/object/upload/sign/business-media/business/biz_1/abc.jpg?token=tok123",
      publicUrl: "https://proj.supabase.co/storage/v1/object/public/business-media/business/biz_1/abc.jpg",
      requiredHeaders: { "Content-Type": "image/jpeg" }
    });
    // Same three keys R2PresignService.presignUpload returns — MediaController
    // must not need to care which backend answered.
    expect(Object.keys(result).sort()).toEqual(["publicUrl", "requiredHeaders", "uploadUrl"]);
  });

  it("defaults the bucket to business-media when SUPABASE_STORAGE_BUCKET is unset", async () => {
    const service = makeService({ url: "https://proj.supabase.co", key: "service-role-key" });
    const createSignedUploadUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: "https://proj.supabase.co/x?token=t", path: "p", token: "t" },
      error: null
    });
    const from = jest.fn().mockReturnValue({ createSignedUploadUrl });
    attachMockClient(service, from);

    await service.presignUpload("business/biz_1/abc.jpg", { contentType: "image/jpeg", contentLength: 1 });

    expect(from).toHaveBeenCalledWith("business-media");
  });

  it("surfaces a Supabase error as ServiceUnavailableException rather than a raw SDK error", async () => {
    const service = makeService({ url: "https://proj.supabase.co", key: "service-role-key" });
    const createSignedUploadUrl = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "bucket not found", name: "StorageApiError" }
    });
    attachMockClient(service, jest.fn().mockReturnValue({ createSignedUploadUrl }));

    await expect(
      service.presignUpload("business/biz_1/abc.jpg", { contentType: "image/jpeg", contentLength: 1 })
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
