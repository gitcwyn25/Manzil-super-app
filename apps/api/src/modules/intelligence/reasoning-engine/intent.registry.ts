/**
 * Layer 5 (Reasoning) — the intent registry.
 *
 * Patch B: the IntentAnalyzer must not *know* intents — it classifies into
 * whatever the registry declares, so adding an intent is a registry entry,
 * never an enum edit scattered across analyzers, routers, and copy. The
 * open-registry pattern (declaration merging) is the same one the
 * relationship, event, and job catalogs use.
 */
import type { EntityId } from "../core";

/** The essentials reasoning may need to clarify (AI Bible: as few as possible). */
export type ClarificationField =
  | "budget"
  | "date"
  | "guest_count"
  | "location"
  | "experience_type"
  | "time";

/** What the registry knows about one intent — data, not behavior. */
export interface IntentDefinition {
  /** One sentence: what the user is trying to accomplish. */
  readonly description: string;
  /** Fields worth clarifying when memory cannot answer them. */
  readonly clarifiableFields: readonly ClarificationField[];
  /** Whether this intent operates on an existing plan/booking (needs a subject entity). */
  readonly requiresSubjectEntity: boolean;
}

/**
 * The open registry of intents. Extend via declaration merging — new keys
 * arrive with their definitions, and `IntentKey` widens automatically.
 */
export interface IntentRegistryEntries {
  readonly PLAN_EVENT: IntentDefinition;
  readonly BOOK_SERVICE: IntentDefinition;
  readonly REPLACE_BUSINESS: IntentDefinition;
  readonly COMPARE: IntentDefinition;
  readonly DISCOVER: IntentDefinition;
  readonly MODIFY_WORKSPACE: IntentDefinition;
  readonly UPDATE_BOOKING: IntentDefinition;
  readonly ADD_GUEST: IntentDefinition;
  readonly REMOVE_GUEST: IntentDefinition;
  readonly FIND_BETTER_OPTION: IntentDefinition;
}

/** The open set of intent keys — the only legal values of `Intent.kind`. */
export type IntentKey = keyof IntentRegistryEntries;

/**
 * Seed definitions for the ten core intents. Typed data, not exhaustive by
 * type over the merged registry — modules that merge new intent keys ship
 * their own definitions to the registry implementation.
 */
export const INTENT_CATALOG = {
  PLAN_EVENT: {
    description: "Compose a complete multi-service experience (birthday, wedding, trip).",
    clarifiableFields: ["experience_type", "date", "guest_count", "budget", "location"],
    requiresSubjectEntity: false
  },
  BOOK_SERVICE: {
    description: "Secure one concrete service (table, haircut, room) now or at a time.",
    clarifiableFields: ["date", "time", "guest_count", "location"],
    requiresSubjectEntity: false
  },
  REPLACE_BUSINESS: {
    description: "Swap one provider in an existing plan while preserving its constraints.",
    clarifiableFields: [],
    requiresSubjectEntity: true
  },
  COMPARE: {
    description: "Put named candidates side by side on the factors that matter to the mission.",
    clarifiableFields: ["budget"],
    requiresSubjectEntity: false
  },
  DISCOVER: {
    description: "Open-ended exploration of what fits a mood, mission, or moment.",
    clarifiableFields: ["location", "budget"],
    requiresSubjectEntity: false
  },
  MODIFY_WORKSPACE: {
    description: "Change plan structure: tasks, timeline, budget lines, notes.",
    clarifiableFields: [],
    requiresSubjectEntity: true
  },
  UPDATE_BOOKING: {
    description: "Move, resize, or cancel an existing booking.",
    clarifiableFields: ["date", "time"],
    requiresSubjectEntity: true
  },
  ADD_GUEST: {
    description: "Add a participant to a planned experience (may cascade capacity constraints).",
    clarifiableFields: ["guest_count"],
    requiresSubjectEntity: true
  },
  REMOVE_GUEST: {
    description: "Remove a participant from a planned experience.",
    clarifiableFields: [],
    requiresSubjectEntity: true
  },
  FIND_BETTER_OPTION: {
    description: "Beat the current choice on stated dimensions without losing satisfied constraints.",
    clarifiableFields: [],
    requiresSubjectEntity: true
  }
} as const;

/**
 * Query API of the registry. The analyzer consumes this — it never imports
 * an intent list of its own.
 */
export interface IntentRegistry {
  definition(key: IntentKey): Promise<IntentDefinition | null>;
  keys(): Promise<readonly IntentKey[]>;
  /** Intents applicable to a subject entity (booking → UPDATE_BOOKING, …). */
  applicableTo(subjectEntityId: EntityId): Promise<readonly IntentKey[]>;
}
