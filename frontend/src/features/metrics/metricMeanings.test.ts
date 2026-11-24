import { describe, expect, it } from "vitest";
import { createDefaultWorld } from "../../world/index.ts";
import { METRIC_MEANINGS } from "./metricMeanings.ts";
import { worldMetrics } from "./worldMetrics.ts";

const start = worldMetrics(createDefaultWorld());

describe("METRIC_MEANINGS", () => {
  it("reads each number with its current value", () => {
    expect(METRIC_MEANINGS.population.reading(start)).toMatch(/^250 /);
    expect(METRIC_MEANINGS.forestCover.reading(start)).toMatch(/^16% /);
    expect(METRIC_MEANINGS.waterQuality.reading(start)).toContain("50%");
    expect(METRIC_MEANINGS.temperatureC.reading(start)).toContain("15.0 °C");
    expect(METRIC_MEANINGS.carbon.reading(start)).toMatch(/^50 /);
  });

  it("says so when there are no lakes to measure", () => {
    expect(
      METRIC_MEANINGS.waterQuality.reading({ ...start, waterQuality: null }),
    ).toContain("no lakes");
  });

  it("has all three lines for every metric", () => {
    for (const meaning of Object.values(METRIC_MEANINGS)) {
      expect(meaning.reading(start)).not.toBe("");
      expect(meaning.realLife).not.toBe("");
      expect(meaning.inGame).not.toBe("");
    }
  });

  it("says why it matters for every metric except population", () => {
    const withWhy = Object.entries(METRIC_MEANINGS)
      .filter(([, meaning]) => meaning.whyItMatters !== undefined)
      .map(([key]) => key);
    expect(withWhy).toEqual([
      "forestCover",
      "waterQuality",
      "airQuality",
      "temperatureC",
      "carbon",
      "weather",
    ]);
  });
});
