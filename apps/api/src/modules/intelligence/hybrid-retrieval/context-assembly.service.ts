/**
 * Layer 4.5 (Hybrid Retrieval) — context-window assembly.
 *
 * Implements the frozen `ContextWindowManager` (patch G, Layer 6) against the
 * frozen `CONTEXT_ASSEMBLY_PRIORITY`:
 *
 * ```text
 *   Workspace → Memory → Knowledge → Business → History → Conversation
 *             → Summaries → LLM
 * ```
 *
 * Truncation runs from the **end** of that list. The model's own latitude is
 * the first thing sacrificed and the user's workspace is the last — which is
 * the same sentence ADR-006 makes about retrieval priority, applied to a
 * different scarce resource. Two orders, one principle.
 *
 * **Why an implementation of a Layer 6 contract lives at Layer 4.5.** The
 * assembly *decides nothing*: it fits ranked structured items into a token
 * budget and reports what did not fit. What it needs is the ranked items,
 * which is what this module produces — so putting the implementation here
 * means no data crosses a layer boundary that would not have crossed it
 * anyway. The alternative, an implementation at Layer 6, would have the
 * boundary reach *down* for retrieval results, which is the inversion the
 * import rule forbids. The contract and the constant stay where Epic 03 froze
 * them and this module imports them, exactly as Epic 06 imports the frozen
 * tokens it binds.
 *
 * **Token counts are estimates and say so.** There is no tokenizer here and
 * there should not be: a tokenizer is provider-specific, and this module is
 * forbidden from knowing which provider exists. `estimateTokens` is a
 * transparent character heuristic, documented as such, replaceable by a real
 * counter behind the same signature the day a provider is chosen.
 *
 * **Truncation is auditable, always.** Every dropped item id appears in
 * `truncatedItemIds`. A section that was cut in half must be able to say which
 * half — "the context was too small" is not a debuggable statement.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import type {
  ContextAssemblyPlan,
  ContextAssemblyRequest,
  ContextBudget,
  ContextSection,
  ContextSectionAllocation,
  ContextSectionInput,
  ContextWindowManager
} from "../orchestrator-contracts/context-window.contract";
import { CONTEXT_ASSEMBLY_PRIORITY } from "../orchestrator-contracts/context-window.contract";
import { HYBRID_RETRIEVAL_CLOCK } from "./hybrid-retrieval.tokens";
import type { RetrievalClock } from "./hybrid-retrieval.clock";
import { ENGINE_CONTEXT_SECTION, contextSectionRank } from "./retrieval-priority";
import type { RetrievalItem, RetrievalPackage } from "./hybrid-retrieval.types";

/**
 * Characters per token, as a stated estimate.
 *
 * Four is the widely-used English/Latin approximation and it is wrong for
 * Cyrillic and wrong for Uzbek — Manzil is a trilingual marketplace, so this
 * number is *known* to be optimistic for two of its three locales. It is
 * deliberately not tuned: a tuned constant would imply a tokenizer we do not
 * have, and the honest response to that is a conservative safety margin
 * (`ASSEMBLY_SAFETY_FACTOR`) rather than a more confident guess.
 */
export const CHARS_PER_TOKEN = 4;

/**
 * Fraction of the assignable budget the plan will actually fill.
 *
 * Ten percent held back because the estimate above is an estimate. Overfilling
 * a real context window costs a truncated *response*, which is the failure the
 * whole priority order exists to control.
 */
export const ASSEMBLY_SAFETY_FACTOR = 0.9;

/** Estimated tokens for one item, from its structured payload. */
export function estimateTokens(item: RetrievalItem): number {
  const factChars = item.payload.facts.reduce(
    (total, entry) => total + entry.key.length + String(entry.value).length + 2,
    0
  );
  const refChars = item.payload.relatedEntityIds.reduce((total, id) => total + id.length + 1, 0);
  const envelopeChars = item.retrievalItemId.length + item.kind.length + 24;

  return Math.max(1, Math.ceil((factChars + refChars + envelopeChars) / CHARS_PER_TOKEN));
}

/** Estimated tokens for a whole section. */
export function estimateSectionTokens(items: readonly RetrievalItem[]): number {
  return items.reduce((total, item) => total + estimateTokens(item), 0);
}

/** A retrieval package projected into the eight assemblable sections. */
export function toSectionInputs(
  pkg: RetrievalPackage
): readonly ContextSectionInput[] {
  const bySection = new Map<ContextSection, RetrievalItem[]>();

  for (const item of pkg.items) {
    const section = ENGINE_CONTEXT_SECTION[item.engineId];
    const bucket = bySection.get(section);
    if (bucket) bucket.push(item);
    else bySection.set(section, [item]);
  }

  return [...bySection.entries()]
    .map(([section, items]) => ({
      section,
      itemIds: items.map((item) => item.entityId),
      estimatedTokens: estimateSectionTokens(items)
    }))
    .sort((left, right) => contextSectionRank(left.section) - contextSectionRank(right.section));
}

/** The per-item token estimates a package implies, keyed by entity id. */
export function itemTokenCosts(pkg: RetrievalPackage): ReadonlyMap<EntityId, number> {
  const costs = new Map<EntityId, number>();
  for (const item of pkg.items) costs.set(item.entityId, estimateTokens(item));
  return costs;
}

@Injectable()
export class ContextAssemblyService implements ContextWindowManager {
  constructor(@Inject(HYBRID_RETRIEVAL_CLOCK) private readonly clock: RetrievalClock) {}

  /**
   * Fits the offered sections into the budget, in the frozen priority order.
   *
   * The algorithm is deliberately the simplest one that satisfies the
   * contract: walk the priority list, give each section what it asks for while
   * the budget allows, give a partial allocation when it does not, and give
   * nothing (with every id truncated) once the budget is gone. No section is
   * skipped to make a later one fit — that would silently invert the priority.
   */
  async plan(request: ContextAssemblyRequest): Promise<ContextAssemblyPlan> {
    const assignable = assignableTokens(request.budget);
    const offered = new Map(request.sections.map((section) => [section.section, section]));

    const allocations: ContextSectionAllocation[] = [];
    let remaining = assignable;
    let totalAllocated = 0;

    for (const section of CONTEXT_ASSEMBLY_PRIORITY) {
      const input = offered.get(section);
      if (!input) {
        // A section nothing offered is present and empty, never absent: an
        // absent section reads as a bug, an empty one reads as "no engine
        // fills this" — which for `history` and `conversation` is the truth.
        allocations.push({
          section,
          allocatedTokens: 0,
          includedItemIds: [],
          truncatedItemIds: []
        });
        continue;
      }

      const allocation = allocate(input, remaining);
      allocations.push(allocation);
      remaining -= allocation.allocatedTokens;
      totalAllocated += allocation.allocatedTokens;
    }

    return {
      reasoningSessionId: request.reasoningSessionId,
      allocations,
      totalAllocatedTokens: totalAllocated,
      withinBudget: totalAllocated <= assignable
    };
  }

  /**
   * Assembles a retrieval package directly.
   *
   * The convenience path callers actually use: project the package into
   * sections, plan, and hand back both so the caller can see what was dropped
   * without re-deriving the projection.
   */
  async assemble(
    pkg: RetrievalPackage,
    budget: ContextBudget,
    reasoningSessionId: string | null
  ): Promise<ContextAssemblyResult> {
    const sections = toSectionInputs(pkg);

    const assemblyPlan = await this.plan({
      reasoningSessionId: reasoningSessionId ?? pkg.retrievalId,
      budget,
      sections
    });

    const included = new Set(
      assemblyPlan.allocations.flatMap((allocation) => [...allocation.includedItemIds])
    );

    return {
      plan: assemblyPlan,
      sections,
      includedItems: pkg.items.filter((item) => included.has(item.entityId)),
      truncatedItems: pkg.items.filter((item) => !included.has(item.entityId)),
      assembledAt: this.clock.now()
    };
  }
}

/** What `assemble` returns: the plan, the projection, and both halves of it. */
export interface ContextAssemblyResult {
  readonly plan: ContextAssemblyPlan;
  readonly sections: readonly ContextSectionInput[];
  readonly includedItems: readonly RetrievalItem[];
  /** Everything the budget could not fit — auditable, never silent. */
  readonly truncatedItems: readonly RetrievalItem[];
  readonly assembledAt: string;
}

/** Tokens available to sections after the response reservation and the margin. */
export function assignableTokens(budget: ContextBudget): number {
  const raw = budget.maxTokens - budget.reservedForResponseTokens;
  return Math.max(0, Math.floor(raw * ASSEMBLY_SAFETY_FACTOR));
}

/**
 * One section's allocation.
 *
 * Items are proportionally admitted from the front of the section's list,
 * which is the ranked order — so a half-fitting section keeps its best half.
 * The per-item cost is the section's mean, because `ContextSectionInput`
 * carries a total rather than per-item costs; that is the frozen contract's
 * shape and this implementation does not extend it.
 */
function allocate(input: ContextSectionInput, remaining: number): ContextSectionAllocation {
  if (input.itemIds.length === 0) {
    return {
      section: input.section,
      allocatedTokens: 0,
      includedItemIds: [],
      truncatedItemIds: []
    };
  }

  if (input.estimatedTokens <= remaining) {
    return {
      section: input.section,
      allocatedTokens: input.estimatedTokens,
      includedItemIds: input.itemIds,
      truncatedItemIds: []
    };
  }

  const perItem = input.estimatedTokens / input.itemIds.length;
  const fits = perItem > 0 ? Math.floor(remaining / perItem) : 0;
  const admitted = Math.max(0, Math.min(input.itemIds.length, fits));

  return {
    section: input.section,
    allocatedTokens: Math.round(admitted * perItem),
    includedItemIds: input.itemIds.slice(0, admitted),
    truncatedItemIds: input.itemIds.slice(admitted)
  };
}
