/**
 * Layer 0 — shared vocabulary of the Intelligence Platform.
 *
 * Every layer (2–6) imports these primitives and nothing else from outside its
 * own layer boundary, so the cross-layer contract surface stays tiny and the
 * import direction (lower layers never import higher ones) stays auditable by
 * reading import statements alone.
 *
 * Nothing here is an algorithm and nothing here knows about LLMs — these are
 * the atoms that structured knowledge is written in.
 */

/**
 * Opaque identifier of a graph entity or domain row.
 *
 * A plain string alias (not a brand) because ids cross the Prisma boundary,
 * cache keys, and HTTP DTOs constantly; the graph layer's discriminated
 * `type` field is the real safety net against mixing entity kinds.
 */
export type EntityId = string;

/**
 * How sure the platform is that a piece of knowledge is true, in [0, 1].
 *
 * Confidence is mandatory on every derived fact (doc 22: `{preference:
 * cuisine=japanese, confidence: 0.91, …}`) — a fact without a confidence is
 * unrepresentable in this module on purpose, because ranking and explanation
 * both key off it.
 */
export type Confidence = number;

/** ISO-8601 timestamp string, e.g. `2026-08-06T09:30:00Z`. */
export type IsoDateTime = string;

/** ISO-8601 calendar date string, e.g. `2026-08-15`. */
export type IsoDate = string;

/**
 * Where a piece of derived knowledge came from.
 *
 * Doc 22's memory example carries `source: conversation`; the Trust Engine and
 * the explanation layer both need provenance to answer "why does the platform
 * believe this?". `conversation` means *structured facts extracted from* a
 * conversation — never a transcript (raw chat is banned from this module).
 */
export type KnowledgeSource =
  | "onboarding"
  | "conversation"
  | "booking"
  | "review"
  | "story"
  | "visit"
  | "workspace"
  | "campaign"
  | "merchant_input"
  | "platform_inference"
  | "verification";

/**
 * A tuple type that cannot be empty.
 *
 * Used wherever the architecture makes emptiness illegal — most importantly
 * `Explanation.factors`: a recommendation without at least one explainable
 * factor must not compile (AI Bible: every recommendation answers "why?").
 */
export type NonEmptyArray<T> = [T, ...T[]];

/** Supported marketplace locales, aligned with the existing Gurman seed. */
export type IntelligenceLocale = "uz" | "ru" | "en";

/**
 * Money as integer minor units plus currency.
 *
 * Kept as a primitive here because budgets appear in constraints (Layer 5),
 * preferences (Layer 4), and marketplace facts (Layer 2) alike.
 */
export interface MoneyAmount {
  /** Amount in the currency's minor unit (tiyin, cents). */
  readonly amountMinor: number;
  /** ISO-4217 code, e.g. `UZS`. */
  readonly currency: string;
}

/** Inclusive budget band; either bound may be open. */
export interface BudgetRange {
  readonly min: MoneyAmount | null;
  readonly max: MoneyAmount | null;
}

/** WGS-84 coordinate pair. */
export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * A half-open time window `[start, end)`.
 *
 * The shared shape for availability slots, peak hours, event windows, and
 * memory expiry checks.
 */
export interface TimeWindow {
  readonly start: IsoDateTime;
  readonly end: IsoDateTime;
}

/**
 * Day-of-week in ISO order; used by peak-hour and availability contracts.
 */
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/**
 * A recurring weekly window (e.g. "Fridays 18:00–22:00 is peak").
 *
 * Times are local wall-clock `HH:mm` — marketplace facts like peak hours are
 * meaningful in the business's own timezone, not UTC.
 */
export interface WeeklyWindow {
  readonly day: DayOfWeek;
  readonly startLocalTime: string;
  readonly endLocalTime: string;
}

/**
 * A single structured fact with provenance.
 *
 * The atom of "memory = structured knowledge, never chat" (doc 22): a typed
 * value, who said so, how sure we are, and when we learned it. Layers 2–4 are
 * built out of these.
 */
export interface KnowledgeFact<TValue> {
  readonly value: TValue;
  readonly source: KnowledgeSource;
  readonly confidence: Confidence;
  readonly observedAt: IsoDateTime;
}

/**
 * The kinds of experience the platform composes (Epic 03 canonical set).
 *
 * Lives in Layer 0 because every layer speaks it: graph nodes (Layer 3),
 * business summaries' "suitable experiences" (Layer 2), memory tiers
 * (Layer 4), and intent analysis (Layer 5). Extend deliberately, with corpus
 * backing.
 */
export type ExperienceType =
  | "birthday"
  | "wedding"
  | "coffee"
  | "haircut"
  | "dinner"
  | "travel"
  | "family-day"
  | "business-meeting"
  | "weekend";

/**
 * The six memory tiers, as names. Lives in Layer 0 because the event catalog
 * (`core/events`) announces which tiers changed and Layer 4 defines what each
 * tier *contains* — the vocabulary is shared, the shapes are not.
 */
export type MemoryTier =
  | "mission_context"
  | "preference_context"
  | "relationship_context"
  | "workspace_timeline"
  | "business_context"
  | "marketplace_context";
