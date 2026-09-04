import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { BusinessApplicationStatus, Prisma } from "@prisma/client";
import { CacheService } from "../cache/cache.service";
import { LegalService, type ResolvedDocuments } from "../legal/legal.service";
import { PrismaService } from "../prisma.service";
import { requireReason, writeAudit } from "./audit.util";
import type { BusinessApplicationReviewStatus } from "./business-applications.dto";

type ActorCtx = { adminId: string; ip?: string | null };

type ApplicationWithRelations = Prisma.BusinessApplicationGetPayload<{
  include: {
    applicant: { select: { id: true; email: true; displayName: true; phone: true } };
    business: { select: { id: true; slug: true; name: true; status: true } };
    reviewer: { select: { id: true; email: true; displayName: true } };
  };
}>;

const REVIEWABLE_STATUSES = new Set<BusinessApplicationStatus>([
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "rejected"
]);

const ALLOWED_TRANSITIONS: Record<BusinessApplicationStatus, BusinessApplicationReviewStatus[]> = {
  draft: ["under_review", "changes_requested", "rejected"],
  submitted: ["under_review", "changes_requested", "approved", "rejected"],
  under_review: ["changes_requested", "approved", "rejected"],
  changes_requested: ["under_review", "approved", "rejected"],
  rejected: ["under_review"],
  approved: [],
  withdrawn: []
};

@Injectable()
export class BusinessApplicationsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly legal: LegalService
  ) {}

  async listApplications(params: { status?: string; q?: string; take?: number }) {
    const take = Math.min(Math.max(params.take ?? 50, 1), 100);
    const status = this.parseStatus(params.status);
    const q = params.q?.trim();
    const where: Prisma.BusinessApplicationWhereInput = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
              { district: { contains: q, mode: "insensitive" } },
              { applicant: { email: { contains: q, mode: "insensitive" } } },
              { applicant: { displayName: { contains: q, mode: "insensitive" } } }
            ]
          }
        : {})
    };

    const [applications, total, grouped] = await Promise.all([
      this.prisma.businessApplication.findMany({
        where,
        include: {
          applicant: { select: { id: true, email: true, displayName: true, phone: true } },
          business: { select: { id: true, slug: true, name: true, status: true } },
          reviewer: { select: { id: true, email: true, displayName: true } }
        },
        orderBy: [{ status: "asc" }, { submittedAt: "desc" }, { createdAt: "desc" }],
        take
      }),
      this.prisma.businessApplication.count({ where }),
      this.prisma.businessApplication.groupBy({ by: ["status"], _count: { _all: true } })
    ]);

    return {
      total,
      counts: Object.fromEntries(grouped.map((row) => [row.status, row._count._all])),
      applications: applications.map((application) => this.mapApplication(application))
    };
  }

  async getApplication(id: string) {
    const application = await this.prisma.businessApplication.findUnique({
      where: { id },
      include: {
        applicant: { select: { id: true, email: true, displayName: true, phone: true } },
        business: { select: { id: true, slug: true, name: true, status: true } },
        reviewer: { select: { id: true, email: true, displayName: true } }
      }
    });

    if (!application) throw new NotFoundException("Business application not found");
    return this.mapApplication(application);
  }

  async transitionApplication(
    id: string,
    status: BusinessApplicationReviewStatus,
    reason: string | undefined,
    ctx: ActorCtx
  ) {
    const normalizedReason = status === "changes_requested" || status === "rejected" ? requireReason(reason) : reason?.trim() || null;
    const snapshot = await this.prisma.businessApplication.findUnique({
      where: { id },
      select: { status: true, businessId: true, acceptedTermsVersion: true }
    });
    if (!snapshot) throw new NotFoundException("Business application not found");
    if (snapshot.status === status && (status !== "approved" || snapshot.businessId)) {
      return { id, status: snapshot.status, businessId: snapshot.businessId, alreadyApplied: true };
    }
    const legalDocuments = status === "approved" ? await this.resolveApprovalDocuments(snapshot.acceptedTermsVersion) : null;

    return this.prisma.$transaction(async (tx) => {
      const before = await tx.businessApplication.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("Business application not found");

      const allowed = ALLOWED_TRANSITIONS[before.status];
      if (!allowed.includes(status)) {
        if (before.status === status && (status !== "approved" || before.businessId)) {
          return { id, status: before.status, businessId: before.businessId, alreadyApplied: true };
        }
        throw new ConflictException(`Cannot move an application from ${before.status} to ${status}`);
      }

      let businessId = before.businessId;
      let businessSlug: string | null = null;
      if (status === "approved") {
        const created = await this.createApprovedBusiness(tx, before, legalDocuments!);
        businessId = created.id;
        businessSlug = created.slug;
      }

      const after = await tx.businessApplication.update({
        where: { id },
        data: {
          status,
          businessId,
          reviewNote: normalizedReason,
          // AdminUser is a separate credential identity from User. The signed
          // audit row below is the authoritative reviewer attribution.
          reviewedByUserId: null
        },
        include: {
          applicant: { select: { id: true, email: true, displayName: true, phone: true } },
          business: { select: { id: true, slug: true, name: true, status: true } },
          reviewer: { select: { id: true, email: true, displayName: true } }
        }
      });

      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: `business_application.${status}`,
        targetType: "business_application",
        targetId: id,
        beforeState: { status: before.status, businessId: before.businessId },
        afterState: { status: after.status, businessId: after.businessId },
        reason: normalizedReason,
        ipAddress: ctx.ip
      });

      return {
        id: after.id,
        status: after.status,
        businessId: after.businessId,
        businessSlug: businessSlug ?? after.business?.slug ?? null,
        application: this.mapApplication(after)
      };
    }, { timeout: 20_000, maxWait: 10_000 }).then(async (result) => {
      if (status === "approved" && !result.alreadyApplied) {
        await this.cache.invalidate("businesses", "admin", "home");
      }
      return result;
    });
  }

  private async resolveApprovalDocuments(acceptedTermsVersion: string | null): Promise<ResolvedDocuments> {
    if (!acceptedTermsVersion) {
      throw new ConflictException("The application has no recorded terms version and cannot be approved");
    }

    const [terms, privacy, template] = await Promise.all([
      this.prisma.legalDocument.findFirst({
        where: {
          kind: "terms_of_service",
          locale: "uz",
          publishedAt: { not: null },
          OR: [{ version: acceptedTermsVersion }, { id: acceptedTermsVersion }]
        }
      }),
      this.legal.getCurrent("privacy_policy", "uz"),
      this.legal.getCurrent("contract_template", "uz")
    ]);

    if (!terms) {
      throw new ConflictException("The accepted terms version is unavailable; request updated information before approval");
    }

    return { terms, privacy, template };
  }

  private async createApprovedBusiness(
    tx: Prisma.TransactionClient,
    application: Prisma.BusinessApplicationGetPayload<{}>,
    documents: ResolvedDocuments
  ) {
    if (application.businessId) {
      const existing = await tx.business.findUnique({ where: { id: application.businessId } });
      if (!existing) throw new ConflictException("The application points to a missing business");
      return existing;
    }

    const category = await tx.category.findUnique({ where: { slug: application.categorySlug } });
    if (!category) throw new ConflictException("The selected category is no longer available");

    const slug = await this.uniqueSlug(tx, application.name);
    const now = new Date();
    const business = await tx.business.create({
      data: {
        slug,
        name: application.name,
        categoryId: category.id,
        descriptionUz: application.descriptionUz,
        address: application.address,
        district: application.district,
        city: application.city,
        phone: application.phone,
        email: application.email,
        website: application.website,
        telegram: application.telegram,
        hoursJson: application.workingHours === null ? undefined : application.workingHours as Prisma.InputJsonValue,
        status: "claimed",
        claimedByUserId: application.applicantUserId,
        createdByUserId: application.applicantUserId,
        claimedAt: now
      }
    });

    await tx.user.update({
      where: { id: application.applicantUserId },
      data: { role: "business_owner" }
    });

    await tx.claim.create({
      data: {
        businessId: business.id,
        userId: application.applicantUserId,
        verificationMethod: "registration",
        status: "approved",
        note: "Approved from business application"
      }
    });

    await this.legal.recordAcceptance(
      tx,
      {
        businessId: business.id,
        userId: application.applicantUserId,
        ipAddress: application.acceptedTermsIp,
        userAgent: application.acceptedTermsUserAgent
      },
      { name: business.name, legalName: business.legalName, taxId: business.taxId },
      documents
    );

    return business;
  }

  private parseStatus(value: string | undefined): BusinessApplicationStatus | undefined {
    if (!value) return undefined;
    if (!REVIEWABLE_STATUSES.has(value as BusinessApplicationStatus) && !["approved", "withdrawn"].includes(value)) {
      throw new BadRequestException("Unknown business application status");
    }
    return value as BusinessApplicationStatus;
  }

  private async uniqueSlug(tx: Prisma.TransactionClient, name: string) {
    const base = name
      .toLowerCase()
      .replace(/[’ʻ`']/g, "")
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "business";

    let candidate = base;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const exists = await tx.business.findUnique({ where: { slug: candidate }, select: { id: true } });
      if (!exists) return candidate;
      candidate = `${base}-${attempt + 2}`;
    }
    throw new ConflictException("Could not allocate a unique business slug");
  }

  private mapApplication(application: ApplicationWithRelations) {
    return {
      id: application.id,
      status: application.status,
      name: application.name,
      categorySlug: application.categorySlug,
      descriptionUz: application.descriptionUz,
      address: application.address,
      district: application.district,
      city: application.city,
      phone: application.phone,
      email: application.email,
      website: application.website,
      telegram: application.telegram,
      workingHours: application.workingHours,
      acceptedTermsVersion: application.acceptedTermsVersion,
      acceptedTermsAt: application.acceptedTermsAt?.toISOString() ?? null,
      submittedAt: application.submittedAt?.toISOString() ?? null,
      reviewNote: application.reviewNote,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      applicant: application.applicant,
      business: application.business,
      reviewer: application.reviewer
    };
  }
}
