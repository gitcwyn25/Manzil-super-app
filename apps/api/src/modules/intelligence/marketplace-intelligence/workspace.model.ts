/**
 * Layer 2 (Marketplace Intelligence) — the workspace summarizer's model.
 *
 * The epic names seven summarizers and this is the seventh. It exists, it is
 * wired, it is scheduled — and it **always refuses**, because the relational
 * schema has no Workspace model. Not a thin one: none. Epic 04 kept the
 * `workspace` graph node contract-only for exactly this reason, and Epic 05's
 * `workspace_timeline` tier stores what is written to it and claims nothing
 * else.
 *
 * The refusal is `knowledge_missing`, never `marketplace_sparse`, and the
 * distinction is the whole point of having both: sparse means "ask again when
 * we have grown", missing means "no amount of growth fixes this — a table has
 * to exist first". A scheduler that could not tell them apart would retry a
 * workspace summary nightly, forever, for data no row can ever contain.
 *
 * When Epic 08 introduces the Smart Plan Workspace, this file gains a
 * computation and nothing else in the module changes: the summarizer, its job,
 * its slot, its freshness policy and its wiring are already here.
 *
 * Imports `core` and Layer 2 contracts only.
 */
import type { EntityId, ExperienceType, IsoDateTime } from "../core";
import { refuseUnknowable, type IntelligenceOutcome } from "./marketplace-intelligence.evidence";

/**
 * What a workspace summary will contain when there is a workspace to summarize.
 *
 * Declared now so Layer 5 can be written against the shape, exactly as Epic 03
 * shipped contracts before implementations. Nothing constructs one today.
 */
export interface WorkspaceSummary {
  readonly workspaceId: EntityId;
  readonly customerId: EntityId | null;
  readonly experienceType: ExperienceType | null;
  /** Providers the plan touches. */
  readonly businessIds: readonly EntityId[];
  readonly timelineEntryCount: number;
  /** Bookings the plan has actually secured. */
  readonly confirmedBookingCount: number;
  readonly generatedAt: IsoDateTime;
}

/** The stable key the refusal names, so a dashboard can group by it. */
export const WORKSPACE_MISSING_KEY = "workspace";

/**
 * Summarizes a workspace — that is, reports that this platform cannot.
 *
 * Deliberately a function rather than a thrown error or a null: the caller
 * receives the same `IntelligenceOutcome` every other model returns, so the
 * job, the metrics and the store treat it identically and nothing has to
 * special-case the summarizer that has nothing to say yet.
 */
export function computeWorkspaceSummary(
  workspaceId: EntityId,
  now: IsoDateTime
): IntelligenceOutcome<WorkspaceSummary> {
  return refuseUnknowable<WorkspaceSummary>("workspace_plan", {
    observations: 0,
    subjectId: workspaceId,
    at: now,
    scopeKey: `workspace:${workspaceId}`,
    missingKey: WORKSPACE_MISSING_KEY
  });
}
