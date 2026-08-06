/**
 * Layer 6 boundary — manifest-based tools (patch C).
 *
 * ADR-001 gave every tool a contract; the manifest makes each tool
 * *self-describing*: what it needs (permissions, entities), how it behaves
 * under failure (timeout, retry), what it costs, and whether it is
 * currently available. The orchestrator plans against manifests — a
 * capability can be checked for feasibility before any invocation happens,
 * and the MCP plugin face can be generated from the same data.
 */
import type { GraphEntityType } from "../knowledge-graph";
import type { MoneyAmount } from "../core";

/** Stable namespaced tool identifier, e.g. `booking.create`, `search.businesses`. */
export type ToolId = string;

/** How an invocation may be retried; `none` means the tool is not safely retryable. */
export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoff: "none" | "fixed" | "exponential";
  readonly baseDelayMs: number;
}

/** What one invocation is expected to cost the platform. */
export interface ToolCostEstimate {
  /** Monetary cost per invocation, when meterable (SMS, external API). */
  readonly perInvocation: MoneyAmount | null;
  readonly estimatedLatencyMs: number;
}

/** Current serving state, honestly reported. */
export type ToolAvailability = "available" | "degraded" | "unavailable" | "planned";

/** The self-description of one platform tool. */
export interface ToolManifest {
  readonly toolId: ToolId;
  readonly description: string;
  /** Semver of the tool contract, so capability requirements can pin ranges later. */
  readonly version: string;
  /** RBAC permissions the acting principal must hold (ADR-001: AI is least-privilege). */
  readonly requiredPermissions: readonly string[];
  /** Graph entity kinds the tool reads or writes. */
  readonly requiredEntities: readonly GraphEntityType[];
  readonly timeoutMs: number;
  readonly retryPolicy: RetryPolicy;
  readonly costEstimate: ToolCostEstimate;
  readonly availability: ToolAvailability;
}
