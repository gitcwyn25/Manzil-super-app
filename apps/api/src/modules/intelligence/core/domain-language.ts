/**
 * Layer 0 — THE domain language. One canonical typed term per concept.
 *
 * Patch D (CTO follow-up to Epic 03): synonyms are how architectures rot —
 * when "reservation", "booking", and "appointment" drift into three shapes,
 * every integration pays forever. This file is the single vocabulary:
 * every domain concept has exactly one canonical term, one canonical type,
 * and one home module. Modules reference these terms and id aliases where
 * they name concepts; introducing a synonym means editing this file first,
 * which is the review tripwire.
 *
 * The glossary is typed DATA (`DOMAIN_LANGUAGE`), keyed by the closed
 * `DomainConcept` union — adding a concept without defining it does not
 * compile.
 */
import type { EntityId } from "./core.primitives";

/** The closed set of domain concepts the platform speaks. */
export type DomainConcept =
  | "experience"
  | "business"
  | "workspace"
  | "mission"
  | "plan"
  | "recommendation"
  | "reservation"
  | "booking"
  | "conversation"
  | "intent"
  | "capability"
  | "context"
  | "reasoning"
  | "decision"
  | "evidence"
  | "memory"
  | "preference"
  | "mission_context"
  | "feature"
  | "knowledge"
  | "relationship";

/** One glossary row: the canonical term, its type, its home, its meaning. */
export interface DomainTermDefinition {
  /** The canonical English term — the ONLY word for this concept in code and docs. */
  readonly term: string;
  /** The canonical exported TypeScript symbol(s). */
  readonly canonicalType: string;
  /** Home module path within `modules/intelligence/`. */
  readonly module: string;
  /** One sentence; where near-synonyms exist, states the distinction. */
  readonly definition: string;
}

/**
 * The vocabulary, complete by construction. Near-synonym boundaries the
 * corpus depends on: mission vs mission_context vs plan, and reservation vs
 * booking, are spelled out in their definitions.
 */
export const DOMAIN_LANGUAGE = {
  experience: {
    term: "Experience",
    canonicalType: "ExperienceEntity",
    module: "knowledge-graph",
    definition:
      "The center of the database: a lived event (birthday, dinner, trip) connecting businesses, people, timeline, tasks, and memories."
  },
  business: {
    term: "Business",
    canonicalType: "BusinessEntity",
    module: "knowledge-graph",
    definition: "An experience provider exposing structured capabilities — never a 'listing'."
  },
  workspace: {
    term: "Workspace",
    canonicalType: "WorkspaceEntity",
    module: "knowledge-graph",
    definition: "The Smart Plan Workspace: the domain object where experiences are planned, tracked, and revisited."
  },
  mission: {
    term: "Mission",
    canonicalType: "MissionKnowledge",
    module: "memory-engine",
    definition:
      "The current objective as structured facts (what/when/how many/budget/where). Distinct from mission_context (the volatile memory object carrying a mission) and from plan (the composed answer to a mission)."
  },
  plan: {
    term: "Plan",
    canonicalType: "ExperienceComposition",
    module: "experience-graph",
    definition:
      "The composed, scheduled answer to a mission: providers, services, tasks, timeline, and bookings around one experience."
  },
  recommendation: {
    term: "Recommendation",
    canonicalType: "Recommendation",
    module: "reasoning-engine",
    definition:
      "A decided, ranked, explained, traced, sponsor-labeled suggestion. Never exists without explanation, trace, and context."
  },
  reservation: {
    term: "Reservation",
    canonicalType: "ScheduledSlot",
    module: "reasoning-engine",
    definition:
      "A held or confirmed time slot at a provider within a plan. Distinct from booking: a reservation is the slot commitment; the booking is the transactional record that secures it."
  },
  booking: {
    term: "Booking",
    canonicalType: "BookingEntity",
    module: "knowledge-graph",
    definition:
      "The transactional record binding customer, provider, service, and window (with status and party size). Executed only via the Tool Orchestrator."
  },
  conversation: {
    term: "Conversation",
    canonicalType: "RenderedNarration",
    module: "orchestrator-contracts",
    definition:
      "The Layer 6 rendering of decisions into language. Presentation only — never a store of knowledge (memory is structured, never chat)."
  },
  intent: {
    term: "Intent",
    canonicalType: "Intent",
    module: "reasoning-engine",
    definition:
      "The structured reading of what the user is trying to accomplish; kinds come from the intent registry, never scattered enums."
  },
  capability: {
    term: "Capability",
    canonicalType: "Capability",
    module: "orchestrator-contracts",
    definition:
      "A data-described AI ability (PlanBirthday, ReplaceRestaurant…) declaring the tools, knowledge, permissions, memory, and flags it needs. Distinct from a business's CapabilityFact (what a provider can do)."
  },
  context: {
    term: "Context",
    canonicalType: "AiDecisionContext",
    module: "core/context",
    definition:
      "The provenance of one AI decision: who it was for, where, and exactly which knowledge was consulted."
  },
  reasoning: {
    term: "Reasoning",
    canonicalType: "ReasoningSessionId",
    module: "core/context",
    definition: "One full deciding pass (intent → constraints → candidates → policy → ranking → explanation), identified by session id."
  },
  decision: {
    term: "Decision",
    canonicalType: "Recommendation | ReplacementPlan | ExperiencePackage | AvailabilityPlan",
    module: "reasoning-engine",
    definition:
      "A structured Layer 5 output. Only Layer 5 produces decisions; Layer 6 renders them."
  },
  evidence: {
    term: "Evidence",
    canonicalType: "ExplanationEvidence",
    module: "explanation-engine",
    definition: "The typed data that makes an explanation factor true — a factor without evidence is unrepresentable."
  },
  memory: {
    term: "Memory",
    canonicalType: "MemoryObject",
    module: "memory-engine",
    definition:
      "A tiered, provenance-carrying structured knowledge object with lifecycle and retrieval priority. Never a transcript."
  },
  preference: {
    term: "Preference",
    canonicalType: "CustomerPreference",
    module: "customer-intelligence",
    definition: "A durable learned taste (dimension + value + provenance). Tier-2 knowledge; never today's objective."
  },
  mission_context: {
    term: "MissionContext",
    canonicalType: "MissionContext",
    module: "memory-engine",
    definition:
      "The Tier-1 (volatile) memory object carrying the current mission. Destroyed when the mission ends."
  },
  feature: {
    term: "Feature",
    canonicalType: "FeatureValue",
    module: "feature-store",
    definition:
      "A derived fact computed once by the pipeline and reused everywhere (value + confidence + computedAt + source)."
  },
  knowledge: {
    term: "Knowledge",
    canonicalType: "KnowledgeFact",
    module: "core",
    definition: "The atom of everything derived: a typed value with source, confidence, and observation time."
  },
  relationship: {
    term: "Relationship",
    canonicalType: "Relationship",
    module: "relationship-engine",
    definition: "A directed, typed, confidence-scored edge between two graph entities."
  }
} as const satisfies Readonly<Record<DomainConcept, DomainTermDefinition>>;

// Canonical id aliases. Structural aliases of EntityId today (they cross the
// Prisma/HTTP boundary constantly); new contracts use them so reading a
// signature tells you which concept an id names. Retrofitting pre-patch
// signatures is deliberate follow-up work, not silent churn.
export type ExperienceId = EntityId;
export type BusinessId = EntityId;
export type WorkspaceId = EntityId;
export type CustomerId = EntityId;
export type RecommendationId = EntityId;
export type BookingId = EntityId;
/** Canonical id of a data-described AI capability (registry in orchestrator-contracts). */
export type CapabilityId = string;
