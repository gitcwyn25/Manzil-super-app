import {
  ASPECT_LEXICON,
  aspectsMentioned,
  BUSINESS_ASPECTS,
  countNoiseMentions,
  extractAspectSignals,
  noiseLevelFrom,
  normalizeReviewText,
  ratingToSentiment
} from "./review-signals";
import { MODEL_EVIDENCE_FLOOR } from "./marketplace-intelligence.evidence";
import type { ReviewIntelligenceRow } from "./marketplace-intelligence.projection";

function review(
  text: string,
  rating: number,
  over: Partial<ReviewIntelligenceRow> = {}
): ReviewIntelligenceRow {
  return {
    id: `rev_${Math.random()}`,
    businessId: "biz_1",
    userId: `usr_${Math.random()}`,
    rating,
    text,
    moderationStatus: "approved",
    bookingId: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    hasReply: false,
    ...over
  };
}

/** Three reviews naming one aspect — exactly the floor. */
function thrice(text: string, rating: number): readonly ReviewIntelligenceRow[] {
  return [review(text, rating), review(text, rating), review(text, rating)];
}

describe("the lexicon", () => {
  it("covers every aspect the business contract names", () => {
    for (const aspect of BUSINESS_ASPECTS) {
      expect(ASPECT_LEXICON[aspect].length).toBeGreaterThan(0);
    }
  });

  it("keeps every stem long enough to be a root rather than a syllable", () => {
    for (const aspect of BUSINESS_ASPECTS) {
      for (const stem of ASPECT_LEXICON[aspect]) {
        expect(stem.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("anchors stems to the start of a word, so short roots do not hide inside others", () => {
    // `еда` is food; `победа` is victory and mentions no food at all.
    expect(aspectsMentioned("Полная победа")).not.toContain("food_quality");
    expect(aspectsMentioned("Вкусная еда")).toContain("food_quality");

    // `дет` is child; `идет` is "it goes".
    expect(aspectsMentioned("Ремонт идет")).not.toContain("kids_friendliness");
    expect(aspectsMentioned("С детьми удобно")).toContain("kids_friendliness");
  });

  it("still matches suffixes, because both languages inflect heavily", () => {
    expect(aspectsMentioned("Narxlari juda qimmat")).toContain("value_for_money");
    expect(aspectsMentioned("По ценам дороговато")).toContain("value_for_money");
  });

  it("recognises the same aspect in Uzbek, Russian and English", () => {
    expect(aspectsMentioned("Parkovka juda yomon")).toContain("parking");
    expect(aspectsMentioned("Нет парковки")).toContain("parking");
    expect(aspectsMentioned("No parking at all")).toContain("parking");
  });

  it("folds the three apostrophes Uzbek Latin uses onto one", () => {
    expect(normalizeReviewText("Qoʻpol")).toBe("qo'pol");
    expect(aspectsMentioned("Xodimlar juda qoʻpol")).toContain("staff_friendliness");
  });

  it("reports nothing for a review that names nothing", () => {
    expect(aspectsMentioned("Zo'r!")).toEqual([]);
    expect(aspectsMentioned("")).toEqual([]);
  });
});

describe("sentiment", () => {
  it("comes from the star rating the reviewer chose, linearly", () => {
    expect(ratingToSentiment(5)).toBe(1);
    expect(ratingToSentiment(3)).toBe(0);
    expect(ratingToSentiment(1)).toBe(-1);
    expect(ratingToSentiment(4)).toBe(0.5);
  });
});

describe("extractAspectSignals", () => {
  it("publishes nothing from fewer mentions than the floor", () => {
    const signals = extractAspectSignals([review("Parkovka yo'q", 1), review("Parkovka yo'q", 1)]);

    expect(signals.strengths).toEqual([]);
    expect(signals.weaknesses).toEqual([]);
    expect(signals.belowFloor).toContain("parking");
    expect(MODEL_EVIDENCE_FLOOR.business_strengths.minObservations).toBe(3);
  });

  it("publishes a weakness at the floor, carrying its evidence count", () => {
    const signals = extractAspectSignals(thrice("Parkovka yo'q", 1));

    expect(signals.weaknesses).toHaveLength(1);
    expect(signals.weaknesses[0]).toMatchObject({
      aspect: "parking",
      score: -1,
      evidenceCount: 3,
      source: "review"
    });
    expect(signals.weaknesses[0]?.confidence).toBeGreaterThan(0);
    expect(signals.weaknesses[0]?.confidence).toBeLessThan(1);
  });

  it("ignores unmoderated reviews — a rejected review shapes nothing", () => {
    const signals = extractAspectSignals([
      ...thrice("Parkovka yo'q", 1).map((row) => ({ ...row, moderationStatus: "pending" }))
    ]);

    expect(signals.weaknesses).toEqual([]);
    expect(signals.reviewsRead).toBe(0);
  });

  it("calls an exactly-neutral aspect neither a strength nor a weakness", () => {
    const signals = extractAspectSignals(thrice("Parkovka bor", 3));

    expect(signals.strengths).toEqual([]);
    expect(signals.weaknesses).toEqual([]);
  });

  it("orders by strength, so a renderer showing three shows the three that matter", () => {
    const signals = extractAspectSignals([
      ...thrice("Taomlar juda mazali", 5),
      ...thrice("Parkovka biroz qiyin", 2)
    ]);

    expect(signals.strengths[0]?.aspect).toBe("food_quality");
    expect(signals.weaknesses[0]?.aspect).toBe("parking");
    expect(Math.abs(signals.strengths[0]!.score)).toBeGreaterThan(0);
  });

  it("counts one review once per aspect, however often it repeats the word", () => {
    const signals = extractAspectSignals([
      review("Parkovka parkovka parkovka", 1),
      review("Parkovka", 1),
      review("Parkovka", 1)
    ]);

    expect(signals.weaknesses[0]?.evidenceCount).toBe(3);
  });
});

describe("noise level", () => {
  it("reads the level from words that name it, never from the rating", () => {
    // Five stars and loud: a great review of a loud venue.
    const mentions = countNoiseMentions([
      review("Juda shovqin, lekin ajoyib", 5),
      review("Очень шумно тут", 5),
      review("Loud music, loved it", 5)
    ]);

    expect(mentions).toEqual({ quiet: 0, loud: 3 });
    expect(noiseLevelFrom(mentions)).toBe("loud");
  });

  it("is null when nobody mentioned it — silence is not quiet", () => {
    expect(noiseLevelFrom(countNoiseMentions([review("Zo'r joy", 5)]))).toBeNull();
    expect(noiseLevelFrom({ quiet: 1, loud: 1 })).toBeNull();
  });

  it("calls a venue medium when reviewers genuinely disagree", () => {
    expect(noiseLevelFrom({ quiet: 2, loud: 2 })).toBe("medium");
  });

  it("calls it quiet when two thirds of the mentions say so", () => {
    expect(noiseLevelFrom({ quiet: 4, loud: 1 })).toBe("quiet");
  });
});
