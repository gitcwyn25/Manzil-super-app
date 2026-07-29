import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createHash, createHmac } from "node:crypto";
import type { MediaStorage, PresignedUpload, PresignUploadOptions } from "./media-storage";

/**
 * Generates AWS SigV4 presigned PUT URLs for Cloudflare R2 (S3-compatible)
 * using only node:crypto — no AWS SDK dependency.
 *
 * Required env: CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID,
 * CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET.
 */
@Injectable()
export class R2PresignService implements MediaStorage {
  private readonly accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  private readonly accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  private readonly bucket = process.env.CLOUDFLARE_R2_BUCKET;
  private readonly publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL; // optional CDN domain

  get isConfigured(): boolean {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey && this.bucket);
  }

  /**
   * Presigns a PUT upload for the given storage key.
   *
   * `contentType` and `contentLength` are **signed**, not merely advisory. A
   * presigned URL that signs only `host` places no constraint on the bytes the
   * client actually PUTs — it could upload an executable of any size and our
   * server-side MIME/size checks would be decorative. Signing these headers
   * makes R2 itself reject any upload whose type or length differs from what
   * was authorised.
   *
   * Async only to satisfy the shared `MediaStorage` interface (Supabase's
   * equivalent call is genuinely async) — everything here is synchronous
   * node:crypto.
   */
  async presignUpload(storageKey: string, options: PresignUploadOptions): Promise<PresignedUpload> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        "Media storage is not configured. Set either CLOUDFLARE_R2_* or SUPABASE_* environment variables."
      );
    }

    const { contentType, contentLength, expiresSeconds = 900 } = options;
    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const region = "auto";
    const service = "s3";
    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

    const canonicalUri = `/${this.bucket}/${storageKey
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`;

    // Signed headers must be lowercase and sorted by name in both the
    // canonical headers block and the SignedHeaders list.
    const signedHeaderValues: Record<string, string> = {
      "content-length": String(contentLength),
      "content-type": contentType,
      host
    };
    const signedHeaderNames = Object.keys(signedHeaderValues).sort();
    const signedHeaders = signedHeaderNames.join(";");
    const canonicalHeaders = `${signedHeaderNames
      .map((name) => `${name}:${signedHeaderValues[name]}`)
      .join("\n")}\n`;

    const queryParams = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${this.accessKeyId}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(expiresSeconds),
      "X-Amz-SignedHeaders": signedHeaders
    });

    // Canonical query string must be sorted by parameter name.
    const canonicalQuery = [...queryParams.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");

    const canonicalRequest = [
      "PUT",
      canonicalUri,
      canonicalQuery,
      canonicalHeaders,
      signedHeaders,
      "UNSIGNED-PAYLOAD"
    ].join("\n");

    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      createHash("sha256").update(canonicalRequest).digest("hex")
    ].join("\n");

    const kDate = createHmac("sha256", `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = createHmac("sha256", kDate).update(region).digest();
    const kService = createHmac("sha256", kRegion).update(service).digest();
    const kSigning = createHmac("sha256", kService).update("aws4_request").digest();

    const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

    const uploadUrl = `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
    const publicUrl = this.publicBaseUrl
      ? `${this.publicBaseUrl.replace(/\/$/, "")}/${storageKey}`
      : null;

    return {
      uploadUrl,
      publicUrl,
      // The client must replay these verbatim on the PUT; anything else fails
      // signature verification at R2.
      requiredHeaders: {
        "Content-Type": contentType,
        "Content-Length": String(contentLength)
      }
    };
  }
}
