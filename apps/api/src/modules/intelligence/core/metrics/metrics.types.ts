/**
 * Layer 0 (core/metrics) — observability as typed contracts, from day one.
 *
 * Doc 23 §8: execution time, failures, retries, queue delay, and knowledge
 * freshness are contracts now so future dashboards consume a stable shape.
 * A discriminated union (not name+labels strings) so a metric that forgets
 * its required dimensions cannot be expressed.
 */
import type { EntityId, IsoDateTime } from "../core.primitives";
import type { IntelligenceErrorKind } from "../errors";
import type { IntelligenceJobName } from "../jobs";

/** What "freshness" is measured of (doc 23 §8: summary/memory/knowledge/recommendation). */
export type FreshnessSubject = "summary" | "memory" | "knowledge" | "recommendation";

/** One observed measurement inside the Intelligence Platform. */
export type IntelligenceMetric =
  | {
      readonly kind: "execution_time";
      /** Operation identifier: a job name or engine method (`RankingEngine.rank`). */
      readonly operation: string;
      readonly durationMs: number;
      readonly at: IsoDateTime;
    }
  | {
      readonly kind: "failure";
      readonly operation: string;
      /** Typed failure cause (core/errors taxonomy), never message text. */
      readonly errorKind: IntelligenceErrorKind;
      readonly at: IsoDateTime;
    }
  | {
      readonly kind: "retry";
      readonly operation: string;
      readonly attempt: number;
      readonly at: IsoDateTime;
    }
  | {
      readonly kind: "queue_delay";
      readonly jobName: IntelligenceJobName;
      /** Time between enqueue and execution start. */
      readonly delayMs: number;
      readonly at: IsoDateTime;
    }
  | {
      readonly kind: "freshness";
      readonly subject: FreshnessSubject;
      /** The entity whose knowledge is aging; `null` = platform-wide. */
      readonly entityId: EntityId | null;
      readonly ageSeconds: number;
      readonly at: IsoDateTime;
    };

/**
 * Command API — where metrics go. Fire-and-forget (`void`) by design:
 * recording a measurement must never slow or fail the operation measured.
 */
export interface MetricsSink {
  record(metric: IntelligenceMetric): void;
}
