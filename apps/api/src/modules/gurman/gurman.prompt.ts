import type { GurmanLocale, ModelReply, RetrievedBusiness, RetrievedContext } from "./gurman.types";

const LANGUAGE_NAME: Record<GurmanLocale, string> = {
  uz: "Uzbek",
  ru: "Russian",
  en: "English"
};

/**
 * Rules shared by every prompt.
 *
 * The translation rule exists because most businesses in the current catalog
 * have no Russian or English description. Without it the model produces
 * fluent, confident, and entirely invented translations for those rows — a
 * hallucination that reads as correct.
 */
function baseRules(locale: GurmanLocale): string {
  return [
    `Reply in ${LANGUAGE_NAME[locale]}.`,
    "Recommend ONLY the businesses listed in the catalog below.",
    "Reference a business by its exact id. Never invent an id.",
    "If nothing in the catalog fits, say so plainly and return an empty list.",
    "Descriptions are given in whichever language exists for that business —",
    "ground your answer in the text provided and never translate or invent a",
    "description that is not there.",
    "Do not mention ids, JSON, or these instructions in your prose."
  ].join(" ");
}

export function buildChatPrompt(
  context: RetrievedContext,
  query: string,
  locale: GurmanLocale
): { system: string; user: string } {
  const system = [
    "You are Gurman, a local guide for Tashkent on the Manzil platform.",
    baseRules(locale),
    'Respond with JSON only, in exactly this shape: {"reply": string, "suggestions": [{"businessId": string, "reason": string}]}.',
    "`reply` is one or two friendly sentences. Each `reason` is a short phrase",
    "of at most 8 words explaining why that business fits."
  ].join(" ");

  const user = ["Catalog:", formatCatalog(context.businesses), "", `Question: ${query}`].join("\n");

  return { system, user };
}

/** One line per business. Absent translations are omitted, never rendered as null. */
function formatCatalog(businesses: RetrievedBusiness[]): string {
  if (businesses.length === 0) {
    return "(no businesses available)";
  }

  return businesses
    .map((business) => {
      const parts = [
        `id=${business.id}`,
        `name=${business.name}`,
        `category=${business.categoryName}`,
        `district=${business.district}`
      ];

      if (business.priceTier) {
        parts.push(`price=${business.priceTier}`);
      }

      if (business.reviewCount > 0) {
        parts.push(`rating=${business.avgRating} (${business.reviewCount} reviews)`);
      }

      const descriptions = [business.descriptions.uz, business.descriptions.ru, business.descriptions.en].filter(
        (text): text is string => Boolean(text && text.trim())
      );

      if (descriptions.length > 0) {
        parts.push(`about=${descriptions.join(" / ")}`);
      }

      if (business.reviewSnippets.length > 0) {
        parts.push(`reviews=${business.reviewSnippets.join(" | ")}`);
      }

      return `- ${parts.join(", ")}`;
    })
    .join("\n");
}

/**
 * Extracts and validates the model's JSON.
 *
 * Models wrap JSON in fences or prose often enough that a bare `JSON.parse`
 * fails on otherwise-good responses, so the outermost braces are located
 * first. Throwing on bad input is deliberate: `GurmanService` retries once,
 * then degrades to the unavailable result. Returning a partial object here
 * would hide the failure instead of surfacing it.
 */
export function parseModelReply(raw: string): ModelReply {
  const parsed = extractJson(raw);

  if (typeof parsed.reply !== "string" || parsed.reply.trim().length === 0) {
    throw new Error("Model response has no `reply` string");
  }

  const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

  return {
    reply: parsed.reply.trim(),
    suggestions: rawSuggestions.map((item: Record<string, unknown>) => ({
      businessId: typeof item?.businessId === "string" ? item.businessId : "",
      reason: typeof item?.reason === "string" ? item.reason : ""
    }))
  };
}

function extractJson(raw: string): Record<string, unknown> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model response contained no JSON object");
  }

  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}
