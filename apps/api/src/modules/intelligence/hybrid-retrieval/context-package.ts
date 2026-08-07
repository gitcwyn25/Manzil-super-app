/**
 * Layer 4.5 (Hybrid Retrieval) — the Context Package.
 *
 * The epic specifies its contents exactly: businesses, services, experiences,
 * workspace, preferences, mission context, knowledge nodes, feature values,
 * related customers, campaigns, availability, alternative candidates. Twelve
 * sections, no more and no fewer, so what reasoning receives is a shape it can
 * be written against rather than a bag it has to inspect.
 *
 * `CONTEXT_PACKAGE_SECTION` makes the twelve total by construction: it maps
 * every `RetrievalItemKind` to its home section, and the `satisfies` clause
 * fails to compile if a kind is added without one. That is the tripwire — a
 * thirteenth kind of retrieved thing is a deliberate decision about the
 * package, not an accident of an engine returning something new.
 *
 * Items keep their ranked order inside each section, so a consumer that reads
 * only `businesses[0]` gets the same answer the full list would have given it.
 *
 * Imports `core` and lower layers only.
 */
import type { EntityId, IsoDateTime } from "../core";
import type { RetrievalItem, RetrievalItemKind } from "./hybrid-retrieval.types";

/** The twelve sections, as names. */
export type ContextPackageSection =
  | "businesses"
  | "services"
  | "experiences"
  | "workspace"
  | "preferences"
  | "missionContext"
  | "knowledgeNodes"
  | "featureValues"
  | "relatedCustomers"
  | "campaigns"
  | "availability"
  | "alternativeCandidates";

/** Item kind → its home section. Total by construction. */
export const CONTEXT_PACKAGE_SECTION = {
  business: "businesses",
  service: "services",
  experience: "experiences",
  workspace: "workspace",
  preference: "preferences",
  mission: "missionContext",
  knowledge_node: "knowledgeNodes",
  feature: "featureValues",
  related_customer: "relatedCustomers",
  campaign: "campaigns",
  availability: "availability",
  alternative: "alternativeCandidates"
} as const satisfies Readonly<Record<RetrievalItemKind, ContextPackageSection>>;

/** The sections in a fixed order, for iteration and for the docs. */
export const CONTEXT_PACKAGE_SECTIONS = [
  "businesses",
  "services",
  "experiences",
  "workspace",
  "preferences",
  "missionContext",
  "knowledgeNodes",
  "featureValues",
  "relatedCustomers",
  "campaigns",
  "availability",
  "alternativeCandidates"
] as const satisfies readonly ContextPackageSection[];

/**
 * Everything one reasoning pass may consult, sorted into its twelve boxes.
 *
 * Every field is a `RetrievalItem` list — the same shape everywhere, so a
 * consumer that can read one section can read all of them, and nothing in here
 * is a raw Prisma row, a graph node, or a sentence.
 */
export interface ContextPackage {
  readonly retrievalId: EntityId;
  readonly businesses: readonly RetrievalItem[];
  readonly services: readonly RetrievalItem[];
  readonly experiences: readonly RetrievalItem[];
  readonly workspace: readonly RetrievalItem[];
  readonly preferences: readonly RetrievalItem[];
  readonly missionContext: readonly RetrievalItem[];
  readonly knowledgeNodes: readonly RetrievalItem[];
  readonly featureValues: readonly RetrievalItem[];
  readonly relatedCustomers: readonly RetrievalItem[];
  readonly campaigns: readonly RetrievalItem[];
  readonly availability: readonly RetrievalItem[];
  readonly alternativeCandidates: readonly RetrievalItem[];
  readonly assembledAt: IsoDateTime;
}

/** An empty package — every section present and empty, never undefined. */
export function emptyContextPackage(retrievalId: EntityId, at: IsoDateTime): ContextPackage {
  return {
    retrievalId,
    businesses: [],
    services: [],
    experiences: [],
    workspace: [],
    preferences: [],
    missionContext: [],
    knowledgeNodes: [],
    featureValues: [],
    relatedCustomers: [],
    campaigns: [],
    availability: [],
    alternativeCandidates: [],
    assembledAt: at
  };
}

/**
 * Sorts ranked items into the package.
 *
 * Order-preserving: the input is already in the binding order, so each section
 * inherits it. A consumer reading `preferences[0]` is reading the
 * highest-priority preference, not an arbitrary one.
 */
export function toContextPackage(
  retrievalId: EntityId,
  items: readonly RetrievalItem[],
  at: IsoDateTime
): ContextPackage {
  const buckets: Record<ContextPackageSection, RetrievalItem[]> = {
    businesses: [],
    services: [],
    experiences: [],
    workspace: [],
    preferences: [],
    missionContext: [],
    knowledgeNodes: [],
    featureValues: [],
    relatedCustomers: [],
    campaigns: [],
    availability: [],
    alternativeCandidates: []
  };

  for (const item of items) {
    buckets[CONTEXT_PACKAGE_SECTION[item.kind]].push(item);
  }

  return { retrievalId, ...buckets, assembledAt: at };
}

/** How many items the package carries, across every section. */
export function contextPackageSize(pkg: ContextPackage): number {
  return CONTEXT_PACKAGE_SECTIONS.reduce((total, section) => total + pkg[section].length, 0);
}

/** The items of one section — for iteration without a twelve-way switch. */
export function sectionItems(
  pkg: ContextPackage,
  section: ContextPackageSection
): readonly RetrievalItem[] {
  return pkg[section];
}
