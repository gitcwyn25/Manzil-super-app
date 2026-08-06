/**
 * Layer 3 (Knowledge Graph) — the Experience Graph.
 *
 * Doc 21: the center of the database is the Experience — a birthday is
 * who/budget/distance/cake/photos → book → remind → memories → return next
 * year: *a graph, not a checklist*. This module is the composition contract
 * that connects businesses, services, tasks, a timeline, the workspace, AI
 * involvement, campaigns, and future bookings around one experience node.
 *
 * Imports `core` and `knowledge-graph` only; it never reaches up into memory
 * or reasoning.
 */
import type {
  BudgetRange,
  Confidence,
  EntityId,
  ExperienceType,
  IsoDateTime,
  KnowledgeSource
} from "../core";

/**
 * A single unit of work inside an experience plan ("order cake", "book
 * venue"). Tasks are what the Workspace Timeline renders and what the
 * reasoning layer replans when something breaks.
 */
export interface ExperienceTask {
  readonly id: EntityId;
  readonly title: string;
  readonly status: "todo" | "in_progress" | "done" | "cancelled";
  /** The business fulfilling this task, once one is chosen. */
  readonly businessId: EntityId | null;
  /** The service being procured, when the task is a procurement. */
  readonly serviceId: EntityId | null;
  readonly dueAt: IsoDateTime | null;
}

/**
 * One moment on the Workspace Timeline (governance: "not a checklist — a
 * timeline users revisit before, during, and after the event").
 */
export interface ExperienceTimelineEntry {
  readonly at: IsoDateTime;
  readonly taskId: EntityId | null;
  readonly kind:
    | "task_completed"
    | "booking_confirmed"
    | "payment_made"
    | "reminder_scheduled"
    | "memory_captured"
    | "note_added";
  /** Short structured label ("Cake confirmed"), never conversation text. */
  readonly label: string;
}

/**
 * How the AI participated in an experience — recorded so "why is this in my
 * plan?" is always answerable and every AI action stays auditable (ADR-001).
 */
export interface ExperienceAiInvolvement {
  /** Recommendation ids (Layer 5 outputs) that were accepted into this plan. */
  readonly acceptedRecommendationIds: readonly EntityId[];
  /** Tasks the AI created (vs. the user adding them manually). */
  readonly aiCreatedTaskIds: readonly EntityId[];
  /** Whether event-aware suggestions are welcome for this plan (AI Bible strategic amendment). */
  readonly proactiveSuggestionsEnabled: boolean;
}

/**
 * A booking this experience expects to make later ("return next year",
 * "photographer still to book") — the graph remembers intent, not only
 * transactions.
 */
export interface FutureBookingIntent {
  readonly serviceId: EntityId | null;
  readonly businessId: EntityId | null;
  readonly targetWindowStart: IsoDateTime | null;
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
}

/**
 * The full composition around one experience node: everything the lifecycle
 * Discover → Decide → Plan → Experience → Remember → Return needs to hang
 * off a single id.
 */
export interface ExperienceComposition {
  readonly experienceId: EntityId;
  readonly experienceType: ExperienceType;
  readonly workspaceId: EntityId | null;
  readonly budget: BudgetRange | null;
  /** Providers currently part of the plan. */
  readonly businessIds: readonly EntityId[];
  /** Services being composed into the plan. */
  readonly serviceIds: readonly EntityId[];
  readonly tasks: readonly ExperienceTask[];
  readonly timeline: readonly ExperienceTimelineEntry[];
  readonly ai: ExperienceAiInvolvement;
  /** Campaigns applied or applicable to this plan. */
  readonly campaignIds: readonly EntityId[];
  /** Confirmed bookings already attached to the plan. */
  readonly bookingIds: readonly EntityId[];
  readonly futureBookings: readonly FutureBookingIntent[];
  readonly updatedAt: IsoDateTime;
}
