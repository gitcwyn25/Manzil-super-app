import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import type {
  AdminSignatureStatus,
  OutboxStatus,
  Prisma,
  WaitlistReviewStatus,
  WaitlistTopic
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import {
  WAITLIST_TRANSITION_STATUSES,
  type WaitlistTransitionStatus
} from "./activation.dto";
import { requireReason, writeAudit } from "./audit.util";
import {
  assertActiveOperationalSignature,
  assertOperationalSignatureKey,
  writeSignedAudit
} from "./operational-signature.util";

type ActorCtx = { adminId: string; ip?: string | null };

const WAITLIST_STATUSES: WaitlistReviewStatus[] = [
  "new",
  "contacted",
  "qualified",
  "accepted",
  "rejected",
  "duplicate",
  "connected"
];
const WAITLIST_TOPICS: WaitlistTopic[] = ["city", "gurman", "pro"];
const OUTBOX_STATUSES: OutboxStatus[] = ["pending", "processing", "sent", "failed", "canceled"];

/** Server-owned policy; the admin UI is only an affordance layer. */
const ALLOWED_WAITLIST_TRANSITIONS: Record<WaitlistReviewStatus, WaitlistTransitionStatus[]> = {
  new: ["contacted", "qualified"],
  contacted: ["qualified", "rejected", "duplicate"],
  qualified: ["accepted", "rejected", "duplicate"],
  accepted: [],
  rejected: ["contacted"],
  duplicate: ["contacted"],
  connected: []
};

const WAITLIST_LIST_INCLUDE = {
  assignedAdmin: { select: { id: true, name: true, email: true } },
  reviewedByAdmin: { select: { id: true, name: true, email: true } },
  connectedBusiness: { select: { id: true, slug: true, name: true, status: true } },
  outboxMessages: {
    select: {
      id: true,
      kind: true,
      status: true,
      attempts: true,
      lastError: true,
      createdAt: true,
      sentAt: true
    },
    orderBy: { createdAt: "desc" as const },
    take: 10
  }
} satisfies Prisma.WaitlistSignupInclude;

type WaitlistListRow = Prisma.WaitlistSignupGetPayload<{
  include: typeof WAITLIST_LIST_INCLUDE;
}>;

const OUTBOX_LIST_INCLUDE = {
  waitlistSignup: {
    select: { id: true, topic: true, email: true, city: true, businessName: true }
  },
  createdByAdmin: { select: { id: true, name: true, email: true } }
} satisfies Prisma.OutboxMessageInclude;

type OutboxListRow = Prisma.OutboxMessageGetPayload<{
  include: typeof OUTBOX_LIST_INCLUDE;
}>;

@Injectable()
export class ActivationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listWaitlist(params: {
    status?: string;
    topic?: string;
    q?: string;
    assignedAdminId?: string;
    take?: number;
  }) {
    this.assertEnabled();
    const take = Math.min(
      Number.isFinite(params.take) && (params.take ?? 0) > 0 ? (params.take as number) : 50,
      100
    );
    const rawStatus = params.status?.trim();
    if (rawStatus && !WAITLIST_STATUSES.includes(rawStatus as WaitlistReviewStatus)) {
      throw new BadRequestException("Unknown waitlist status filter");
    }
    const rawTopic = params.topic?.trim();
    if (rawTopic && !WAITLIST_TOPICS.includes(rawTopic as WaitlistTopic)) {
      throw new BadRequestException("Unknown waitlist topic filter");
    }
    const status = rawStatus as WaitlistReviewStatus | undefined;
    const topic = rawTopic as WaitlistTopic | undefined;
    const q = params.q?.trim();

    const where: Prisma.WaitlistSignupWhereInput = {
      ...(status ? { status } : {}),
      ...(topic ? { topic } : {}),
      ...(params.assignedAdminId ? { assignedAdminId: params.assignedAdminId } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { businessName: { contains: q, mode: "insensitive" } },
              { source: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [rows, total, grouped] = await Promise.all([
      this.prisma.waitlistSignup.findMany({
        where,
        include: WAITLIST_LIST_INCLUDE,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take
      }),
      this.prisma.waitlistSignup.count({ where }),
      this.prisma.waitlistSignup.groupBy({
        by: ["status"],
        where,
        _count: { _all: true }
      })
    ]);

    const counts: Record<string, number> = {};
    for (const row of grouped) counts[row.status] = row._count._all;

    return {
      total,
      counts,
      signups: rows.map((row) => this.mapWaitlist(row))
    };
  }

  async transitionWaitlist(
    id: string,
    status: WaitlistTransitionStatus,
    reason: string | undefined,
    ctx: ActorCtx,
    expectedUpdatedAt?: string
  ) {
    this.assertEnabled();
    if (!WAITLIST_TRANSITION_STATUSES.includes(status)) {
      throw new BadRequestException("Unknown waitlist transition");
    }

    const requestedReason = ["accepted", "rejected", "duplicate"].includes(status)
      ? requireReason(reason)
      : reason?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const before = await tx.waitlistSignup.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("Waitlist signup not found");
      if (expectedUpdatedAt && before.updatedAt.toISOString() !== expectedUpdatedAt) {
        throw new ConflictException("STALE_STATE: the waitlist record changed; reload before trying again");
      }
      if (before.topic === "city" && status === "accepted") {
        throw new BadRequestException("City demand can be qualified or contacted, but not accepted as product access");
      }

      if (before.status === status) {
        return {
          id,
          status: before.status,
          alreadyApplied: true,
          signatureVersion: null
        };
      }

      if (before.status === "connected") {
        throw new ConflictException("A connected waitlist entry cannot move backward");
      }

      if (!ALLOWED_WAITLIST_TRANSITIONS[before.status].includes(status)) {
        throw new ConflictException(
          `Cannot move a ${before.status} waitlist entry to ${status}`
        );
      }

      const validReason = ["rejected", "duplicate"].includes(before.status)
        ? requireReason(reason)
        : requestedReason;
      await assertActiveOperationalSignature(tx, ctx.adminId);
      const now = new Date();
      const after = await tx.waitlistSignup.update({
        where: { id },
        data: {
          status,
          reviewedByAdminId: ctx.adminId,
          reviewedAt: now,
          decisionReason: validReason,
          ...(status === "contacted" && !before.contactedAt ? { contactedAt: now } : {})
        }
      });

      const signed = await writeSignedAudit(tx, {
        actorId: ctx.adminId,
        action: `waitlist.${status}`,
        targetType: "waitlist_signup",
        targetId: id,
        beforeState: {
          status: before.status,
          assignedAdminId: before.assignedAdminId,
          decisionReason: before.decisionReason
        },
        afterState: {
          status: after.status,
          reviewedByAdminId: after.reviewedByAdminId,
          reviewedAt: after.reviewedAt,
          decisionReason: after.decisionReason
        },
        reason: validReason,
        ipAddress: ctx.ip
      });

      return {
        id: after.id,
        status: after.status,
        reviewedAt: after.reviewedAt?.toISOString() ?? null,
        signatureVersion: signed.signatureVersion,
        auditId: signed.auditId
      };
    });
  }

  async assignWaitlist(
    id: string,
    assignedAdminId: string | null | undefined,
    ctx: ActorCtx,
    expectedUpdatedAt?: string
  ) {
    this.assertEnabled();
    if (assignedAdminId === undefined) {
      throw new BadRequestException("adminId is required; pass null to clear the assignment");
    }
    if (typeof assignedAdminId === "string" && assignedAdminId.trim() === "") {
      throw new BadRequestException("adminId must be a non-empty ID or null");
    }

    return this.prisma.$transaction(async (tx) => {
      const before = await tx.waitlistSignup.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("Waitlist signup not found");
      if (expectedUpdatedAt && before.updatedAt.toISOString() !== expectedUpdatedAt) {
        throw new ConflictException("STALE_STATE: the waitlist record changed; reload before assigning it");
      }

      if (assignedAdminId) {
        const admin = await tx.adminUser.findFirst({
          where: { id: assignedAdminId, isActive: true },
          select: { id: true, name: true, email: true }
        });
        if (!admin) throw new NotFoundException("Active admin assignee not found");
      }

      if (before.assignedAdminId === assignedAdminId) {
        return { id, assignedAdminId, alreadyApplied: true, signatureVersion: null };
      }

      await assertActiveOperationalSignature(tx, ctx.adminId);
      const after = await tx.waitlistSignup.update({
        where: { id },
        data: { assignedAdminId }
      });

      const signed = await writeSignedAudit(tx, {
        actorId: ctx.adminId,
        action: "waitlist.assign",
        targetType: "waitlist_signup",
        targetId: id,
        beforeState: { assignedAdminId: before.assignedAdminId },
        afterState: { assignedAdminId: after.assignedAdminId },
        ipAddress: ctx.ip
      });

      return {
        id: after.id,
        assignedAdminId: after.assignedAdminId,
        signatureVersion: signed.signatureVersion,
        auditId: signed.auditId
      };
    });
  }

  /**
   * Links demand to an existing company record. This intentionally does not
   * set Business.claimedByUserId, Business.status, or Business.claimedAt: a
   * CRM connection is not proof of ownership and must not make a listing live.
   */
  async connectCompany(
    id: string,
    businessId: string,
    reason: string,
    ctx: ActorCtx,
    expectedUpdatedAt?: string
  ) {
    this.assertEnabled();
    const validReason = requireReason(reason);

    return this.prisma.$transaction(async (tx) => {
      const before = await tx.waitlistSignup.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("Waitlist signup not found");
      if (expectedUpdatedAt && before.updatedAt.toISOString() !== expectedUpdatedAt) {
        throw new ConflictException("STALE_STATE: the waitlist record changed; reload before connecting it");
      }

      if (["rejected", "duplicate"].includes(before.status)) {
        throw new ConflictException("A closed waitlist entry cannot be connected");
      }
      if (before.topic === "city") {
        throw new ConflictException("City demand cannot be connected to a business in this activation contract");
      }
      if (before.status === "connected") {
        if (before.connectedBusinessId === businessId) {
          return {
            id,
            status: before.status,
            connectedBusinessId: before.connectedBusinessId,
            alreadyApplied: true,
            signatureVersion: null
          };
        }
        throw new ConflictException("This waitlist entry is already connected to another business");
      }
      if (!["qualified", "accepted"].includes(before.status)) {
        throw new ConflictException("Qualify or accept the waitlist entry before connecting a business");
      }

      const business = await tx.business.findUnique({
        where: { id: businessId },
        select: { id: true, slug: true, name: true, status: true, mergedIntoId: true }
      });
      if (!business) throw new NotFoundException("Business not found");
      if (business.status === "suspended" || business.mergedIntoId) {
        throw new ConflictException("Cannot connect to a suspended or merged business");
      }

      // Several people can legitimately express interest in the same business;
      // the link is many-to-one and remains separate from ownership claims.
      await assertActiveOperationalSignature(tx, ctx.adminId);
      const now = new Date();
      const after = await tx.waitlistSignup.update({
        where: { id },
        data: {
          status: "connected",
          connectedBusinessId: business.id,
          connectedAt: now,
          connectedByAdminId: ctx.adminId,
          reviewedByAdminId: ctx.adminId,
          reviewedAt: now,
          decisionReason: validReason
        }
      });

      const signed = await writeSignedAudit(tx, {
        actorId: ctx.adminId,
        action: "waitlist.connect_business",
        targetType: "waitlist_signup",
        targetId: id,
        beforeState: {
          status: before.status,
          connectedBusinessId: before.connectedBusinessId
        },
        afterState: {
          status: after.status,
          connectedBusinessId: after.connectedBusinessId,
          businessId: business.id,
          businessStatus: business.status,
          ownershipChanged: false
        },
        reason: validReason,
        ipAddress: ctx.ip
      });

      return {
        id: after.id,
        status: after.status,
        connectedBusiness: {
          id: business.id,
          slug: business.slug,
          name: business.name,
          status: business.status
        },
        ownershipChanged: false,
        publicVisibilityChanged: false,
        signatureVersion: signed.signatureVersion,
        auditId: signed.auditId
      };
    });
  }

  async queueEmailDraft(
    id: string,
    input: { subject?: string; body?: string },
    ctx: ActorCtx
  ) {
    this.assertEnabled();
    assertOperationalSignatureKey();
    const idempotencyKey = `waitlist-onboarding:${id}:v1`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const signup = await tx.waitlistSignup.findUnique({ where: { id } });
      if (!signup) throw new NotFoundException("Waitlist signup not found");
      if (["rejected", "duplicate"].includes(signup.status)) {
        throw new ConflictException("A closed waitlist entry cannot receive an onboarding draft");
      }
      if (!["contacted", "qualified", "accepted", "connected"].includes(signup.status)) {
        throw new ConflictException("Transition the waitlist entry before queuing an onboarding draft");
      }

      const signature = await tx.adminSignature.findFirst({
        where: { adminUserId: ctx.adminId, status: "active" as AdminSignatureStatus },
        orderBy: { version: "desc" },
        select: { id: true, version: true, displayName: true, title: true }
      });
      if (!signature) {
        throw new ConflictException("Configure an active operational signature before queuing email");
      }

      const subject = input.subject?.trim() || defaultSubject(signup.topic, signup.locale);
      const body = input.body?.trim()
        ? withSignatureFooter(input.body.trim(), signature)
        : defaultBody(signup, signature);
      const existing = await tx.outboxMessage.findUnique({ where: { idempotencyKey } });
      if (existing) {
        if (existing.subject !== subject || existing.body !== body) {
          throw new ConflictException(
            "IDEMPOTENCY_CONFLICT: this waitlist draft is already queued with different content"
          );
        }
        return {
          id: existing.id,
          status: existing.status,
          alreadyQueued: true,
          idempotencyKey: existing.idempotencyKey,
          signatureVersion: signatureVersionFromPayload(existing.payload)
        };
      }

      const message = await tx.outboxMessage.create({
        data: {
          channel: "email",
          status: "pending",
          kind: "waitlist_onboarding",
          recipient: signup.email,
          subject,
          body,
          payload: {
            topic: signup.topic,
            locale: signup.locale,
            city: signup.city,
            businessName: signup.businessName,
            signatureVersion: signature.version
          },
          idempotencyKey,
          waitlistSignupId: signup.id,
          createdByAdminId: ctx.adminId
        }
      });

      const signed = await writeSignedAudit(tx, {
        actorId: ctx.adminId,
        action: "waitlist.email.queue",
        targetType: "outbox_message",
        targetId: message.id,
        afterState: {
          status: message.status,
          channel: message.channel,
          kind: message.kind,
          recipient: message.recipient,
          idempotencyKey: message.idempotencyKey,
          waitlistSignupId: signup.id,
          sent: false
        },
        ipAddress: ctx.ip
      });

      return {
        id: message.id,
        status: message.status,
        alreadyQueued: false,
        idempotencyKey: message.idempotencyKey,
        signatureVersion: signed.signatureVersion,
        auditId: signed.auditId
      };
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const existing = await this.prisma.outboxMessage.findUnique({ where: { idempotencyKey } });
      if (!existing) throw error;
      return {
        id: existing.id,
        status: existing.status,
        alreadyQueued: true,
        idempotencyKey: existing.idempotencyKey,
        signatureVersion: null
      };
    }
  }

  async listOutbox(params: { status?: string; waitlistSignupId?: string; take?: number }) {
    this.assertEnabled();
    const take = Math.min(
      Number.isFinite(params.take) && (params.take ?? 0) > 0 ? (params.take as number) : 50,
      100
    );
    const rawStatus = params.status?.trim();
    if (rawStatus && !OUTBOX_STATUSES.includes(rawStatus as OutboxStatus)) {
      throw new BadRequestException("Unknown outbox status filter");
    }
    const status = rawStatus as OutboxStatus | undefined;

    const where: Prisma.OutboxMessageWhereInput = {
      ...(status ? { status } : {}),
      ...(params.waitlistSignupId ? { waitlistSignupId: params.waitlistSignupId } : {})
    };

    const [rows, counts] = await Promise.all([
      this.prisma.outboxMessage.findMany({
        where,
        include: OUTBOX_LIST_INCLUDE,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take
      }),
      this.prisma.outboxMessage.groupBy({
        by: ["status"],
        where,
        _count: { _all: true }
      })
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of counts) byStatus[row.status] = row._count._all;

    return {
      counts: byStatus,
      messages: rows.map((row) => this.mapOutbox(row))
    };
  }

  async retryOutbox(id: string, reason: string, ctx: ActorCtx) {
    this.assertEnabled();
    const validReason = requireReason(reason);

    return this.prisma.$transaction(async (tx) => {
      const before = await tx.outboxMessage.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("Outbox message not found");
      if (before.status !== "failed") {
        throw new ConflictException("Only failed outbox messages can be retried");
      }

      await assertActiveOperationalSignature(tx, ctx.adminId);
      const after = await tx.outboxMessage.update({
        where: { id },
        data: {
          status: "pending",
          availableAt: new Date(),
          lockedAt: null,
          lastError: null
        }
      });

      const signed = await writeSignedAudit(tx, {
        actorId: ctx.adminId,
        action: "outbox.retry",
        targetType: "outbox_message",
        targetId: id,
        beforeState: { status: before.status, attempts: before.attempts, lastError: before.lastError },
        afterState: { status: after.status, attempts: after.attempts, lastError: after.lastError },
        reason: validReason,
        ipAddress: ctx.ip
      });

      return {
        id: after.id,
        status: after.status,
        attempts: after.attempts,
        availableAt: after.availableAt.toISOString(),
        signatureVersion: signed.signatureVersion,
        auditId: signed.auditId
      };
    });
  }

  async currentSignature(adminId: string) {
    this.assertEnabled();
    const history = await this.prisma.adminSignature.findMany({
      where: { adminUserId: adminId },
      orderBy: { version: "desc" },
      take: 20
    });
    const active = history.find((signature) => signature.status === "active") ?? null;

    return {
      configured: Boolean(active),
      active: active ? this.mapSignature(active) : null,
      history: history.map((signature) => this.mapSignature(signature))
    };
  }

  async activateSignature(adminId: string, title: string | undefined, ctx: ActorCtx) {
    this.assertEnabled();
    const normalizedTitle = title?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const admin = await tx.adminUser.findFirst({
        where: { id: adminId, isActive: true },
        select: { id: true, name: true, email: true }
      });
      if (!admin) throw new NotFoundException("Active admin not found");

      const current = await tx.adminSignature.findFirst({
        where: { adminUserId: adminId, status: "active" },
        orderBy: { version: "desc" }
      });
      if (current && current.title === normalizedTitle && current.displayName === admin.name) {
        return { configured: true, ...this.mapSignature(current), alreadyActive: true };
      }

      const latest = await tx.adminSignature.findFirst({
        where: { adminUserId: adminId },
        orderBy: { version: "desc" },
        select: { version: true }
      });
      const now = new Date();

      await tx.adminSignature.updateMany({
        where: { adminUserId: adminId, status: "active" },
        data: { status: "revoked", revokedAt: now }
      });

      const created = await tx.adminSignature.create({
        data: {
          adminUserId: adminId,
          version: (latest?.version ?? 0) + 1,
          displayName: admin.name,
          title: normalizedTitle,
          status: "active"
        }
      });

      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: "admin.signature.activate",
        targetType: "admin_signature",
        targetId: created.id,
        beforeState: current
          ? { id: current.id, version: current.version, status: current.status, title: current.title }
          : null,
        afterState: { id: created.id, version: created.version, status: created.status, title: created.title },
        ipAddress: ctx.ip
      });

      return { configured: true, ...this.mapSignature(created), alreadyActive: false };
    });
  }

  private assertEnabled(): void {
    if (process.env.ACTIVATION_CONTRACT_ENABLED !== "true") {
      throw new ServiceUnavailableException(
        "Merchant activation is gated until its M1 database migration is applied"
      );
    }
  }

  private mapWaitlist(row: WaitlistListRow) {
    return {
      id: row.id,
      topic: row.topic,
      email: row.email,
      locale: row.locale,
      city: row.city,
      businessName: row.businessName,
      source: row.source,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      contactedAt: row.contactedAt?.toISOString() ?? null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      decisionReason: row.decisionReason,
      assignedAdmin: row.assignedAdmin,
      reviewedByAdmin: row.reviewedByAdmin,
      connectedAt: row.connectedAt?.toISOString() ?? null,
      connectedBusiness: row.connectedBusiness,
      outboxMessages: row.outboxMessages.map((message) => ({
        id: message.id,
        kind: message.kind,
        status: message.status,
        attempts: message.attempts,
        lastError: message.lastError,
        createdAt: message.createdAt.toISOString(),
        sentAt: message.sentAt?.toISOString() ?? null
      }))
    };
  }

  private mapOutbox(row: OutboxListRow) {
    return {
      id: row.id,
      channel: row.channel,
      status: row.status,
      kind: row.kind,
      recipient: row.recipient,
      subject: row.subject,
      body: row.body,
      idempotencyKey: row.idempotencyKey,
      attempts: row.attempts,
      availableAt: row.availableAt.toISOString(),
      lockedAt: row.lockedAt?.toISOString() ?? null,
      sentAt: row.sentAt?.toISOString() ?? null,
      lastError: row.lastError,
      waitlistSignup: row.waitlistSignup,
      createdByAdmin: row.createdByAdmin,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }

  private mapSignature(signature: {
    id: string;
    adminUserId: string;
    version: number;
    displayName: string;
    title: string | null;
    status: AdminSignatureStatus;
    createdAt: Date;
    revokedAt: Date | null;
  }) {
    return {
      id: signature.id,
      adminUserId: signature.adminUserId,
      version: signature.version,
      displayName: signature.displayName,
      title: signature.title,
      status: signature.status,
      createdAt: signature.createdAt.toISOString(),
      revokedAt: signature.revokedAt?.toISOString() ?? null
    };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function signatureVersionFromPayload(payload: Prisma.JsonValue | null | undefined): number | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  const value = payload.signatureVersion;
  return typeof value === "number" ? value : null;
}

function withSignatureFooter(
  body: string,
  signature: { displayName: string; title: string | null; version: number }
): string {
  return `${body}\n\n— ${signature.displayName}${signature.title ? `\n${signature.title}` : ""}\nManzil Group\nOperational message · signature v${signature.version}`;
}

function defaultSubject(topic: WaitlistTopic, locale: string): string {
  const lang = locale === "uz" || locale === "ru" ? locale : "en";
  const subjects: Record<WaitlistTopic, Record<"uz" | "ru" | "en", string>> = {
    gurman: {
      uz: "Gurman tayyorlanmoqda — siz ro‘yxatdasiz",
      ru: "Gurman готовится — вы в списке",
      en: "Gurman is getting ready — you’re on the list"
    },
    city: {
      uz: "Manzil shahar so‘rovingiz qabul qilindi",
      ru: "Мы получили ваш запрос по городу в Manzil",
      en: "We received your Manzil city request"
    },
    pro: {
      uz: "Manzil for Business — keyingi qadam",
      ru: "Manzil for Business — следующий шаг",
      en: "Next step for your Manzil business profile"
    }
  };
  return subjects[topic][lang];
}

function defaultBody(
  signup: {
    topic: WaitlistTopic;
    locale: string;
    city: string | null;
    businessName: string | null;
  },
  signature: { displayName: string; title: string | null; version: number }
): string {
  const lang = signup.locale === "uz" || signup.locale === "ru" ? signup.locale : "en";
  const city = signup.city ?? (lang === "uz" ? "shahringiz" : lang === "ru" ? "вашем городе" : "your city");
  const business = signup.businessName ?? (lang === "uz" ? "biznesingiz" : lang === "ru" ? "вашего бизнеса" : "your business");
  const message =
    signup.topic === "gurman"
      ? {
          uz: "Gurman ro‘yxatiga qo‘shilganingiz uchun rahmat. Gurman mobil ilovasi hali ishlab chiqilmoqda. Ilova birinchi guruh uchun tayyor bo‘lganda yozamiz.\n\nHozircha yuklab olish havolasi yo‘q. Bu xabar yangilanish bo‘lib, darhol kirish va’dasi emas.",
          ru: "Спасибо, что присоединились к списку Gurman. Мобильное приложение Gurman ещё разрабатывается. Мы напишем, когда оно будет готово для первой группы.\n\nСсылки на скачивание пока нет. Это обновление, а не обещание немедленного доступа.",
          en: "Thanks for joining the Gurman list. We’ll write when the mobile app is ready for its first group.\n\nThere is no download link yet. This message is an update, not a promise of immediate access."
        }[lang]
      : signup.topic === "city"
        ? {
            uz: `${city}da Manzil bo‘lishini xohlayotganingizni bildirish uchun rahmat. So‘rovingiz qayd etildi; shahar rejasi aniq bo‘lganda yangilik ulashamiz.`,
            ru: `Спасибо, что сообщили о желании видеть Manzil в городе ${city}. Мы записали запрос и поделимся обновлением, когда план по городу станет яснее.`,
            en: `Thanks for telling us you want Manzil in ${city}. We’ve recorded the request and will share an update when the city plan is clearer.`
          }[lang]
        : {
            uz: `${business} uchun Manzil for Business xizmatiga qiziqishingiz uchun rahmat. Kompaniya profilingiz bo‘yicha keyingi amaliy qadamni yuboramiz.`,
            ru: `Спасибо за интерес к Manzil for Business для ${business}. Мы свяжемся с вами со следующим практическим шагом по профилю компании.`,
            en: `Thanks for your interest in Manzil for ${business}. We’ll follow up with the next practical step for your company profile.`
          }[lang];

  return `${message}\n\n— ${signature.displayName}${signature.title ? `\n${signature.title}` : ""}\nManzil Group\nOperational message · signature v${signature.version}`;
}
