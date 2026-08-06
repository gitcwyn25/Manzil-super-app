/**
 * Layer 0 (core/context) — AI Context IDs: debuggability is a feature.
 *
 * Doc 23 §9: every recommendation carries the workspace, the customer, the
 * businesses consulted, the memories consulted, and a reasoning session id.
 * The Layer 5 `Recommendation` type requires this context structurally, so
 * an untraceable recommendation is unrepresentable — the same trick the
 * explanation contract plays with "why".
 */
import type { EntityId, IsoDateTime } from "../core.primitives";

/** Identifies one full reasoning pass (intent → … → recommendations). */
export type ReasoningSessionId = string;

/**
 * The provenance of one AI decision: who it was for, where it happened, and
 * exactly which knowledge was consulted to make it. Written once by Layer 5,
 * read by debugging, owner insights, and the metrics pipeline.
 */
export interface AiDecisionContext {
  readonly reasoningSessionId: ReasoningSessionId;
  readonly customerId: EntityId;
  readonly workspaceId: EntityId | null;
  /** Business ids whose knowledge was consulted (graph, summaries, features). */
  readonly consultedBusinessIds: readonly EntityId[];
  /** `memoryId`s of the memory objects consulted, per the retrieval order. */
  readonly consultedMemoryIds: readonly EntityId[];
  /** Ties the decision to the event chain that will invalidate it. */
  readonly correlationId: EntityId | null;
  readonly createdAt: IsoDateTime;
}
