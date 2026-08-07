/**
 * Layer 2 (Marketplace Intelligence) — reading strengths and weaknesses out of
 * reviews, deterministically.
 *
 * Doc 16 wants the stored profile to say "Italian. Great for birthdays. Fast
 * service. Private room. Weak parking." Doc 22 wants it derived from the
 * reviews the business already has. Epic 06 is explicitly **pre-LLM and
 * pre-embedding**, so this is a lexicon: a closed list of stems per
 * `BusinessAspect`, matched against review text in the three languages the
 * marketplace speaks.
 *
 * **Why a lexicon is honest here.** It never invents an aspect — an aspect is
 * reported only when reviewers named it, in words this file lists, at least
 * `business_strengths.minObservations` times. And the polarity is not guessed
 * from the prose at all: it is the **star rating the reviewer gave**, which is
 * a number they chose themselves. So the claim the platform makes is precisely
 * "three people who mentioned parking rated this business 2.0 on average" —
 * checkable by a human, and nothing more than the rows say.
 *
 * What it cannot do is understand negation ("not bad at all") or sarcasm. That
 * is a real limit, and it is why the floor is three mentions rather than one,
 * and why `MAX_DERIVED_CONFIDENCE` caps everything this file produces.
 *
 * Imports `core` and Layer 2 contracts only.
 */
import type { Confidence } from "../core";
import type { BusinessAspect, BusinessAspectAssessment } from "../business-intelligence";
import { MODEL_EVIDENCE_FLOOR, confidenceFromSample } from "./marketplace-intelligence.evidence";
import { FACT_SOURCE, isPublishedReview, type ReviewIntelligenceRow } from "./marketplace-intelligence.projection";
import { roundTo } from "./marketplace-intelligence.statistics";

/**
 * Aspect stems, uz · ru · en.
 *
 * Stems rather than words because Uzbek and Russian inflect heavily
 * (`narx`, `narxi`, `narxlar`; `цена`, `цены`, `ценам`), and a stem list is
 * reviewable by a native speaker in a way a morphological analyzer is not.
 * Matching is substring-on-normalized-text, so stems must be long enough not
 * to collide — every entry here is at least four characters for that reason.
 *
 * Exhaustive by construction: an aspect added to `BusinessAspect` without
 * stems does not compile.
 */
export const ASPECT_LEXICON = {
  food_quality: [
    "taom", "ovqat", "mazza", "mazali", "shirin", "menyu",
    "еда", "блюд", "вкус", "кухн", "меню",
    "food", "dish", "tasty", "delicious", "menu", "cuisine"
  ],
  service_speed: [
    "tez ", "tezkor", "kutish vaqti", "sekin",
    "быстр", "медлен", "оператив",
    "fast", "quick", "slow", "prompt"
  ],
  staff_friendliness: [
    "xodim", "ofitsiant", "xushmuomala", "mehmondo", "qo'pol", "qopol",
    "персонал", "официант", "вежлив", "груб", "приветлив",
    "staff", "waiter", "friendly", "rude", "polite", "welcoming"
  ],
  atmosphere: [
    "muhit", "atmosfera", "interyer", "hordiq", "qulay",
    "атмосфер", "интерьер", "уютн", "обстанов",
    "atmosphere", "ambien", "interior", "cozy", "vibe"
  ],
  cleanliness: [
    "toza", "tozalik", "iflos", "gigien",
    "чист", "грязн", "гигиен", "убран",
    "clean", "dirty", "hygien", "tidy"
  ],
  value_for_money: [
    "narx", "qimmat", "arzon", "puliga",
    "цена", "цены", "дорог", "дешев", "недорог", "стоимост",
    "price", "expensive", "cheap", "value", "afford", "overpriced"
  ],
  parking: [
    "parkovka", "avtoturargoh", "mashina qo'y", "mashina qoy",
    "парков", "стоянк", "припарк",
    "parking", "park the car"
  ],
  kids_friendliness: [
    "bola", "bolalar", "farzand", "oilaviy",
    "дет", "ребен", "семейн",
    "kid", "child", "family friendly", "playground"
  ],
  group_handling: [
    "katta guruh", "guruh", "kompaniya bilan", "davra",
    "больш компан", "групп", "компани",
    "group", "large party", "big table"
  ],
  event_hosting: [
    "tug'ilgan kun", "tugilgan kun", "to'y", "toy ", "bayram", "tadbir", "banket",
    "день рожден", "свадьб", "банкет", "меропр", "празд",
    "birthday", "wedding", "banquet", "event", "celebration"
  ],
  wait_time: [
    "navbat", "kutdik", "kutish",
    "очеред", "ждать", "ожидан",
    "queue", "waited", "waiting time"
  ],
  noise_level: [
    "shovqin", "tinch", "jimjit", "baland ovoz",
    "шумн", "тихо", "громк", "музык гром",
    "noisy", "quiet", "loud"
  ],
  accessibility: [
    "nogiron", "kirish qulay", "pandus",
    "инвалид", "пандус", "доступн",
    "wheelchair", "accessible", "ramp"
  ],
  media_presence: [
    "rasm", "surat", "foto",
    "фото", "снимк", "инстаграм",
    "photo", "picture", "instagram"
  ]
} as const satisfies Readonly<Record<BusinessAspect, readonly string[]>>;

/** Every aspect the lexicon covers, in declaration order. */
export const BUSINESS_ASPECTS = Object.keys(ASPECT_LEXICON) as readonly BusinessAspect[];

/**
 * Normalizes review text for matching.
 *
 * Lower-cases, folds the three apostrophes Uzbek Latin uses (`ʻ ʼ '`) onto
 * one, and collapses whitespace — so `Qo'pol`, `Qoʻpol` and `QO POL` all reach
 * the same stem.
 */
export function normalizeReviewText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʻʼ'`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True when a stem occurs at the start of a word in `text`.
 *
 * Word-anchored rather than a plain substring, because the shortest useful
 * Russian roots are genuinely three letters — `еда` (food), `дет` (child) —
 * and as substrings they hide inside `победа` and `идет`. Anchoring the left
 * edge keeps the stems short enough to cover inflection (`детям`, `детей`)
 * without matching unrelated words that happen to contain them.
 *
 * The right edge is deliberately open: Uzbek and Russian both suffix heavily,
 * so `narx` must match `narxlar` and `цена` must match `ценам`. Stems where an
 * open right edge would over-match carry an explicit trailing space (`"tez "`).
 */
export function stemMatches(normalizedText: string, stem: string): boolean {
  const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escaped}`, "u").test(normalizedText);
}

/** The aspects one review mentions, deduplicated. */
export function aspectsMentioned(text: string): readonly BusinessAspect[] {
  const normalized = normalizeReviewText(text);
  if (normalized.length === 0) return [];

  return BUSINESS_ASPECTS.filter((aspect) =>
    ASPECT_LEXICON[aspect].some((stem) => stemMatches(normalized, stem))
  );
}

/** Running tally for one aspect. */
interface AspectTally {
  mentions: number;
  ratingSum: number;
  newestAt: number;
}

/**
 * Star rating → sentiment in [-1, 1].
 *
 * Linear on the 1–5 scale with 3 as neutral, because that is what the widget
 * the reviewer used means. No curve, no weighting: a transformation the
 * reviewer would recognize as their own opinion.
 */
export function ratingToSentiment(averageRating: number): number {
  return roundTo(Math.max(-1, Math.min(1, (averageRating - 3) / 2)), 2);
}

/** Aspect assessments split into the two lists `BusinessSummary` carries. */
export interface AspectSignals {
  readonly strengths: readonly BusinessAspectAssessment[];
  readonly weaknesses: readonly BusinessAspectAssessment[];
  /** Aspects reviewers named but not often enough to publish. */
  readonly belowFloor: readonly BusinessAspect[];
  /** Published reviews actually read. */
  readonly reviewsRead: number;
}

/**
 * Reads aspect strengths and weaknesses out of a business's reviews.
 *
 * Only **approved** reviews are read: a summary built on unmoderated text
 * would let a rejected review shape what the platform says about a business.
 *
 * Aspects with fewer than `business_strengths.minObservations` mentions are
 * reported in `belowFloor` rather than published — visible to the owner voice
 * as "not enough evidence yet", invisible to ranking. Exactly-neutral aspects
 * (average rating 3.0) are neither a strength nor a weakness and appear in
 * neither list; calling them strengths is how a profile becomes flattery.
 */
export function extractAspectSignals(reviews: readonly ReviewIntelligenceRow[]): AspectSignals {
  const published = reviews.filter((review) => isPublishedReview(review.moderationStatus));
  const tallies = new Map<BusinessAspect, AspectTally>();

  for (const review of published) {
    for (const aspect of aspectsMentioned(review.text)) {
      const tally = tallies.get(aspect) ?? { mentions: 0, ratingSum: 0, newestAt: 0 };

      tallies.set(aspect, {
        mentions: tally.mentions + 1,
        ratingSum: tally.ratingSum + review.rating,
        newestAt: Math.max(tally.newestAt, review.createdAt.getTime())
      });
    }
  }

  const floor = MODEL_EVIDENCE_FLOOR.business_strengths.minObservations;
  const strengths: BusinessAspectAssessment[] = [];
  const weaknesses: BusinessAspectAssessment[] = [];
  const belowFloor: BusinessAspect[] = [];

  for (const aspect of BUSINESS_ASPECTS) {
    const tally = tallies.get(aspect);
    if (!tally) continue;

    if (tally.mentions < floor) {
      belowFloor.push(aspect);
      continue;
    }

    const score = ratingToSentiment(tally.ratingSum / tally.mentions);
    if (score === 0) continue;

    const assessment: BusinessAspectAssessment = {
      aspect,
      score,
      evidenceCount: tally.mentions,
      source: FACT_SOURCE.review,
      confidence: aspectConfidence(tally.mentions)
    };

    if (score > 0) strengths.push(assessment);
    else weaknesses.push(assessment);
  }

  // Strongest first, so a renderer that shows three shows the three that
  // matter; ties broken by evidence, then by name for determinism.
  const byStrength = (a: BusinessAspectAssessment, b: BusinessAspectAssessment) =>
    Math.abs(b.score) - Math.abs(a.score) ||
    b.evidenceCount - a.evidenceCount ||
    a.aspect.localeCompare(b.aspect);

  return {
    strengths: strengths.sort(byStrength),
    weaknesses: weaknesses.sort(byStrength),
    belowFloor,
    reviewsRead: published.length
  };
}

/** Confidence of one aspect assessment, from how many reviewers named it. */
export function aspectConfidence(mentions: number): Confidence {
  return confidenceFromSample(mentions, MODEL_EVIDENCE_FLOOR.business_strengths.minObservations);
}

/**
 * Stems that name a noise *level* rather than the topic of noise.
 *
 * The aspect lexicon above answers "did anybody talk about noise?", which is
 * all a sentiment score needs. The `noise` feature is different: it is a
 * `NoiseLevel`, so it needs the reviewers to have named the level itself.
 * "Great music, so loud!" is a five-star review of a loud venue, and reading
 * the level off the rating would call it quiet.
 *
 * So these stems are the words for loud and for quiet, counted directly. A
 * venue whose reviewers say both, in similar numbers, is `medium` — which is
 * an honest reading of disagreement, not an average of opinions.
 */
export const NOISE_STEMS = {
  quiet: ["tinch", "jimjit", "sokin", "тихо", "тихий", "спокойн", "quiet", "peaceful", "calm"],
  loud: ["shovqin", "baland ovoz", "шумн", "громк", "noisy", "loud"]
} as const;

/** Mentions of loudness and of quiet in a review set. */
export interface NoiseMentions {
  readonly quiet: number;
  readonly loud: number;
}

/** Counts noise-level words across published reviews. */
export function countNoiseMentions(reviews: readonly ReviewIntelligenceRow[]): NoiseMentions {
  let quiet = 0;
  let loud = 0;

  for (const review of reviews.filter((row) => isPublishedReview(row.moderationStatus))) {
    const text = normalizeReviewText(review.text);
    if (NOISE_STEMS.quiet.some((stem) => stemMatches(text, stem))) quiet += 1;
    if (NOISE_STEMS.loud.some((stem) => stemMatches(text, stem))) loud += 1;
  }

  return { quiet, loud };
}

/**
 * The observed noise level, or null below the aspect floor.
 *
 * Null rather than `medium`: "nobody mentioned the noise" and "reviewers
 * disagree about the noise" are different facts, and only the second one is a
 * medium venue.
 */
export function noiseLevelFrom(mentions: NoiseMentions): "quiet" | "medium" | "loud" | null {
  const total = mentions.quiet + mentions.loud;
  if (total < MODEL_EVIDENCE_FLOOR.business_strengths.minObservations) return null;

  const quietShare = mentions.quiet / total;
  if (quietShare >= 0.66) return "quiet";
  if (quietShare <= 0.34) return "loud";
  return "medium";
}
