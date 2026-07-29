import { NotFoundException } from "@nestjs/common";
import { ConsoleNotificationsRepository } from "./console-notifications.repository";

const ctx = { adminId: "admin_1", ip: "127.0.0.1" };

/**
 * `$transaction` mock runs the interactive callback against the same mocked
 * `prisma` object a real transaction would hand back as `tx` — same pattern
 * as bookings.repository.spec.ts / media.controller.spec.ts.
 */
function makePrisma() {
  const prisma = {
    adminNotification: {
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      updateMany: jest.fn()
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn()
  };

  prisma.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => unknown)(prisma);
    }
    return Promise.all(arg as Promise<unknown>[]);
  });

  return prisma;
}

function makeRepo(prisma: ReturnType<typeof makePrisma>) {
  return new ConsoleNotificationsRepository(prisma as never);
}

const unreadRow = {
  id: "notif_1",
  kind: "business_awaiting_approval",
  title: "New business awaiting approval: Caravan Coffee",
  body: "Chilonzor, Tashkent",
  businessId: "biz_1",
  business: { id: "biz_1", slug: "caravan-coffee", name: "Caravan Coffee" },
  readAt: null as Date | null,
  readBy: null as string | null,
  createdAt: new Date("2026-07-20T00:00:00.000Z")
};

describe("ConsoleNotificationsRepository.list — unread filter", () => {
  it("appears in the inbox when unread and requested with unread=true", async () => {
    const prisma = makePrisma();
    prisma.adminNotification.findMany.mockResolvedValue([unreadRow]);
    prisma.adminNotification.count.mockResolvedValue(1);
    const repo = makeRepo(prisma);

    const result = await repo.list({ unread: true, limit: 50 });

    expect(prisma.adminNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { readAt: null } })
    );
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]).toMatchObject({
      id: "notif_1",
      kind: "business_awaiting_approval",
      readAt: null,
      businessId: "biz_1"
    });
    expect(result.unreadCount).toBe(1);
  });

  it("does not filter on readAt when unread is not requested", async () => {
    const prisma = makePrisma();
    prisma.adminNotification.findMany.mockResolvedValue([]);
    const repo = makeRepo(prisma);

    await repo.list({ unread: false, limit: 50 });

    expect(prisma.adminNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("caps an oversized limit at 100", async () => {
    const prisma = makePrisma();
    prisma.adminNotification.findMany.mockResolvedValue([]);
    const repo = makeRepo(prisma);

    await repo.list({ unread: false, limit: 5000 });

    expect(prisma.adminNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });
});

describe("ConsoleNotificationsRepository.markRead — idempotency", () => {
  it("marks an unread notification read and records who/when", async () => {
    const prisma = makePrisma();
    prisma.adminNotification.updateMany.mockResolvedValue({ count: 1 });
    prisma.adminNotification.findUnique.mockResolvedValue({
      ...unreadRow,
      readAt: new Date("2026-07-29T12:00:00.000Z"),
      readBy: "admin_1"
    });
    const repo = makeRepo(prisma);

    const result = await repo.markRead("notif_1", ctx);

    expect(prisma.adminNotification.updateMany).toHaveBeenCalledWith({
      where: { id: "notif_1", readAt: null },
      data: { readAt: expect.any(Date), readBy: "admin_1" }
    });
    expect(result).toMatchObject({ id: "notif_1", readBy: "admin_1", alreadyRead: false });
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("is idempotent: an already-read notification returns success without overwriting the original reader", async () => {
    const prisma = makePrisma();
    // Already read by a different admin at an earlier time — the conditional
    // updateMany (readAt: null) can't match this row, so it's a no-op.
    prisma.adminNotification.updateMany.mockResolvedValue({ count: 0 });
    const originalReadAt = new Date("2026-07-25T09:00:00.000Z");
    prisma.adminNotification.findUnique.mockResolvedValue({
      ...unreadRow,
      readAt: originalReadAt,
      readBy: "admin_original"
    });
    const repo = makeRepo(prisma);

    const result = await repo.markRead("notif_1", { adminId: "admin_2", ip: null });

    expect(result).toEqual({
      id: "notif_1",
      readAt: originalReadAt.toISOString(),
      readBy: "admin_original",
      alreadyRead: true
    });
    // No audit noise for a no-op, and the second admin never overwrote the record.
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("throws NotFoundException for a notification that doesn't exist", async () => {
    const prisma = makePrisma();
    prisma.adminNotification.updateMany.mockResolvedValue({ count: 0 });
    prisma.adminNotification.findUnique.mockResolvedValue(null);
    const repo = makeRepo(prisma);

    await expect(repo.markRead("missing", ctx)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("ConsoleNotificationsRepository.markAllRead", () => {
  it("only touches unread rows and reports how many were marked", async () => {
    const prisma = makePrisma();
    prisma.adminNotification.updateMany.mockResolvedValue({ count: 3 });
    const repo = makeRepo(prisma);

    const result = await repo.markAllRead(ctx);

    expect(prisma.adminNotification.updateMany).toHaveBeenCalledWith({
      where: { readAt: null },
      data: { readAt: expect.any(Date), readBy: "admin_1" }
    });
    expect(result).toEqual({ markedCount: 3 });
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("writes no audit row when there is nothing unread to mark", async () => {
    const prisma = makePrisma();
    prisma.adminNotification.updateMany.mockResolvedValue({ count: 0 });
    const repo = makeRepo(prisma);

    const result = await repo.markAllRead(ctx);

    expect(result).toEqual({ markedCount: 0 });
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
