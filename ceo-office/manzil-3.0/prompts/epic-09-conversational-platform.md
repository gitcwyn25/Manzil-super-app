# Epic 09 — Gurman Conversational Intelligence Platform

> QUEUED behind Epic 08. **The first epic that touches live LLM providers.** The LLM is NOT the intelligence — it communicates the intelligence created by epics 03-08. Providers swappable by configuration only; zero business rules inside prompts.

**Flow:** Customer → Conversation → Intent → Retrieval (07) → Reasoning (08) → Tool Orchestrator → LLM → natural conversation.

- **AIProvider abstraction:** identical interface for OpenAI, Anthropic, Gemini, OpenRouter, local (Ollama/vLLM), future. Config-swap only. (Existing seed: gurman.llm.ts already pins Anthropic — refactor behind the abstraction.)
- **ConversationOrchestrator:** receives the Decision Object, determines strategy + tools, builds context, requests generation, returns response. Never performs business logic.
- **Prompt Engine:** prompts are versioned templates treated as code — layers: system, product identity, current mission, workspace context, decision summary, response style, safety, language. No marketplace knowledge, pricing, or ranking in prompts.
- **Context Builder:** from Decision + Explanation objects, mission/preference context, Workspace Timeline, current screen/locale/tools/session. Never repositories, never raw entities (Epic 03's typed LLM boundary enforces this).
- **Tool calling:** structured execution — search businesses, create/modify/share workspace, replace business, book experience, reserve table, create campaign, manage favorites, generate plan, update preferences. Every tool: input/output schema, validation, authorization, audit, timeout, retry. (Tools that need absent backend capability — booking, reservations — expose honest unavailable results until their engines exist; no fake success.)
- **Streaming:** streaming/partial/interrupt/cancel/resume + token accounting.
- **Multilingual:** uz/ru/en, auto-detected; reasoning stays language-independent.
- **Personality:** configurable (professional, friendly, luxury, minimal, family, business) — configuration, never hardcoded tone.
- **Safety:** prompt-injection protection, context validation, tool validation, sensitive-info filtering, hallucination guard, output validation, PII protection, rate limiting.
- **Cost management:** tokens/latency/cost/provider/failures/fallbacks/length/tool-calls per workspace/customer/organization.
- **Fallback chain:** retry → fallback provider → cached response → graceful failure. Conversation never crashes.
- **Observability:** conversationId, workspaceId, customerId, provider, model, latency, tokens, toolCalls, cost, reasoningId, decisionId, cacheHits, errors.
- **Audit:** conversation metadata, prompt version, provider, model, tools executed, decision referenced. Sensitive prompts only under policy.
- **Testing:** unit, conversation, tool, provider, streaming, fallback, security, prompt, localization, performance.
- **Docs:** conversation architecture, provider/prompt/tool/streaming/security/extension guides, sequence diagrams.

**STRICT RULES:** the LLM never decides, never ranks, never optimizes, never replaces the Reasoning Engine. It only communicates structured intelligence.

**ADR-008 — LLM as a Replaceable Interface** (write during this epic; event-sourcing renumbers to ADR-009): LLMs are presentation layers · business logic never lives in prompts · prompts versioned as code · one interface for all providers · deterministic validated tool execution · system functions when providers are down · context built only from structured outputs · every interaction observable/auditable/cost-tracked · new providers = config change, not rewrite.

Gates: typecheck + full jest green. Provider keys via env only (ANTHROPIC_API_KEY exists in the API env); never commit secrets. Never push.
