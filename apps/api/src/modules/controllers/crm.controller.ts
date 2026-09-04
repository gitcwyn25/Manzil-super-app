import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { CrmRepository } from "../crm/crm.repository";
import { LegalService } from "../legal/legal.service";
import { CustomersRepository } from "../crm/customers.repository";
import { SegmentsRepository, type SegmentKey } from "../crm/segments.repository";
import { CampaignsRepository } from "../crm/campaigns.repository";
import { CreateCampaignDto, SetCampaignActiveDto } from "../crm/campaigns.dto";
import { SetConsentDto } from "../crm/consent.dto";
import { BookingsRepository } from "../crm/bookings.repository";
import { CreateBookingDto, SetBookingStatusDto } from "../crm/bookings.dto";
import { EntitlementGuard } from "../plans/entitlement.guard";
import { RequireEntitlement } from "../plans/require-entitlement.decorator";
import {
  AnnouncementDto,
  AnnouncementUpdateDto,
  BusinessApplicationDto,
  BusinessRegistrationDto,
  ChooseSubscriptionDto,
  PackageDto,
  PackageUpdateDto
} from "../crm/crm.dto";
import { ThrottleRegister, ThrottleWrite } from "../security/throttle.config";

/**
 * Business CRM endpoints. Every route requires an authenticated user;
 * per-business ownership is enforced inside the repository.
 */
@Controller("crm")
@UseGuards(ManzilAuthGuard)
@RequireAuth()
export class CrmController {
  constructor(
    private readonly crm: CrmRepository,
    private readonly customers: CustomersRepository,
    private readonly legal: LegalService,
    private readonly segments: SegmentsRepository,
    private readonly campaigns: CampaignsRepository,
    private readonly bookings: BookingsRepository
  ) {}

  /* ---------- Registration ---------- */

  @Post("register")
  @ThrottleRegister()
  async register(
    @Body() body: BusinessRegistrationDto,
    @Req() request: ManzilRequest,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string
  ) {
    // Reject a stale form before creating anything: if the terms changed while
    // the page was open, the version the user actually read is no longer the
    // one we would record.
    if (body.acceptedTermsVersion) {
      await this.legal.assertIsCurrentVersion("terms_of_service", body.acceptedTermsVersion);
    }

    return {
      data: await this.crm.registerBusiness(body, request.manzilActor!, {
        acceptedTerms: body.acceptedTerms,
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null
      })
    };
  }

  @Post("applications")
  @ThrottleRegister()
  async submitApplication(
    @Body() body: BusinessApplicationDto,
    @Req() request: ManzilRequest,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string
  ) {
    await this.legal.assertIsCurrentVersion("terms_of_service", body.acceptedTermsVersion);
    return {
      data: await this.crm.submitBusinessApplication(body, request.manzilActor!, {
        acceptedTerms: body.acceptedTerms,
        acceptedTermsVersion: body.acceptedTermsVersion,
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null
      })
    };
  }

  @Get("applications/:id")
  async getApplication(@Param("id") id: string, @Req() request: ManzilRequest) {
    return { data: await this.crm.getBusinessApplication(id, request.manzilActor!) };
  }

  /* ---------- Announcements ---------- */

  @Get("businesses/:slug/announcements")
  async listAnnouncements(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    return { data: { announcements: await this.crm.listAnnouncements(slug, request.manzilActor!) } };
  }

  @Post("businesses/:slug/announcements")
  @ThrottleWrite()
  async createAnnouncement(
    @Param("slug") slug: string,
    @Body() body: AnnouncementDto,
    @Req() request: ManzilRequest
  ) {
    return { data: { announcement: await this.crm.createAnnouncement(slug, body, request.manzilActor!) } };
  }

  @Patch("announcements/:id")
  async updateAnnouncement(
    @Param("id") id: string,
    @Body() body: AnnouncementUpdateDto,
    @Req() request: ManzilRequest
  ) {
    return { data: { announcement: await this.crm.updateAnnouncement(id, body, request.manzilActor!) } };
  }

  @Delete("announcements/:id")
  async deleteAnnouncement(@Param("id") id: string, @Req() request: ManzilRequest) {
    return { data: await this.crm.deleteAnnouncement(id, request.manzilActor!) };
  }

  /* ---------- Packages ---------- */

  @Get("businesses/:slug/packages")
  async listPackages(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    return { data: { packages: await this.crm.listPackages(slug, request.manzilActor!) } };
  }

  @Post("businesses/:slug/packages")
  @ThrottleWrite()
  async createPackage(
    @Param("slug") slug: string,
    @Body() body: PackageDto,
    @Req() request: ManzilRequest
  ) {
    return { data: { package: await this.crm.createPackage(slug, body, request.manzilActor!) } };
  }

  @Patch("packages/:id")
  async updatePackage(
    @Param("id") id: string,
    @Body() body: PackageUpdateDto,
    @Req() request: ManzilRequest
  ) {
    return { data: { package: await this.crm.updatePackage(id, body, request.manzilActor!) } };
  }

  @Delete("packages/:id")
  async deletePackage(@Param("id") id: string, @Req() request: ManzilRequest) {
    return { data: await this.crm.deletePackage(id, request.manzilActor!) };
  }

  /* ---------- Bookings ---------- */

  @Get("businesses/:slug/bookings")
  async listBookings(
    @Param("slug") slug: string,
    @Query("status") status: string | undefined,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("take") take: string | undefined,
    @Query("skip") skip: string | undefined,
    @Req() request: ManzilRequest
  ) {
    return {
      data: await this.bookings.listBookings(
        slug,
        {
          status,
          from,
          to,
          take: take !== undefined ? Number(take) : undefined,
          skip: skip !== undefined ? Number(skip) : undefined
        },
        request.manzilActor!
      )
    };
  }

  @Post("businesses/:slug/bookings")
  @ThrottleWrite()
  async createBooking(
    @Param("slug") slug: string,
    @Body() body: CreateBookingDto,
    @Req() request: ManzilRequest
  ) {
    return { data: { booking: await this.bookings.createBooking(slug, body, request.manzilActor!) } };
  }

  @Patch("bookings/:id/status")
  @ThrottleWrite()
  async setBookingStatus(
    @Param("id") id: string,
    @Body() body: SetBookingStatusDto,
    @Req() request: ManzilRequest
  ) {
    return {
      data: { booking: await this.bookings.setStatus(id, body.status, request.manzilActor!) }
    };
  }

  /* ---------- Customers (M0: read-only) ---------- */

  @Get("businesses/:slug/customers")
  async listCustomers(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    return { data: { customers: await this.customers.listCustomers(slug, request.manzilActor!) } };
  }

  @Get("businesses/:slug/customers/:customerId")
  async getCustomer(
    @Param("slug") slug: string,
    @Param("customerId") customerId: string,
    @Req() request: ManzilRequest
  ) {
    return {
      data: { customer: await this.customers.getCustomer(slug, customerId, request.manzilActor!) }
    };
  }


  /* ---------- Segments (M2) ---------- */

  @Get("businesses/:slug/segments")
  @UseGuards(ManzilAuthGuard, EntitlementGuard)
  @RequireEntitlement("crm.segments")
  async listSegments(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    return { data: await this.segments.listSegments(slug, request.manzilActor!) };
  }

  @Get("businesses/:slug/segments/:key")
  @UseGuards(ManzilAuthGuard, EntitlementGuard)
  @RequireEntitlement("crm.segments")
  async segmentMembers(
    @Param("slug") slug: string,
    @Param("key") key: string,
    @Req() request: ManzilRequest
  ) {
    return {
      data: {
        customers: await this.segments.getSegmentMembers(
          slug,
          key as SegmentKey,
          request.manzilActor!
        )
      }
    };
  }

  /* ---------- Marketing consent (M5) ---------- */

  /**
   * Records or withdraws a customer's marketing consent.
   *
   * Separate from the general customer edit surface on purpose: consent is the
   * gate every campaign checks, so changing it is its own deliberate action
   * with its own timestamp, never a side effect of editing a name.
   */
  @Post("businesses/:slug/customers/:customerId/consent")
  @ThrottleWrite()
  async setConsent(
    @Param("slug") slug: string,
    @Param("customerId") customerId: string,
    @Body() body: SetConsentDto,
    @Req() request: ManzilRequest
  ) {
    return {
      data: await this.customers.setMarketingConsent(
        slug,
        customerId,
        body.consentMarketing,
        request.manzilActor!
      )
    };
  }

  /* ---------- Campaigns (M4) ---------- */

  @Get("businesses/:slug/campaigns")
  @UseGuards(ManzilAuthGuard, EntitlementGuard)
  @RequireEntitlement("crm.campaigns")
  async listCampaigns(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    return { data: { campaigns: await this.campaigns.listCampaigns(slug, request.manzilActor!) } };
  }

  @Post("businesses/:slug/campaigns")
  @ThrottleWrite()
  @UseGuards(ManzilAuthGuard, EntitlementGuard)
  @RequireEntitlement("crm.campaigns")
  async createCampaign(
    @Param("slug") slug: string,
    @Body() body: CreateCampaignDto,
    @Req() request: ManzilRequest
  ) {
    return { data: await this.campaigns.createCampaign(slug, body, request.manzilActor!) };
  }

  @Patch("campaigns/:id/active")
  async setCampaignActive(
    @Param("id") id: string,
    @Body() body: SetCampaignActiveDto,
    @Req() request: ManzilRequest
  ) {
    return {
      data: await this.campaigns.setCampaignActive(id, body.isActive, request.manzilActor!)
    };
  }

  @Post("campaigns/:id/run")
  @ThrottleWrite()
  async runCampaign(@Param("id") id: string, @Req() request: ManzilRequest) {
    return { data: await this.campaigns.runCampaign(id, request.manzilActor!) };
  }

  @Get("campaigns/:id/sends")
  async campaignSends(@Param("id") id: string, @Req() request: ManzilRequest) {
    return { data: { sends: await this.campaigns.getCampaignSends(id, request.manzilActor!) } };
  }

  /* ---------- Statistics ---------- */

  @Get("businesses/:slug/stats")
  async stats(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    return { data: await this.crm.getStats(slug, request.manzilActor!) };
  }

  /* ---------- Subscription ---------- */

  @Get("businesses/:slug/subscription")
  async subscription(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    return { data: { subscription: await this.crm.getSubscription(slug, request.manzilActor!) } };
  }

  @Post("businesses/:slug/subscription")
  async chooseSubscription(
    @Param("slug") slug: string,
    @Body() body: ChooseSubscriptionDto,
    @Req() request: ManzilRequest
  ) {
    return {
      data: { subscription: await this.crm.chooseSubscription(slug, body.plan ?? "free", request.manzilActor!) }
    };
  }
}
