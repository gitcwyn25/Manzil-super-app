/**
 * Layer 6 boundary — the Context Window Manager (patch G), interface only.
 *
 * When a provider integration finally exists, its context window is a
 * budget, and what fills it is a *priority decision*, not an accident of
 * concatenation order. This contract fixes the assembly priority —
 * Workspace → Memory → Knowledge → Business → History → Conversation →
 * Summaries → LLM — mirroring the Memory Engine's retrieval order (the
 * user's plan always beats generic knowledge), and types budget-aware
 * truncation: what was dropped is a visible, auditable fact.
 *
 * No implementation, no tokenizer, no provider assumptions — token counts
 * are plain numbers estimated by whoever implements this later.
 */
import type { EntityId, ReasoningSessionId } from "../core";

/** The eight assemblable sections, lowest-level naming aligned with retrieval sources. */
export type ContextSection =
  | "workspace"
  | "memory"
  | "knowledge"
  | "business"
  | "history"
  | "conversation"
  | "summaries"
  | "llm";

/**
 * The binding assembly priority. A tuple: position is the contract. On
 * budget pressure, sections are truncated from the END of this list first —
 * the LLM's own latitude is the first thing sacrificed, the Workspace the
 * last.
 */
export const CONTEXT_ASSEMBLY_PRIORITY = [
  "workspace",
  "memory",
  "knowledge",
  "business",
  "history",
  "conversation",
  "summaries",
  "llm"
] as const satisfies readonly ContextSection[];

/** The window budget one assembly must fit. */
export interface ContextBudget {
  readonly maxTokens: number;
  /** Tokens held back for the response itself; never assignable to sections. */
  readonly reservedForResponseTokens: number;
}

/** What one section offers for inclusion, before budgeting. */
export interface ContextSectionInput {
  readonly section: ContextSection;
  /** Ids of the structured items offered (memory ids, entity ids, decision ids). */
  readonly itemIds: readonly EntityId[];
  readonly estimatedTokens: number;
}

/** An assembly request: the session, the budget, and what is on offer. */
export interface ContextAssemblyRequest {
  readonly reasoningSessionId: ReasoningSessionId;
  readonly budget: ContextBudget;
  readonly sections: readonly ContextSectionInput[];
}

/** The budget verdict for one section — inclusion and truncation are explicit. */
export interface ContextSectionAllocation {
  readonly section: ContextSection;
  readonly allocatedTokens: number;
  readonly includedItemIds: readonly EntityId[];
  /** Items dropped under budget pressure — auditable, never silent. */
  readonly truncatedItemIds: readonly EntityId[];
}

/** The full assembly plan, allocations in `CONTEXT_ASSEMBLY_PRIORITY` order. */
export interface ContextAssemblyPlan {
  readonly reasoningSessionId: ReasoningSessionId;
  readonly allocations: readonly ContextSectionAllocation[];
  readonly totalAllocatedTokens: number;
  readonly withinBudget: boolean;
}

/** The manager: offers in, a priority-ordered budget-fitted plan out. */
export interface ContextWindowManager {
  plan(request: ContextAssemblyRequest): Promise<ContextAssemblyPlan>;
}
