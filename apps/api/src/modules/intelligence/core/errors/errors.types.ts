/**
 * Layer 0 (core/errors) — the AI error taxonomy.
 *
 * Patch E: "insufficient data" tells nobody anything. Every intelligence
 * failure is one of ten typed causes, each carrying exactly the data needed
 * to react to it — retry, degrade honestly, ask the user, or alert an owner
 * (AI Bible: explain why, offer alternatives, never pretend to know). Jobs
 * and metrics reference `IntelligenceErrorKind` instead of free-form
 * strings, so failure dashboards aggregate by cause, not by prose.
 */
import type { EntityId, MemoryTier } from "../core.primitives";

/** The ten failure causes, as a closed discriminant set. */
export type IntelligenceErrorKind =
  | "knowledge_missing"
  | "memory_missing"
  | "feature_unavailable"
  | "tool_unavailable"
  | "marketplace_sparse"
  | "permission_denied"
  | "business_offline"
  | "policy_violation"
  | "reasoning_failure"
  | "timeout";

/**
 * One typed intelligence failure. A discriminated union so each cause
 * carries its own facts — a `timeout` without the operation and limit, or a
 * `policy_violation` without the rule, is unrepresentable.
 */
export type IntelligenceError =
  | {
      /** The graph/summaries lack a fact the operation needed. */
      readonly kind: "knowledge_missing";
      readonly entityId: EntityId | null;
      /** What was missing, as a stable key (`capabilities.parking`, `business_summary`). */
      readonly missingKey: string;
    }
  | {
      /** A required memory tier is absent or expired for this customer. */
      readonly kind: "memory_missing";
      readonly tier: MemoryTier;
      readonly customerId: EntityId | null;
    }
  | {
      /** A feature-store vector or feature flag the operation needs is unavailable. */
      readonly kind: "feature_unavailable";
      readonly featureKey: string;
      readonly entityId: EntityId | null;
    }
  | {
      /** A required platform tool is down, unregistered, or degraded. */
      readonly kind: "tool_unavailable";
      readonly toolId: string;
    }
  | {
      /** Too little marketplace data to answer honestly (thin category/area). */
      readonly kind: "marketplace_sparse";
      /** What was sparse, as a stable scope key (`neighborhood:yunusabad`, `service:florist`). */
      readonly scopeKey: string;
      readonly sampleSize: number;
    }
  | {
      /** The acting principal lacks permission (ADR-001: AI is least-privilege). */
      readonly kind: "permission_denied";
      readonly principal: string;
      readonly action: string;
    }
  | {
      /** The provider cannot currently serve (closed, unreachable, suspended). */
      readonly kind: "business_offline";
      readonly businessId: EntityId;
    }
  | {
      /** A Decision Engine rule blocks the operation. */
      readonly kind: "policy_violation";
      readonly ruleId: string;
    }
  | {
      /** A reasoning stage could not produce a decision from valid inputs. */
      readonly kind: "reasoning_failure";
      /** The stage that failed (`constraint_builder`, `ranking`, `package_builder`). */
      readonly stage: string;
    }
  | {
      readonly kind: "timeout";
      readonly operation: string;
      readonly timeoutMs: number;
    };

/**
 * A failure as reported: the typed cause plus handling facts. `retryable`
 * is the executor's contract — retrying a `permission_denied` is a bug, and
 * the type forces someone to say so at the site that knows.
 */
export interface IntelligenceFailure {
  readonly error: IntelligenceError;
  readonly retryable: boolean;
  readonly occurredAt: string;
}
