import { Injectable, Logger } from "@nestjs/common";
import type { BusinessEventType } from "@prisma/client";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma.service";

/**
 * Writes the analytics events the dashboards read.
 *
 * `BusinessEvent` and `SearchQueryLog` exist in the schema but had no writer
 * anywhere in the codebase — every row count was zero. Dashboards built on them
 * would have rendered empty regardless of traffic, so collection has to ship
 * before (or with) the reporting UI.
 *
 * Every method here is **fire-and-forget**: analytics must never fail, slow, or
 * roll back the user-facing request that triggered it. Failures are logged once
 * and swallowed.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private warnedOnce = false;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pseudonymous visitor identifier.
   *
   * Hashing IP+user-agent means the dashboard can count *unique* visitors
   * without the analytics tables becoming a log of who visited which business —
   * the raw address is never stored. This mirrors the existing `recordVisit`
   * convention so visit and event data bucket to the same visitor.
   */
  visitorKey(ip: string | undefined, userAgent: string | undefined): string {
    return createHash("sha256")
      .update(`${ip ?? "unknown"}|${userAgent ?? ""}`)
      .digest("hex")
      .slice(0, 32);
  }

  /** Records a funnel event (view → call/directions/message/photo_view). */
  recordEvent(input: {
    businessId: string;
    type: BusinessEventType;
    visitorKey?: string;
    source?: string;
  }): void {
    void this.prisma.businessEvent
      .create({
        data: {
          businessId: input.businessId,
          type: input.type,
          visitorKey: input.visitorKey ?? null,
          source: input.source ?? "web"
        }
      })
      .catch((error) => this.swallow("businessEvent", error));
  }

  /**
   * Records a search.
   *
   * Called on every request rather than inside the cached loader — search
   * results are cached, so logging there would record only cache misses and
   * silently under-report the popular queries that matter most.
   */
  recordSearch(input: {
    query: string;
    categorySlug?: string;
    district?: string;
    resultCount: number;
  }): void {
    const query = input.query.trim();

    // An empty query is a category browse, not a search; logging it would
    // dominate the zero-result report with meaningless rows.
    if (query.length === 0) {
      return;
    }

    void this.prisma.searchQueryLog
      .create({
        data: {
          query: query.slice(0, 200),
          categorySlug: input.categorySlug === "all" ? null : (input.categorySlug ?? null),
          district: input.district ?? null,
          resultCount: input.resultCount
        }
      })
      .catch((error) => this.swallow("searchQueryLog", error));
  }

  private swallow(table: string, error: unknown) {
    if (!this.warnedOnce) {
      this.warnedOnce = true;
      this.logger.warn(
        `Analytics write to ${table} failed (suppressing further warnings): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
