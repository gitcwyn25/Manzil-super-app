import { BadRequestException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

/** Prisma transaction client (subset available inside $transaction). */
export type Tx = Prisma.TransactionClient;

export type AuditEntry = {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
  ipAddress?: string | null;
};

/**
 * Writes an audit row **inside the caller's transaction**. If this throws,
 * the enclosing $transaction rolls back the mutation — audit and mutation
 * succeed or fail together, never independently.
 */
export async function writeAudit(tx: Tx, entry: AuditEntry): Promise<{ id: string }> {
  return tx.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      beforeState: (entry.beforeState ?? undefined) as Prisma.InputJsonValue | undefined,
      afterState: (entry.afterState ?? undefined) as Prisma.InputJsonValue | undefined,
      reason: entry.reason ?? null,
      ipAddress: entry.ipAddress ?? null
    },
    select: { id: true }
  });
}

/** Destructive actions require a substantive reason (>= 10 chars). */
export function requireReason(reason: string | undefined | null): string {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 10) {
    throw new BadRequestException("A reason of at least 10 characters is required for this action");
  }
  return trimmed;
}
