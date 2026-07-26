import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { LegalDocumentKind, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

export type AcceptanceContext = {
  businessId: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type PublishedDocument = {
  id: string;
  kind: LegalDocumentKind;
  version: string;
  body: string;
};

export type ResolvedDocuments = {
  terms: PublishedDocument | null;
  privacy: PublishedDocument | null;
  template: PublishedDocument | null;
};

/**
 * Terms acceptance and contract generation.
 *
 * Two rules drive the whole design:
 *
 * 1. An acceptance points at one exact document version. The current version is
 *    resolved once, at acceptance time, and recorded — so a later publish never
 *    changes what an existing business agreed to.
 * 2. A contract's text is rendered once and stored. Regenerating it on download
 *    from a template that may have changed since would hand the business a
 *    document it never agreed to, which is precisely the thing a contract is
 *    supposed to prevent.
 */
@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  /** Most recently published version of a document kind, or null if none is published. */
  async getCurrent(kind: LegalDocumentKind, locale = "uz") {
    return this.prisma.legalDocument.findFirst({
      where: { kind, locale, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" }
    });
  }

  /**
   * Public payload for the registration form: what the business is being asked
   * to agree to, and which version that is.
   */
  async getRegistrationTerms(locale = "uz") {
    const [terms, privacy, contract] = await Promise.all([
      this.getCurrent("terms_of_service", locale),
      this.getCurrent("privacy_policy", locale),
      this.getCurrent("contract_template", locale)
    ]);

    return {
      terms: terms
        ? { id: terms.id, version: terms.version, title: terms.title, body: terms.body }
        : null,
      privacy: privacy
        ? { id: privacy.id, version: privacy.version, title: privacy.title, body: privacy.body }
        : null,
      contractTemplateVersion: contract?.version ?? null
    };
  }

  /**
   * Resolves the document versions to bind an acceptance to.
   *
   * Deliberately **outside** any transaction: these are reads of immutable
   * published rows, and holding an interactive transaction open across them
   * blew Prisma's 5s timeout on a remote database (registration does ~10
   * sequential round trips). Resolve first, then write.
   */
  async resolveCurrentDocuments(locale = "uz"): Promise<ResolvedDocuments> {
    const [terms, privacy, template] = await Promise.all([
      this.getCurrent("terms_of_service", locale),
      this.getCurrent("privacy_policy", locale),
      this.getCurrent("contract_template", locale)
    ]);

    return { terms, privacy, template };
  }

  /**
   * Records acceptance and generates the contract inside the caller's
   * transaction, so registration and its legal record commit together or not
   * at all.
   *
   * Takes pre-resolved documents (see `resolveCurrentDocuments`) so the
   * transaction performs writes only.
   *
   * A missing terms document is not an error: registration still succeeds and
   * simply records nothing, because blocking every signup on an unpublished
   * document would be worse. The admin legal page warns about that state.
   */
  async recordAcceptance(
    tx: Prisma.TransactionClient,
    context: AcceptanceContext,
    business: { name: string; legalName: string | null; taxId: string | null },
    documents: ResolvedDocuments
  ): Promise<{ contractNo: string | null; acceptedVersions: string[] }> {
    const { terms, privacy, template } = documents;
    const acceptedVersions: string[] = [];

    for (const document of [terms, privacy]) {
      if (!document) continue;

      await tx.legalAcceptance.upsert({
        where: {
          businessId_documentId: { businessId: context.businessId, documentId: document.id }
        },
        update: {},
        create: {
          businessId: context.businessId,
          userId: context.userId,
          documentId: document.id,
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent?.slice(0, 500) ?? null
        }
      });

      acceptedVersions.push(`${document.kind}@${document.version}`);
    }

    if (!template) {
      return { contractNo: null, acceptedVersions };
    }

    // Also record acceptance of the contract template itself, so the contract
    // is traceable to a version the business agreed to.
    await tx.legalAcceptance.upsert({
      where: { businessId_documentId: { businessId: context.businessId, documentId: template.id } },
      update: {},
      create: {
        businessId: context.businessId,
        userId: context.userId,
        documentId: template.id,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent?.slice(0, 500) ?? null
      }
    });
    acceptedVersions.push(`${template.kind}@${template.version}`);

    const existing = await tx.contract.findFirst({
      where: { businessId: context.businessId, documentId: template.id }
    });

    if (existing) {
      return { contractNo: existing.contractNo, acceptedVersions };
    }

    const contractNo = buildContractNo();

    await tx.contract.create({
      data: {
        businessId: context.businessId,
        documentId: template.id,
        contractNo,
        renderedBody: renderTemplate(template.body, {
          businessName: business.name,
          legalName: business.legalName ?? business.name,
          taxId: business.taxId ?? "—",
          contractNo,
          date: new Date().toISOString().slice(0, 10)
        })
      }
    });

    return { contractNo, acceptedVersions };
  }

  /** The business's own contract, for download from their dashboard. */
  async getContractForBusiness(businessId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { businessId },
      orderBy: { generatedAt: "desc" },
      include: { document: { select: { version: true, title: true } } }
    });

    if (!contract) {
      throw new NotFoundException("No contract has been generated for this business");
    }

    return {
      id: contract.id,
      contractNo: contract.contractNo,
      templateVersion: contract.document.version,
      title: contract.document.title,
      body: contract.renderedBody,
      generatedAt: contract.generatedAt.toISOString()
    };
  }

  /** Documents a given business has accepted, for their settings page. */
  async getAcceptancesForBusiness(businessId: string) {
    const acceptances = await this.prisma.legalAcceptance.findMany({
      where: { businessId },
      orderBy: { acceptedAt: "desc" },
      include: { document: { select: { kind: true, version: true, title: true, locale: true } } }
    });

    return acceptances.map((acceptance) => ({
      id: acceptance.id,
      kind: acceptance.document.kind,
      version: acceptance.document.version,
      title: acceptance.document.title,
      locale: acceptance.document.locale,
      acceptedAt: acceptance.acceptedAt.toISOString()
    }));
  }

  /** Throws unless the named document version is the currently published one. */
  async assertIsCurrentVersion(kind: LegalDocumentKind, version: string, locale = "uz") {
    const current = await this.getCurrent(kind, locale);

    if (!current) return;

    if (current.version !== version) {
      throw new BadRequestException(
        `The terms have been updated to version ${current.version}. Please reload and review them before continuing.`
      );
    }
  }
}

/**
 * Contract number: MZ-<year>-<random>. Random rather than sequential because a
 * sequential counter would leak how many businesses have registered, and would
 * need its own locking to stay unique under concurrent registration.
 */
function buildContractNo(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MZ-${year}-${suffix}`;
}

/** Substitutes {{placeholders}}. Unknown placeholders are left as-is so a template typo is visible rather than silently blank. */
function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
  );
}
