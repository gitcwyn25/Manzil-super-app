/**
 * Layer 6 boundary — the Capability Registry (patch A).
 *
 * Every AI capability is DATA, never hardcoded: a `Capability` declares
 * what the platform must provide — tools, knowledge, permissions, business
 * and customer data, memory tiers, feature flags — before the capability
 * may run. The orchestrator checks a capability's requirements against tool
 * manifests, flags, and permissions at plan time; a capability whose
 * requirements are unmet degrades honestly instead of failing midway.
 *
 * LAYER CHOICE (deliberate): this lives at the L6 boundary, not in core. A
 * capability composes requirements from every layer plus platform concerns
 * (tools, RBAC, feature flags) — composing the whole stack is the
 * boundary's job, and placing it lower would teach lower layers about
 * tools and permissions, inverting the import direction. Lower layers can
 * still *name* capabilities via `CapabilityId` (core/domain-language).
 */
import type { CapabilityId, MemoryTier } from "../core";
import type { ToolId } from "./tool.manifest";

/** Lifecycle of a capability; all Epic 03 seeds are `planned` (contracts, no engines). */
export type CapabilityStatus = "planned" | "active" | "degraded" | "disabled";

/** One data-described AI capability. */
export interface Capability {
  readonly id: CapabilityId;
  /** Human-auditable name, e.g. "Plan a birthday". */
  readonly name: string;
  readonly description: string;
  readonly requiredTools: readonly ToolId[];
  /** Knowledge surfaces consulted, as stable keys (`business_summaries`, `experience_graph`). */
  readonly requiredKnowledge: readonly string[];
  /** RBAC permissions the AI principal needs while executing this capability. */
  readonly requiredPermissions: readonly string[];
  /** Business-data keys that must exist (`capabilities`, `peak_hours`, `availability`). */
  readonly requiredBusinessData: readonly string[];
  /** Customer-data keys that must exist (`preferences`, `budget_pattern`). */
  readonly requiredCustomerData: readonly string[];
  readonly requiredMemory: readonly MemoryTier[];
  /** Governance feature flags gating this capability (doc 15 §3). */
  readonly requiredFeatureFlags: readonly string[];
  readonly status: CapabilityStatus;
}

/**
 * Query API of the registry. Implementations may serve from this seed, a
 * database, or remote config — consumers never know.
 */
export interface CapabilityRegistry {
  capability(id: CapabilityId): Promise<Capability | null>;
  /** Capabilities currently servable (status `active` or `degraded`). */
  available(): Promise<readonly Capability[]>;
  all(): Promise<readonly Capability[]>;
}

/**
 * The seed catalog: the eight capabilities of the Epic 03 mandate, as typed
 * data. All `planned` — the contracts exist, the engines do not.
 */
export const CAPABILITY_CATALOG: readonly Capability[] = [
  {
    id: "PlanBirthday",
    name: "Plan a birthday",
    description: "Compose venue, cake, photography, and transport into one coordinated birthday plan.",
    requiredTools: ["search.businesses", "availability.check", "booking.create", "workspace.update", "notification.schedule"],
    requiredKnowledge: ["business_summaries", "experience_graph", "capability_facts"],
    requiredPermissions: ["bookings:write", "workspace:write", "notifications:schedule"],
    requiredBusinessData: ["capabilities", "availability", "peak_hours"],
    requiredCustomerData: ["preferences", "budget_pattern", "relationships"],
    requiredMemory: ["mission_context", "preference_context", "relationship_context", "workspace_timeline"],
    requiredFeatureFlags: ["AI_ENABLED", "SMART_PLAN_WORKSPACE"],
    status: "planned"
  },
  {
    id: "FindCoffee",
    name: "Find coffee",
    description: "Recommend coffee places fitting the moment: distance, mood, crowd, and taste.",
    requiredTools: ["search.businesses", "maps.distance"],
    requiredKnowledge: ["business_summaries", "capability_facts", "marketplace_facts"],
    requiredPermissions: ["catalog:read"],
    requiredBusinessData: ["capabilities", "peak_hours"],
    requiredCustomerData: ["preferences"],
    requiredMemory: ["preference_context", "marketplace_context"],
    requiredFeatureFlags: ["AI_ENABLED"],
    status: "planned"
  },
  {
    id: "ReplaceRestaurant",
    name: "Replace a restaurant",
    description: "Swap a plan's restaurant while preserving every satisfied constraint, with an explained diff.",
    requiredTools: ["search.businesses", "availability.check", "workspace.update"],
    requiredKnowledge: ["experience_graph", "capability_facts", "substitution_edges"],
    requiredPermissions: ["catalog:read", "workspace:write"],
    requiredBusinessData: ["capabilities", "availability"],
    requiredCustomerData: ["preferences"],
    requiredMemory: ["mission_context", "workspace_timeline"],
    requiredFeatureFlags: ["AI_ENABLED", "SMART_PLAN_WORKSPACE"],
    status: "planned"
  },
  {
    id: "BookHotel",
    name: "Book a hotel",
    description: "Find and secure lodging that fits dates, party, budget, and location constraints.",
    requiredTools: ["search.businesses", "availability.check", "booking.create", "payment.estimate"],
    requiredKnowledge: ["business_summaries", "capability_facts"],
    requiredPermissions: ["bookings:write", "payments:estimate"],
    requiredBusinessData: ["capabilities", "availability", "pricing"],
    requiredCustomerData: ["preferences", "budget_pattern"],
    requiredMemory: ["mission_context", "preference_context"],
    requiredFeatureFlags: ["AI_ENABLED", "BOOKINGS_V2"],
    status: "planned"
  },
  {
    id: "BuildWorkspace",
    name: "Build a workspace",
    description: "Turn an intent into a structured Smart Plan Workspace with tasks and a timeline.",
    requiredTools: ["workspace.update", "notification.schedule"],
    requiredKnowledge: ["experience_graph"],
    requiredPermissions: ["workspace:write", "notifications:schedule"],
    requiredBusinessData: [],
    requiredCustomerData: ["preferences", "relationships"],
    requiredMemory: ["mission_context", "workspace_timeline"],
    requiredFeatureFlags: ["AI_ENABLED", "SMART_PLAN_WORKSPACE"],
    status: "planned"
  },
  {
    id: "RecommendGifts",
    name: "Recommend gifts",
    description: "Suggest gift experiences/services fitting the recipient, occasion, and budget.",
    requiredTools: ["search.businesses"],
    requiredKnowledge: ["business_summaries", "marketplace_facts"],
    requiredPermissions: ["catalog:read"],
    requiredBusinessData: ["capabilities"],
    requiredCustomerData: ["preferences", "relationships", "budget_pattern"],
    requiredMemory: ["preference_context", "relationship_context"],
    requiredFeatureFlags: ["AI_ENABLED"],
    status: "planned"
  },
  {
    id: "GenerateItinerary",
    name: "Generate an itinerary",
    description: "Sequence multiple services into a feasible, travel-aware schedule for a day or trip.",
    requiredTools: ["search.businesses", "availability.check", "maps.distance", "workspace.update"],
    requiredKnowledge: ["business_summaries", "experience_graph", "capability_facts"],
    requiredPermissions: ["catalog:read", "workspace:write"],
    requiredBusinessData: ["capabilities", "availability", "hours"],
    requiredCustomerData: ["preferences", "travel_pattern"],
    requiredMemory: ["mission_context", "preference_context", "marketplace_context"],
    requiredFeatureFlags: ["AI_ENABLED", "SMART_PLAN_WORKSPACE"],
    status: "planned"
  },
  {
    id: "CompareBusinesses",
    name: "Compare businesses",
    description: "Put named candidates side by side on capabilities, trust, price, and fit.",
    requiredTools: ["search.businesses"],
    requiredKnowledge: ["business_summaries", "capability_facts", "trust_scores"],
    requiredPermissions: ["catalog:read"],
    requiredBusinessData: ["capabilities", "pricing"],
    requiredCustomerData: ["preferences"],
    requiredMemory: ["preference_context"],
    requiredFeatureFlags: ["AI_ENABLED"],
    status: "planned"
  }
];
