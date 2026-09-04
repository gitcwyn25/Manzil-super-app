import { ConflictException, InternalServerErrorException } from "@nestjs/common";
import { createHash, createHmac } from "node:crypto";
import type { AdminSignatureStatus } from "@prisma/client";
import { writeAudit, type AuditEntry, type Tx } from "./audit.util";

export type SignedAuditResult = {
  auditId: string;
  signatureId: string;
  signatureVersion: number;
};

/**
 * Creates an audit row and its operational signature in the same transaction.
 *
 * This is an employee attribution mechanism, not a legal e-signature: the
 * AdminUser is still the authorization identity, while the active signature
 * profile snapshots the display name/version used for the action. The HMAC
 * protects the event digest from silent database-side edits with a dedicated
 * operational key; it never turns a console action into a legal document.
 */
export function assertOperationalSignatureKey(): void {
  if (!process.env.ADMIN_OPERATION_SIGNATURE_SECRET) {
    throw new InternalServerErrorException(
      "SIGNATURE_KEY_MISSING: ADMIN_OPERATION_SIGNATURE_SECRET is not configured; refusing to record an unsigned operation"
    );
  }
}

export async function assertActiveOperationalSignature(tx: Tx, adminId: string): Promise<void> {
  assertOperationalSignatureKey();
  const active = await tx.adminSignature.findFirst({
    where: {
      adminUserId: adminId,
      status: "active" as AdminSignatureStatus
    },
    orderBy: { version: "desc" }
  });

  if (!active) {
    throw new ConflictException("Configure an active operational signature before this action");
  }
}

export async function writeSignedAudit(tx: Tx, entry: AuditEntry): Promise<SignedAuditResult> {
  const active = await tx.adminSignature.findFirst({
    where: {
      adminUserId: entry.actorId,
      status: "active" as AdminSignatureStatus
    },
    orderBy: { version: "desc" }
  });

  if (!active) {
    throw new ConflictException("Configure an active operational signature before this action");
  }
  assertOperationalSignatureKey();

  const audit = await writeAudit(tx, entry);
  const signedAt = new Date();
  const canonicalPayload = stableStringify({
    auditId: audit.id,
    adminUserId: entry.actorId,
    adminSignatureId: active.id,
    signatureVersion: active.version,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId ?? null,
    beforeState: entry.beforeState ?? null,
    afterState: entry.afterState ?? null,
    reason: entry.reason ?? null,
    ipAddress: entry.ipAddress ?? null,
    signedAt: signedAt.toISOString()
  });

  const secret = process.env.ADMIN_OPERATION_SIGNATURE_SECRET;
  if (!secret) {
    throw new InternalServerErrorException(
      "SIGNATURE_KEY_MISSING: ADMIN_OPERATION_SIGNATURE_SECRET is not configured; refusing to record an unsigned operation"
    );
  }

  const payloadHash = createHash("sha256").update(canonicalPayload).digest("hex");
  const signature = createHmac("sha256", secret).update(canonicalPayload).digest("hex");

  const operational = await tx.operationalSignature.create({
    data: {
      adminUserId: entry.actorId,
      adminSignatureId: active.id,
      auditLogId: audit.id,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      payloadHash,
      signature,
      algorithm: "hmac-sha256",
      createdAt: signedAt
    },
    select: { id: true }
  });

  return { auditId: audit.id, signatureId: operational.id, signatureVersion: active.version };
}

/** Deterministic JSON for a digest; object keys are sorted and dates are ISO strings. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }
  if (typeof value === "bigint") {
    return JSON.stringify(value.toString());
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(String(value));
}
