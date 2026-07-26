import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { requireOwnedBusiness } from "../crm/business-ownership.util";
import { PrismaService } from "../prisma.service";
import { LegalService } from "./legal.service";

const LOCALES = ["uz", "ru", "en"];

function parseLocale(raw: string | undefined): string {
  return LOCALES.includes(raw ?? "") ? (raw as string) : "uz";
}

@Controller("legal")
export class LegalController {
  constructor(
    private readonly legal: LegalService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Public: the terms a business is about to accept at registration.
   *
   * Unauthenticated because the registration form renders it before the user
   * has committed to anything — requiring auth to read the terms would mean
   * agreeing before reading.
   */
  @Get("registration-terms")
  async registrationTerms(@Query("locale") locale?: string) {
    return { data: await this.legal.getRegistrationTerms(parseLocale(locale)) };
  }

  /** The signed contract for a business the caller owns. */
  @Get("businesses/:slug/contract")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async contract(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    const business = await requireOwnedBusiness(this.prisma, slug, request.manzilActor!);
    return { data: { contract: await this.legal.getContractForBusiness(business.id) } };
  }

  /** Which document versions this business has accepted. */
  @Get("businesses/:slug/acceptances")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async acceptances(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    const business = await requireOwnedBusiness(this.prisma, slug, request.manzilActor!);
    return { data: { acceptances: await this.legal.getAcceptancesForBusiness(business.id) } };
  }
}
