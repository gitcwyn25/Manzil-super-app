export type GurmanLocale = "uz" | "ru" | "en";

/** A business as handed to the model. Ids are opaque to it; it may only echo them back. */
export type RetrievedBusiness = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  district: string;
  priceTier: string | null;
  avgRating: number;
  reviewCount: number;
  /** `uz` is always present; the others are null for most rows. Never synthesise a missing one. */
  descriptions: { uz: string; ru: string | null; en: string | null };
  reviewSnippets: string[];
};

export type RetrievedContext = {
  businesses: RetrievedBusiness[];
};

/**
 * The minimum needed to render a card. Deliberately excludes anything the model
 * supplied — name and slug come from the database at serve time.
 */
export type LiveBusiness = {
  id: string;
  slug: string;
  name: string;
};

/**
 * What the model is allowed to return per suggestion.
 *
 * Note there is no `name` or `slug` field: the schema itself prevents the model
 * from asserting a business identity. It can only point at an id, and an id it
 * invents is dropped.
 */
export type ModelSuggestion = {
  businessId: string;
  reason: string;
};

export type ModelReply = {
  reply: string;
  suggestions: ModelSuggestion[];
};

export type GroundedSuggestion = {
  businessId: string;
  slug: string;
  name: string;
  reason: string;
};

export type GurmanChatResult = {
  reply: string;
  suggestions: GroundedSuggestion[];
};

/**
 * The `POST /gurman/ask` response shape. `available` is the honest signal
 * the web layer renders on: `false` means Gurman has nothing real to say
 * right now (no API key configured, or the model/upstream failed) — `text`
 * is empty and `businesses` is always `[]` in that case. It is never used as
 * a place to smuggle a canned fallback answer.
 */
export type GurmanAskResult = {
  text: string;
  businesses: GroundedSuggestion[];
  available: boolean;
};

export type GurmanPackageResult = {
  title: string;
  reply: string;
  stops: GroundedSuggestion[];
};
