import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { writeAudit } from "./audit.util";

type ActorCtx = { adminId: string; ip?: string | null };

/**
 * Admin notification inbox: the durable queue behind `AlertService.dispatch`.
 * Kept separate from `ConsoleRepository` for the same reason
 * `ConsoleCurationRepository` is — a distinct concern with its own read/write
 * shape, not another method bolted onto an already-large file.
 */
@Injectable()
export class ConsoleNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { unread?: boolean; limit?: number }) {
    const take = Math.min(
      Number.isFinite(params.limit) && (params.limit ?? 0) > 0 ? (params.limit as number) : 50,
      100
    );

    const [rows, unreadCount] = await Promise.all([
      this.prisma.adminNotification.findMany({
        where: params.unread ? { readAt: null } : {},
        include: { business: { select: { id: true, slug: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take
      }),
      this.prisma.adminNotification.count({ where: { readAt: null } })
    ]);

    return {
      notifications: rows.map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        businessId: n.businessId,
        business: n.business ? { id: n.business.id, slug: n.business.slug, name: n.business.name } : null,
        readAt: n.readAt?.toISOString() ?? null,
        readBy: n.readBy,
        createdAt: n.createdAt.toISOString()
      })),
      unreadCount
    };
  }

  /**
   * Idempotent: if the row is already read, the original `readAt`/`readBy`
   * come back untouched and no audit row is written for the no-op. The
   * transition itself is guarded by a conditional `updateMany` (only rows
   * still `readAt: null` flip), so two concurrent "mark read" calls for the
   * same id can't stomp on each other and leave the second caller's identity
   * as the recorded reader.
   */
  async markRead(id: string, ctx: ActorCtx) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.adminNotification.updateMany({
        where: { id, readAt: null },
        data: { readAt: new Date(), readBy: ctx.adminId }
      });

      const after = await tx.adminNotification.findUnique({ where: { id } });
      if (!after) throw new NotFoundException("Notification not found");

      if (result.count > 0) {
        await writeAudit(tx, {
          actorId: ctx.adminId,
          action: "notification.read",
          targetType: "admin_notification",
          targetId: id,
          beforeState: { readAt: null },
          afterState: { readAt: after.readAt, readBy: after.readBy },
          ipAddress: ctx.ip
        });
      }

      return {
        id: after.id,
        readAt: after.readAt!.toISOString(),
        readBy: after.readBy,
        alreadyRead: result.count === 0
      };
    });
  }

  /** Only rows still unread are touched; already-read rows are untouched, not re-stamped. */
  async markAllRead(ctx: ActorCtx) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.adminNotification.updateMany({
        where: { readAt: null },
        data: { readAt: new Date(), readBy: ctx.adminId }
      });

      if (result.count > 0) {
        await writeAudit(tx, {
          actorId: ctx.adminId,
          action: "notification.read_all",
          targetType: "admin_notification",
          afterState: { markedCount: result.count },
          ipAddress: ctx.ip
        });
      }

      return { markedCount: result.count };
    });
  }
}
