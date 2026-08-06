import { Module } from "@nestjs/common";

/**
 * The Intelligence Platform (Epic 03) — six isolated layers, contracts only.
 *
 * Layer 1 raw data (Prisma, outside this module) → Layer 2 marketplace
 * intelligence → Layer 3 knowledge graph → Layer 4 memory engine → Layer 5
 * reasoning → Layer 6 conversation. The LLM lives at Layer 6 and never
 * decides — see `ARCHITECTURE.md` in this directory and ADR-005.
 *
 * Deliberately provider-empty: Epic 03 ships interfaces and injection tokens
 * (`orchestrator-contracts/orchestrator.tokens.ts`) with no implementations,
 * so importing this module is a safe no-op. As engines are implemented in
 * later epics, each binds its token here — `{ provide:
 * INTELLIGENCE_RANKING_ENGINE, useClass: … }` — exactly as the Gurman seed
 * binds `GURMAN_RETRIEVER` in AppModule today.
 */
@Module({})
export class IntelligenceModule {}
