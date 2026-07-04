import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import {
  CrmRepository,
  type AnnouncementInput,
  type BusinessRegistrationInput,
  type PackageInput
} from "../crm/crm.repository";

/**
 * Business CRM endpoints. Every route requires an authenticated user;
 * per-business ownership is enforced inside the repository.
 */
@Controller("crm")
@UseGuards(ManzilAuthGuard)
@RequireAuth()
export class CrmController {
  constructor(private readonly crm: CrmRepository) {}

  /* ---------- Registration ---------- */

  @Post("register")
  async register(@Body() body: BusinessRegistrationInput, @Req() request: ManzilRequest) {
    return { data: await this.crm.registerBusiness(body, request.manzilActor!) };
  }

  /* ---------- Announcements ---------- */

  @Get("businesses/:slug/announcements")
  async listAnnouncements(@Param("slug") slug: string, @Req() request: ManzilRequest) {
    return { data: { announcements: await this.crm.listAnnouncements(slug, request.manzilActor!) } };
  }

  @Post("businesses/:slug/announcements")
  async createAnnouncement(
    @Param("slug") slug: string,
    @Body() body: AnnouncementInput,
    @Req() request: ManzilRequest
  ) {
    return { data: { announcement: await this.crm.createAnnouncement(slug, body, request.manzilActor!) } };
  }

  @Patch("announcements/:id")
  async updateAnnouncement(
    @Param("id") id: string,
    @Body() body: Partial<AnnouncementInput>,
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
  async createPackage(
    @Param("slug") slug: string,
    @Body() body: PackageInput,
    @Req() request: ManzilRequest
  ) {
    return { data: { package: await this.crm.createPackage(slug, body, request.manzilActor!) } };
  }

  @Patch("packages/:id")
  async updatePackage(
    @Param("id") id: string,
    @Body() body: Partial<PackageInput>,
    @Req() request: ManzilRequest
  ) {
    return { data: { package: await this.crm.updatePackage(id, body, request.manzilActor!) } };
  }

  @Delete("packages/:id")
  async deletePackage(@Param("id") id: string, @Req() request: ManzilRequest) {
    return { data: await this.crm.deletePackage(id, request.manzilActor!) };
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
    @Body() body: { plan?: string },
    @Req() request: ManzilRequest
  ) {
    return {
      data: { subscription: await this.crm.chooseSubscription(slug, body.plan ?? "free", request.manzilActor!) }
    };
  }
}
