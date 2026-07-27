import type { GroundedSuggestion, LiveBusiness, ModelSuggestion } from "./gurman.types";

/** Upper bound on cards shown. More than this reads as a list, not a recommendation. */
export const MAX_SUGGESTIONS = 4;

export type GroundingOutcome = {
  suggestions: GroundedSuggestion[];
  droppedIds: string[];
};

/**
 * Intersects model-returned business ids with rows that exist and are visible.
 *
 * This is the mechanical form of "every claim traces to a retrieved row".
 * Instructing a model to cite only real businesses is a request; this is a
 * guarantee. Anything the model returns that is not a live id is discarded and
 * reported, so a hallucinated business can never reach a rendered card.
 *
 * `name` and `slug` are read from `live`, never from the model — which is why
 * `ModelSuggestion` has no such fields.
 */
export function groundSuggestions(
  suggestions: ModelSuggestion[],
  live: Map<string, LiveBusiness>
): GroundingOutcome {
  const grounded: GroundedSuggestion[] = [];
  const droppedIds: string[] = [];
  const seen = new Set<string>();

  for (const suggestion of suggestions) {
    const id = typeof suggestion?.businessId === "string" ? suggestion.businessId : "";
    const reason = typeof suggestion?.reason === "string" ? suggestion.reason.trim() : "";

    if (!id || seen.has(id)) {
      continue;
    }

    const row = live.get(id);
    if (!row) {
      // Unknown id: either a hallucination, or a business unpublished since the
      // response was generated. Both must be dropped, and both are worth logging.
      droppedIds.push(id);
      seen.add(id);
      continue;
    }

    seen.add(id);

    // A card with no reason is noise; drop rather than render an empty caption.
    if (!reason) {
      continue;
    }

    grounded.push({ businessId: row.id, slug: row.slug, name: row.name, reason });

    if (grounded.length === MAX_SUGGESTIONS) {
      break;
    }
  }

  return { suggestions: grounded, droppedIds };
}
