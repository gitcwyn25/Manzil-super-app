/**
 * Layer 4 (Memory Engine) — validation, and the one rule this module exists
 * to enforce: **memory is structured knowledge, never chat**.
 *
 * The type system already makes a transcript unrepresentable — every tier's
 * payload is a named knowledge shape. But storage is JSON, and JSON accepts
 * anything: a row written by an older build, a future caller with an
 * `as never`, or an LLM adapter that "just attaches the message" would all
 * arrive as a plausible object. So the ban is enforced structurally too, on
 * the way in and on the way out.
 *
 * Two rules, the same two Epic 04 settled on:
 *
 * 1. **Typed causes only.** Every defect is an `IntelligenceError` from the
 *    frozen ten-cause taxonomy. Envelope defects are `knowledge_missing` with
 *    a precise `missingKey` — the read path *drops* what fails, so downstream
 *    the knowledge genuinely is missing. Raw conversation is a
 *    `policy_violation`, because it does not describe missing knowledge: it
 *    describes a rule the platform refuses to break.
 * 2. **Degrade, never throw.** A malformed memory must not take a recall
 *    down. Validators return errors; callers decide — the read path filters,
 *    the write path refuses.
 */
import type { IntelligenceError, MemoryTier } from "../core";
import { memoryTierRank } from "./memory.priority";
import { isValidMemoryTier, parseMemoryId } from "./memory.scope";
import type { AnyMemoryObject } from "./memory.tiers";

/** The Decision Engine rule id reported when raw conversation is detected. */
export const NO_RAW_CONVERSATION_RULE = "memory.no_raw_conversation";

/**
 * Keys that carry conversation rather than knowledge.
 *
 * Matched case-insensitively against every key in a payload, at any depth.
 * None of the six tier payloads — nor any Layer 2/3 type they embed — has a
 * field with these names, which is what makes the list safe to enforce and
 * cheap to reason about: a payload containing one did not come from the
 * contracts.
 */
export const RAW_CONVERSATION_KEYS: ReadonlySet<string> = new Set([
  "transcript",
  "transcripts",
  "message",
  "messages",
  "chat",
  "chathistory",
  "conversation",
  "conversationhistory",
  "dialog",
  "dialogue",
  "utterance",
  "utterances",
  "prompt",
  "completion",
  "rawtext",
  "raw_text",
  "text",
  "history"
]);

/**
 * Longest string a knowledge payload may hold.
 *
 * Structured knowledge is labels, ids, dimensions and values — "japanese",
 * "Cake confirmed", `biz_clx…`. Prose is the shape conversation takes when
 * somebody smuggles it through a field with an innocent name, and a paragraph
 * in a memory object is a paragraph an LLM will be handed as fact.
 */
export const MAX_KNOWLEDGE_STRING_LENGTH = 280;

/** Deepest nesting a payload may have; also the recursion guard. */
export const MAX_KNOWLEDGE_DEPTH = 8;

/**
 * Confidence is a probability: finite and inside [0, 1].
 *
 * Module-private, and deliberately not re-exported: `knowledge-graph` has the
 * same two-line check over the same Layer 0 primitive, and exporting a second
 * `isValidConfidence` from the intelligence barrel would put two names on one
 * concept — which is what `core/domain-language.ts` exists to prevent. The
 * right home for both is Layer 0, the day `core` gains runtime helpers rather
 * than contracts alone.
 */
function isValidConfidence(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

/** ISO-8601 instant that `Date` round-trips — the shape `IsoDateTime` promises. */
function isValidIsoDateTime(value: string): boolean {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function missing(memoryId: string | null, missingKey: string): IntelligenceError {
  return { kind: "knowledge_missing", entityId: memoryId, missingKey };
}

/**
 * Finds conversation hiding in a knowledge payload.
 *
 * Returns the path of the first offence (`preferences.0.text`) or null. First
 * rather than all, because the answer is binary: one transcript field means
 * the payload is refused, and the path is what tells the author where.
 */
export function findRawConversation(value: unknown, path = "", depth = 0): string | null {
  if (depth > MAX_KNOWLEDGE_DEPTH) return path || "knowledge";

  if (typeof value === "string") {
    return value.length > MAX_KNOWLEDGE_STRING_LENGTH ? path || "knowledge" : null;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findRawConversation(item, path ? `${path}.${index}` : `${index}`, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (value instanceof Map) {
    for (const [key, item] of value.entries()) {
      const found = findRawConversation(item, path ? `${path}.${String(key)}` : String(key), depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const here = path ? `${path}.${key}` : key;
      if (RAW_CONVERSATION_KEYS.has(key.toLowerCase())) return here;

      const found = findRawConversation(item, here, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Checks one memory object against the frozen envelope contract.
 *
 * The `retrievalPriority` check is the important one: a memory carrying a rank
 * its tier does not have would sort into the wrong place in every recall, and
 * the ordering is the part of the AI contract the Bible calls "not an
 * implementation detail".
 */
export function validateMemoryObject(memory: AnyMemoryObject): readonly IntelligenceError[] {
  const errors: IntelligenceError[] = [];
  const id = memory.memoryId ?? null;

  if (!isValidMemoryTier(memory.tier)) {
    errors.push(missing(id, "memory.tier"));
    // Everything below is defined relative to the tier; without one there is
    // nothing coherent left to check.
    return errors;
  }

  const scope = parseMemoryId(memory.memoryId ?? "");
  if (!scope) {
    errors.push(missing(id, "memory.memoryId"));
  } else if (scope.tier !== memory.tier) {
    errors.push(missing(id, "memory.memoryId.tier"));
  }

  if (!memory.source) errors.push(missing(id, "memory.source"));
  if (!isValidConfidence(memory.confidence)) errors.push(missing(id, "memory.confidence"));
  if (!isValidIsoDateTime(memory.created)) errors.push(missing(id, "memory.created"));
  if (!isValidIsoDateTime(memory.updated)) errors.push(missing(id, "memory.updated"));

  if (memory.expires !== null && !isValidIsoDateTime(memory.expires)) {
    errors.push(missing(id, "memory.expires"));
  }

  if (memory.retrievalPriority !== memoryTierRank(memory.tier)) {
    errors.push(missing(id, "memory.retrievalPriority"));
  }

  if (!memory.knowledge || typeof memory.knowledge !== "object") {
    errors.push(missing(id, "memory.knowledge"));
    return errors;
  }

  const rawAt = findRawConversation(memory.knowledge);
  if (rawAt) {
    errors.push({ kind: "policy_violation", ruleId: `${NO_RAW_CONVERSATION_RULE}:${rawAt}` });
  }

  return errors;
}

export interface MemoryScreenResult {
  /** Memories that passed validation, in input order. */
  readonly accepted: readonly AnyMemoryObject[];
  /** Rejected memories with the typed causes that rejected them. */
  readonly rejected: readonly {
    readonly memory: AnyMemoryObject;
    readonly errors: readonly IntelligenceError[];
  }[];
}

/**
 * Splits a batch into what the engine will serve and what it drops.
 *
 * Unlike the graph — where a bad edge is dropped and the node still served —
 * a memory object is atomic: its payload is one statement, so there is no
 * partial version of it that is still honest. It is served or it is not.
 */
export function screenMemories(memories: readonly AnyMemoryObject[]): MemoryScreenResult {
  const accepted: AnyMemoryObject[] = [];
  const rejected: { memory: AnyMemoryObject; errors: readonly IntelligenceError[] }[] = [];

  for (const memory of memories) {
    const errors = validateMemoryObject(memory);
    if (errors.length === 0) {
      accepted.push(memory);
    } else {
      rejected.push({ memory, errors });
    }
  }

  return { accepted, rejected };
}

/**
 * The typed cause for a tier that is absent or expired.
 *
 * `memory_missing` (not `knowledge_missing`) because the taxonomy has a cause
 * for exactly this and it carries the tier — so a reasoning stage that needed
 * the mission can say which tier failed it, and a dashboard can count how
 * often each tier is cold.
 */
export function memoryMissing(tier: MemoryTier, customerId: string | null): IntelligenceError {
  return { kind: "memory_missing", tier, customerId };
}
