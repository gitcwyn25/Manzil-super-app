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
  Req,
  UseGuards
} from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { CrmRepository } from "../crm/crm.repository";
import { LegalService } from "../legal/legal.service";
import { CustomersRepository } from "../crm/customers.repository";
import {
  AnnouncementDto,
  AnnouncementUpdateDto,
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
    private readonly legal: LegalService
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
