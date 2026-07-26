import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { Roles } from "../auth/roles.decorator";
import { EntitlementGuard } from "../plans/entitlement.guard";
import { RequireEntitlement } from "../plans/require-entitlement.decorator";
import { PrismaService } from "../prisma.service";
import { ThrottleVisit } from "../security/throttle.config";
import { AnalyticsRepository } from "./analytics.repository";
import { AnalyticsService } from "./analytics.service";
import { RecordEventDto } from "./analytics.dto";

/**
 * Window sizes the dashboards may request.
 *
 * An allowlist rather than a free integer: an unbounded `days` lets any owner
 * ask for a full-table scan, which is a cheap way to hurt the database.
 */
const ALLOWED_WINDOWS = [7, 30, 90] as const;

function parseWindow(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 30;

  const days = Number(raw);

  if (!ALLOWED_WINDOWS.includes(days as (typeof ALLOWED_WINDOWS)[number])) {
    throw new BadRequestException(`days must be one of: ${ALLOWED_WINDOWS.join(", ")}`);
  }

  return days;
}

@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly events: AnalyticsService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Client-reported funnel event (call tap, directions tap, photo view…).
   *
   * Public and anonymous, like the existing visit endpoint — these fire from
   * the public business profile before any sign-in. Throttled accordingly, and
   * the payload carries no identity: the visitor key is derived server-side.
   */
  @Post("businesses/:slug/events")
  @ThrottleVisit()
  async recordEvent(
    @Param("slug") slug: string,
    @Body() body: RecordEventDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string
  ) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    this.events.recordEvent({
      businessId: business.id,
      type: body.type,
      visitorKey: this.events.visitorKey(ip, userAgent),
      source: body.source ?? "web"
    });

    return { data: { recorded: true } };
  }

  /**
   * Owner dashboard data.
   *
   * Gated on `analytics.basic` through the existing PlanFeature entitlement
   * system; `EntitlementGuard` resolves the business from the `:slug` param.
   * Ownership itself is enforced separately below — an entitlement says which
   * *features* a plan includes, never who may read a given business.
   */
  @Get("businesses/:slug")
  @UseGuards(ManzilAuthGuard, EntitlementGuard)
  @RequireAuth()
  @RequireEntitlement("analytics.basic")
  async businessAnalytics(
    @Param("slug") slug: string,
    @Query("days") days: string | undefined,
    @Req() request: ManzilRequest
  ) {
    const actor = request.manzilActor!;

    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: { id: true, claimedByUserId: true }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    // Admins may inspect any business; owners only their own.
    if (actor.role !== "admin" && business.claimedByUserId !== actor.userId) {
      throw new NotFoundException("Business not found");
    }

    return { data: await this.analytics.businessOverview(business.id, parseWindow(days)) };
  }

}

export { parseWindow };
