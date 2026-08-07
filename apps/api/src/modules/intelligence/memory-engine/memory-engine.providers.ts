/**
 * Layer 4 (Memory Engine) — DI wiring, as a provider array.
 *
 * A `Provider[]` rather than a Nest module, following `KNOWLEDGE_GRAPH_PROVIDERS`
 * and `MEDIA_STORAGE_PROVIDER` before it, for one structural reason: this
 * layer needs `PrismaService` and `CacheService`, which AppModule provides
 * directly and no module exports. A `MemoryEngineModule` would have to provide
 * its own `PrismaService` — a second client and a second connection pool — or
 * import a `PrismaModule` that does not exist.
 *
 * `IntelligenceModule` stays provider-empty and safe to import, exactly as
 * `ARCHITECTURE.md` promises; nothing here is wired until a consumer needs
 * memory (Epic 08 reasoning is the first), at which point it is one line:
 *
 * ```ts
 * providers: [ …, ...MEMORY_ENGINE_PROVIDERS ]
 * ```
 */
import type { Provider } from "@nestjs/common";
import { INTELLIGENCE_MEMORY } from "../orchestrator-contracts/orchestrator.tokens";
import { MemoryCacheService } from "./memory-cache.service";
import { SystemMemoryClock } from "./memory-engine.clock";
import { MemoryEngineJobs } from "./memory-engine.jobs";
import { MemoryEngineService } from "./memory-engine.service";
import { MEMORY_ENGINE_CLOCK } from "./memory-engine.tokens";
import { MEMORY_OBJECT_STORE_PROVIDER } from "./memory-object.store";
import { MemoryProjectionRepository } from "./memory-projection.repository";
import { MemoryRepository } from "./memory.repository";
import { MemoryRetrievalService } from "./memory-retrieval.service";
import { MemoryWriterService } from "./memory-writer.service";

export const MEMORY_ENGINE_PROVIDERS: readonly Provider[] = [
  MemoryProjectionRepository,
  MemoryCacheService,
  MemoryRepository,
  MemoryRetrievalService,
  MemoryWriterService,
  MemoryEngineService,
  MemoryEngineJobs,
  { provide: MEMORY_ENGINE_CLOCK, useClass: SystemMemoryClock },
  // In-process until M1 applies the MemoryObject migration; the factory picks
  // the Prisma-backed store the moment the delegate exists *and* the
  // deployment opts in.
  MEMORY_OBJECT_STORE_PROVIDER,
  // Contract token: consumers inject the interface, never the class.
  { provide: INTELLIGENCE_MEMORY, useExisting: MemoryEngineService }
];
