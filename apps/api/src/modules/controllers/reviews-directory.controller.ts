import { Body, Controller, Delete, Get, Headers, Ip, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { DatabaseRepository } from "../repositories/database.repository";
import { ThrottleRegister, ThrottleWrite } from "../security/throttle.config";
import { BusinessRegistrationDto } from "../crm/crm.dto";
import { CrmRepository } from "../crm/crm.repository";
import { LegalService } from "../legal/legal.service";

export class DirectorySearchDto {
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
}
export class SavedListDto {
  @IsOptional() @IsIn(["favorites", "want_to_try", "visited"]) listType?: string;
}

@Controller("reviews-directory")
export class ReviewsDirectoryController {
  constructor(private readonly repository: DatabaseRepository, private readonly crm: CrmRepository, private readonly legal: LegalService) {}

  @Get()
  async list(@Query() query: DirectorySearchDto) {
    return { data: await this.repository.listReviewsDirectory(query.q, query.category) };
  }

  @Get("businesses/:slug")
  async business(@Param("slug") slug: string) {
    return { data: await this.repository.getReviewsDirectoryBusiness(slug) };
  }

  @Post("businesses") @ThrottleRegister() @UseGuards(ManzilAuthGuard) @RequireAuth()
  async submitBusiness(@Body() body: BusinessRegistrationDto, @Req() request: ManzilRequest,
    @Ip() ip: string, @Headers("user-agent") userAgent?: string) {
    if (body.acceptedTermsVersion) await this.legal.assertIsCurrentVersion("terms_of_service", body.acceptedTermsVersion);
    return { data: await this.crm.registerBusiness(body, request.manzilActor!, {
      acceptedTerms: body.acceptedTerms, ipAddress: ip ?? null, userAgent: userAgent ?? null
    }, { approvalRequired: true }) };
  }

  @Get("profile") @UseGuards(ManzilAuthGuard) @RequireAuth()
  async profile(@Req() request: ManzilRequest) {
    return { data: await this.repository.getReviewsDirectoryProfile(request.manzilActor!) };
  }

  @Get("favorites") @UseGuards(ManzilAuthGuard) @RequireAuth()
  async favorites(@Req() request: ManzilRequest) {
    return { data: await this.repository.listSavedPlaces(request.manzilActor!) };
  }

  @Put("favorites/:businessId") @ThrottleWrite() @UseGuards(ManzilAuthGuard) @RequireAuth()
  async save(@Param("businessId") businessId: string, @Query() query: SavedListDto, @Req() request: ManzilRequest) {
    return { data: await this.repository.savePlace(businessId, query.listType ?? "favorites", request.manzilActor!) };
  }

  @Delete("favorites/:businessId") @ThrottleWrite() @UseGuards(ManzilAuthGuard) @RequireAuth()
  async remove(@Param("businessId") businessId: string, @Query() query: SavedListDto, @Req() request: ManzilRequest) {
    return { data: await this.repository.removeSavedPlace(businessId, query.listType ?? "favorites", request.manzilActor!) };
  }
}
