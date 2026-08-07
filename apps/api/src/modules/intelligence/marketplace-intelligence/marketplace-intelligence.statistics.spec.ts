import {
  changeRate,
  dayPartShares,
  daysBetween,
  haversineKm,
  isWeekend,
  jaccard,
  localParts,
  MARKETPLACE_UTC_OFFSET_MINUTES,
  mean,
  median,
  peakWindows,
  percentileRank,
  precedingWindow,
  rankByFrequency,
  roundTo,
  share,
  toMoney,
  TREND_SIGNIFICANCE,
  trendDirection,
  weeklyHistogram,
  windowEndingAt,
  within
} from "./marketplace-intelligence.statistics";

const NOW = "2026-08-07T09:00:00.000Z";

describe("local wall-clock time", () => {
  it("shifts UTC into the marketplace's own hours", () => {
    // 2026-08-07 is a Friday. 13:00 UTC is 18:00 in Tashkent — dinner.
    expect(localParts(new Date("2026-08-07T13:00:00.000Z"))).toEqual({
      day: "friday",
      hour: 18
    });
    expect(MARKETPLACE_UTC_OFFSET_MINUTES).toBe(300);
  });

  it("rolls the day over correctly at the local midnight boundary", () => {
    // 20:00 UTC Friday is 01:00 Saturday locally.
    expect(localParts(new Date("2026-08-07T20:00:00.000Z"))).toEqual({
      day: "saturday",
      hour: 1
    });
  });

  it("knows which days are the weekend", () => {
    expect(isWeekend("saturday")).toBe(true);
    expect(isWeekend("friday")).toBe(false);
  });
});

describe("central tendency", () => {
  it("returns null for an empty set rather than zero — zero is a claim", () => {
    expect(mean([])).toBeNull();
    expect(median([])).toBeNull();
    expect(share(1, 0)).toBeNull();
  });

  it("prefers the median where one wedding package would move the mean", () => {
    const prices = [50_000, 60_000, 70_000, 12_000_000];

    expect(median(prices)).toBe(65_000);
    expect(mean(prices)).toBeGreaterThan(3_000_000);
  });

  it("averages the two middle values of an even set", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("percentile rank", () => {
  it("is null without peers — a rank needs a field to rank against", () => {
    expect(percentileRank(10, [])).toBeNull();
  });

  it("is the share of peers at or below the value", () => {
    expect(percentileRank(30, [10, 20, 30, 40])).toBe(0.75);
  });
});

describe("jaccard overlap", () => {
  it("treats two empty sets as no overlap, not as identical", () => {
    expect(jaccard(new Set(), new Set())).toBe(0);
  });

  it("measures shared over combined", () => {
    expect(jaccard(new Set(["a", "b"]), new Set(["b", "c"]))).toBeCloseTo(1 / 3);
  });
});

describe("change and trend", () => {
  it("refuses a rate when the earlier window was empty", () => {
    // 0 → 4 is a first month, not a 400% rise and not an infinite one.
    expect(changeRate(0, 4)).toBeNull();
    expect(trendDirection(null)).toBe("stable");
  });

  it("applies a dead band, so noise is not reported as decline", () => {
    expect(trendDirection(TREND_SIGNIFICANCE / 2)).toBe("stable");
    expect(trendDirection(-TREND_SIGNIFICANCE / 2)).toBe("stable");
    expect(trendDirection(0.5)).toBe("rising");
    expect(trendDirection(-0.5)).toBe("declining");
  });

  it("computes a relative change", () => {
    expect(changeRate(20, 27)).toBeCloseTo(0.35);
  });
});

describe("windows", () => {
  it("builds a half-open window ending now", () => {
    const window = windowEndingAt(NOW, 30);

    expect(window.end).toBe(NOW);
    expect(window.start).toBe("2026-07-08T09:00:00.000Z");
    expect(within(window, new Date("2026-07-20T00:00:00.000Z"))).toBe(true);
    expect(within(window, new Date(NOW))).toBe(false);
    expect(within(window, new Date("2026-07-08T08:59:59.000Z"))).toBe(false);
  });

  it("puts the preceding window immediately before, at the same length", () => {
    const current = windowEndingAt(NOW, 30);
    const previous = precedingWindow(current);

    expect(previous.end).toBe(current.start);
    expect(previous.start).toBe("2026-06-08T09:00:00.000Z");
  });
});

describe("weekly rhythm", () => {
  const fridayEvenings = [
    "2026-07-03T13:00:00.000Z",
    "2026-07-10T13:00:00.000Z",
    "2026-07-17T13:00:00.000Z",
    "2026-07-24T14:00:00.000Z",
    "2026-07-31T14:00:00.000Z"
  ].map((at) => new Date(at));

  it("counts into (local day, local hour) buckets, busiest first", () => {
    const buckets = weeklyHistogram(fridayEvenings);

    expect(buckets[0]).toEqual({ day: "friday", hour: 18, count: 3 });
    expect(buckets[1]).toEqual({ day: "friday", hour: 19, count: 2 });
  });

  it("merges adjacent peak hours into one window", () => {
    const windows = peakWindows(weeklyHistogram(fridayEvenings), fridayEvenings.length);

    expect(windows).toEqual([
      { day: "friday", startLocalTime: "18:00", endLocalTime: "20:00" }
    ]);
  });

  it("reports no peaks when there is nothing to be a peak of", () => {
    expect(peakWindows([], 0)).toEqual([]);
  });

  it("closes a 23:00 peak at midnight rather than at 24:00", () => {
    const lateNights = Array.from(
      { length: 4 },
      (_, index) => new Date(`2026-07-0${index + 1}T18:00:00.000Z`)
    );

    const windows = peakWindows(weeklyHistogram(lateNights), lateNights.length);
    for (const window of windows) {
      expect(window.endLocalTime).toMatch(/^\d{2}:00$/);
    }
  });
});

describe("day parts", () => {
  it("is null with no observations", () => {
    expect(dayPartShares([])).toBeNull();
  });

  it("splits observations across the four buckets, summing to one", () => {
    const parts = dayPartShares([
      new Date("2026-08-07T03:00:00.000Z"), // 08:00 local — morning
      new Date("2026-08-07T08:00:00.000Z"), // 13:00 local — daytime
      new Date("2026-08-07T14:00:00.000Z"), // 19:00 local — evening
      new Date("2026-08-07T20:00:00.000Z") // 01:00 local — night
    ]);

    expect(parts).toEqual({
      morningShare: 0.25,
      daytimeShare: 0.25,
      eveningShare: 0.25,
      nightShare: 0.25
    });
  });
});

describe("miscellany", () => {
  it("ranks by frequency, breaking ties by key for determinism", () => {
    expect(rankByFrequency(["b", "a", "b", "c", "a", "b"])).toEqual([
      ["b", 3],
      ["a", 2],
      ["c", 1]
    ]);
  });

  it("converts major units to minor", () => {
    expect(toMoney(1200.5, "UZS")).toEqual({ amountMinor: 120_050, currency: "UZS" });
  });

  it("measures distance on the globe", () => {
    // Tashkent centre to roughly 11 km north.
    const km = haversineKm({ lat: 41.3, lng: 69.24 }, { lat: 41.4, lng: 69.24 });
    expect(km).toBeGreaterThan(10);
    expect(km).toBeLessThan(12);
  });

  it("never reports negative days", () => {
    expect(daysBetween(new Date("2026-08-07"), new Date("2026-08-01"))).toBe(0);
    expect(daysBetween(new Date("2026-08-01"), new Date("2026-08-07"))).toBe(6);
  });

  it("rounds stably, so a recompute does not look like a change", () => {
    expect(roundTo(0.1 + 0.2)).toBe(0.3);
  });
});
