# 🧠 MANZIL — The Intelligence Layer (v1.0)

> Captured 2026-08-06. **Do NOT build an LLM. Build the Intelligence Layer.** The moat is knowledge, not language; the LLM is ~20% of Gurman and always the LAST step.

## Five layers

1. **Raw marketplace data** — businesses, services, staff, hours, menus, amenities, reviews, stories, announcements, campaigns, events, availability.
2. **Marketplace Intelligence** — continuously generated facts from OUR data (avg visit 82min · families 61% · peak 08:00 · weekend crowded). None of it comes from an LLM.
3. **Knowledge Graph** — the moat: businesses/services/experiences as connected structured facts.
4. **Reasoning Engine** — intent → workspace → budget → distance → availability → graph → ranking → constraint solver → candidates. **The reasoning engine decides; the LLM never does.**
5. **Conversation** — the LLM explains decisions in natural language. It doesn't think.

## Specialized RAG (when Epic 04 arrives; never one giant embedding pot)

Business RAG (menus, reviews, policies) · User RAG (preferences, visits, plans) · City RAG (events, weather, transport) · Knowledge RAG (cuisine/wedding/tourism ontologies) · Marketplace RAG (campaigns, health, demand).

## Memory = structured knowledge, never chat

`{preference: cuisine=japanese, confidence: 0.91, source: conversation, updated: today}` — budget, distance, patterns all stored the same way. **Stored summaries, not regeneration**: every business gets a continuously-updated AI profile (strengths/weaknesses/best-for) from its 500 reviews + 800 stories; every customer a summary updated after each experience. Relationship inference: restaurant→cafe→hotel = business trips; salon→nails→spa = beauty routine — inferred memories.

## Nightly update pipeline

New reviews → summarize → update business profile → embeddings → knowledge graph → recommendations. Customer activity → summarize → preference update → memory → recommendations.

## Own LLM?

No — not for years. Eventually fine-tune an open model to *speak* like Gurman (voice, not knowledge); the data pipeline already knows the businesses. Model providers stay interchangeable — switching is a config change, never a rewrite.

## Target architecture

```
USER → Intent Detection → {Workspace, User Memory, Business Graph}
     → Marketplace Intelligence → {Business RAG, Preference Engine, Ranking Engine}
     → Tool Orchestrator → {Booking/CRM/Search/Availability/Campaign APIs}
     → LLM → natural, explainable answer
```

Implementation begins with the Intelligence Platform architecture sprint (interfaces-only, `apps/api/src/modules/intelligence/`) — see Epic 03 sprint record.
