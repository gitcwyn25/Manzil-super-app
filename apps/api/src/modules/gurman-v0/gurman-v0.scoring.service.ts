import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PUBLICLY_VISIBLE_BUSINESS } from "../business-visibility";
import { PrismaService } from "../prisma.service";
import type { Explanation, ExplanationFactor } from "../intelligence/explanation-engine";
import type { GurmanV0Decision, GurmanV0Intent, V0Candidate, V0Reason } from "./gurman-v0.types";

const DEFAULT_LIMIT = 5;

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  lat: unknown;
  lng: unknown;
  priceTier: string | null;
  avgRating: unknown;
  reviewCount: number;
  category: { slug: string; nameUz: string; nameRu: string; nameEn: string } | null;
};

@Injectable()
export class GurmanV0ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  async score(intent: GurmanV0Intent): Promise<GurmanV0Decision> {
    const rows = await this.prisma.business.findMany({
      where: PUBLICLY_VISIBLE_BUSINESS,
      select: {
        id: true,
        slug: true,
        name: true,
        lat: true,
        lng: true,
        priceTier: true,
        avgRating: true,
        reviewCount: true,
        category: { select: { slug: true, nameUz: true, nameRu: true, nameEn: true } }
      },
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }, { name: "asc" }],
      take: 200
    }) as unknown as BusinessRow[];

    const accepted: V0Candidate[] = [];
    const rejected: Array<{ businessId: string; reasonCodes: V0Reason[] }> = [];

    for (const row of rows) {
      const distance = distanceKm(intent, row);
      const rejection = rejectionReasons(intent, row, distance);
      if (rejection.length > 0) {
        rejected.push({ businessId: row.id, reasonCodes: rejection });
        continue;
      }

      const reasons = scoreReasons(intent, row, distance);
      const explanation = explanationFor(row, reasons);
      accepted.push({
        businessId: row.id,
        slug: row.slug,
        name: row.name,
        score: reasons.reduce((sum, reason) => sum + reason.scoreContribution, 0),
        reasonCodes: reasons,
        explanation
      });
    }

    accepted.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const limit = intent.limit ?? DEFAULT_LIMIT;
    const candidatePlans = accepted.slice(0, limit);
    const status = candidatePlans.length === 0 ? "insufficientData" : "ok";
    const primary = candidatePlans[0] ?? null;

    return {
      decisionId: randomUUID(),
      intent,
      candidatePlans,
      selectedPlan: primary,
      alternatives: candidatePlans.slice(1),
      reasonCodes: primary?.reasonCodes ?? [{ code: "insufficientData", scoreContribution: 0 }],
      confidence: confidence(candidatePlans.length, rows.length),
      explanation: {
        whySelected: primary ? [...primary.explanation.factors] : [],
        whyRejected: rejected,
        missingInformation: candidatePlans.length < limit ? ["more verified businesses"] : []
      },
      status,
      limitedResults: candidatePlans.length < limit
    };
  }
}

function rejectionReasons(intent: GurmanV0Intent, row: BusinessRow, distance: number | null): V0Reason[] {
  const reasons: V0Reason[] = [];
  if (intent.category && row.category && !categoryMatches(intent.category, row.category)) {
    reasons.push({ code: "category_mismatch", scoreContribution: 0 });
  }
  if (intent.radius != null && distance != null && distance > intent.radius) {
    reasons.push({ code: "outside_radius", scoreContribution: 0 });
  }
  if (intent.budget != null && priceTierValue(row.priceTier) > intent.budget) {
    reasons.push({ code: "over_budget", scoreContribution: 0 });
  }
  return reasons;
}

function scoreReasons(intent: GurmanV0Intent, row: BusinessRow, distance: number | null): V0Reason[] {
  const reasons: V0Reason[] = [];
  if (intent.budget != null && priceTierValue(row.priceTier) <= intent.budget) {
    reasons.push({ code: "budget_match", scoreContribution: 30 });
  }
  if (distance != null) {
    reasons.push({ code: "close_to_user", scoreContribution: Math.max(0, 25 - distance) });
  }
  if (Number(row.avgRating) > 0) {
    reasons.push({ code: "highly_rated_for_segment", scoreContribution: Math.min(30, Number(row.avgRating) * 6) });
  }
  if (intent.category && row.category && categoryMatches(intent.category, row.category)) {
    reasons.push({ code: "capability_match", scoreContribution: 15 });
  }
  return reasons.length > 0 ? reasons : [{ code: "highly_rated_for_segment", scoreContribution: 1 }];
}

function explanationFor(row: BusinessRow, reasons: V0Reason[]): Explanation {
  const factors: ExplanationFactor[] = reasons.map((reason) => ({
    code: reason.code === "close_to_user" ? "close_to_user" : reason.code === "budget_match" ? "budget_match" : "highly_rated_for_segment",
    evidence:
      reason.code === "close_to_user"
        ? { kind: "distance", distanceKm: 0 }
        : reason.code === "budget_match"
          ? { kind: "budget", estimated: { amountMinor: 0, currency: "UZS" }, limit: null }
          : { kind: "rating", rating: Number(row.avgRating), reviewCount: row.reviewCount, segment: null },
    weight: Math.min(1, Math.max(0, reason.scoreContribution / 100))
  }));
  return { factors: factors as [ExplanationFactor, ...ExplanationFactor[]], primary: factors[0], confidence: Math.min(1, factors.length / 3) };
}

function distanceKm(intent: GurmanV0Intent, row: BusinessRow): number | null {
  if (intent.latitude == null || intent.longitude == null || row.lat == null || row.lng == null) return null;
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  const dLat = ((lat - intent.latitude) * Math.PI) / 180;
  const dLng = ((lng - intent.longitude) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((intent.latitude * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function priceTierValue(value: string | null): number {
  const normalized = (value ?? "").toLowerCase();
  return normalized.includes("₽") || normalized.includes("$$$") || normalized.includes("premium") ? 3 : normalized.includes("$$") || normalized.includes("mid") ? 2 : 1;
}

function categoryMatches(query: string, category: BusinessRow["category"]): boolean {
  if (!category) return false;
  const normalized = query.trim().toLowerCase();
  return [category.slug, category.nameUz, category.nameRu, category.nameEn].some((value) => value.toLowerCase().includes(normalized));
}

function confidence(resultCount: number, catalogCount: number): number {
  if (resultCount === 0) return 0;
  return Math.min(1, 0.5 + resultCount / Math.max(1, Math.min(catalogCount, DEFAULT_LIMIT) * 2));
}
