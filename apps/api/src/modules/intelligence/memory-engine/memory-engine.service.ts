/**
 * Layer 4 (Memory Engine) — the provider.
 *
 * Implements the frozen `MemoryEngineProvider` (Epic 03) and nothing else of
 * consequence: recall, remember, forgetMission. Every method delegates — this
 * class exists so consumers inject *one* token (`INTELLIGENCE_MEMORY`) and
 * never learn that a projection repository, a store, a cache, a conflict rule
 * and an event publisher sit behind it.
 *
 * `remember()` is part of the frozen read/write contract, so it exists here;
 * it routes through the same `MemoryWriterService` the jobs use, which is what
 * keeps doc 23 §5 true in spirit — every mutation validated, resolved and
 * announced identically, whether a job or a caller started it.
 */
import { Inject, Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import { MEMORY_ENGINE_CLOCK } from "./memory-engine.tokens";
import type { MemoryClock } from "./memory-engine.clock";
import { MemoryRepository } from "./memory.repository";
import { MemoryRetrievalService, type MemoryRecallResult } from "./memory-retrieval.service";
import { MemoryWriterService } from "./memory-writer.service";
import { scopeOfMemory } from "./memory.lifecycle";
import type { AnyMemoryObject, MemoryBundle, MemoryEngineProvider } from "./memory.tiers";

/** What the engine can honestly promise about persistence right now. */
export interface MemoryPersistenceStatus {
  /** `memory` until M1 applies the `MemoryObject` migration, then `prisma`. */
  readonly backend: "memory" | "prisma";
  /** False while memory lives in process only. */
  readonly durable: boolean;
}

@Injectable()
export class MemoryEngineService implements MemoryEngineProvider {
  constructor(
    private readonly retrieval: MemoryRetrievalService,
    private readonly writer: MemoryWriterService,
    private readonly repository: MemoryRepository,
    @Inject(MEMORY_ENGINE_CLOCK) private readonly clock: MemoryClock
  ) {}

  /** Every applicable tier for one customer/workspace pair, in binding order. */
  recall(customerId: EntityId, workspaceId: EntityId | null): Promise<MemoryBundle> {
    return this.retrieval.recall(customerId, workspaceId);
  }

  /** The same recall, with the provenance doc 23 §9 requires. */
  recallOrdered(customerId: EntityId, workspaceId: EntityId | null): Promise<MemoryRecallResult> {
    return this.retrieval.recallOrdered({ customerId, workspaceId });
  }

  /**
   * Records structured knowledge into a tier.
   *
   * The frozen signature returns `void`; callers that need to know how the
   * write resolved use `rememberResolved`, which is the same operation with
   * its answer visible. Silent is not the same as unexplained: every write is
   * still validated, resolved and announced.
   */
  async remember(memory: AnyMemoryObject): Promise<void> {
    await this.rememberResolved(memory);
  }

  /** `remember`, with the conflict resolution and the announcement returned. */
  rememberResolved(memory: AnyMemoryObject, correlationId?: EntityId) {
    return this.writer.remember(memory, {
      correlationId: correlationId ?? this.clock.newId(),
      causationEventId: null,
      customerId: customerOf(memory)
    });
  }

  /**
   * Destroys a volatile mission when it completes (AI Bible v1.2).
   *
   * Only the mission tier. A finished birthday does not erase that the
   * customer likes quiet rooms, and it does not erase the plan it happened in
   * — those are the durable tiers, and confusing them with the volatile one is
   * the exact mistake the Bible names.
   */
  async forgetMission(customerId: EntityId, workspaceId: EntityId | null): Promise<void> {
    await this.writer.forget(
      { tier: "mission_context", subjectId: customerId },
      {
        correlationId: this.clock.newId(),
        // The workspace is not the mission's subject — missions are
        // customer-scoped — but it is what the caller was working in, so it
        // travels as the causation handle of the chain.
        causationEventId: workspaceId,
        customerId
      }
    );
  }

  /**
   * Whether memory written here survives a restart.
   *
   * Exposed because it changes what an answer means: while `durable` is false,
   * an empty preference tier may mean "this deployment restarted", not "this
   * customer has no preferences" — and a health check that cannot say so is
   * a health check that lies.
   */
  get persistence(): MemoryPersistenceStatus {
    return { backend: this.repository.backend, durable: this.repository.durable };
  }
}

/** The customer a memory is about, where it is about one. */
function customerOf(memory: AnyMemoryObject): EntityId | null {
  switch (memory.tier) {
    case "mission_context":
    case "preference_context":
    case "relationship_context":
      return memory.knowledge.customerId;
    case "business_context":
      // Business context is customer-scoped by subject, not by payload — the
      // summaries inside it belong to businesses.
      return scopeOfMemory(memory).subjectId;
    default:
      return null;
  }
}
