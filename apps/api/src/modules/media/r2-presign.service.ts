import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createHash, createHmac } from "node:crypto";

/**
 * Generates AWS SigV4 presigned PUT URLs for Cloudflare R2 (S3-compatible)
 * using only node:crypto — no AWS SDK dependency.
 *
 * Required env: CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID,
 * CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET.
 */
@Injectable()
export class R2PresignService {
  private readonly accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  private readonly accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  private readonly bucket = process.env.CLOUDFLARE_R2_BUCKET;
  private readonly publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL; // optional CDN domain

  isConfigured(): boolean {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey && this.bucket);
  }

  /** Presigns a PUT upload for the given storage key. */
  presignUpload(storageKey: string, expiresSeconds = 900): { uploadUrl: string; publicUrl: string | null } {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "Media storage is not configured. Set CLOUDFLARE_R2_* environment variables."
      );
    }

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

    const queryParams = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${this.accessKeyId}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(expiresSeconds),
      "X-Amz-SignedHeaders": "host"
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
      `host:${host}\n`,
      "host",
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

    return { uploadUrl, publicUrl };
  }
}
