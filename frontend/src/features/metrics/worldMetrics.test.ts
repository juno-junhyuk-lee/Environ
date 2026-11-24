import { describe, expect, it } from "vitest";
import { createDefaultWorld, setNewElement } from "../../world/index.ts";
import { worldMetrics } from "./worldMetrics.ts";

describe("worldMetrics", () => {
  it("sums up the default world", () => {
    // 5 towns, 6 forests, 8 lakes, all at 50; neutral climate.
    const metrics = worldMetrics(createDefaultWorld());

    expect(metrics.population).toBe(250);
    expect(metrics.forestCover).toBeCloseTo((6 * 50) / 19);
    expect(metrics.waterQuality).toBe(50);
    expect(metrics.temperatureC).toBe(15);
    expect(metrics.carbon).toBe(50);
    expect(metrics.weather).toBe("sunny");
    expect(metrics.airQuality).toBeGreaterThan(0);
    expect(metrics.airQuality).toBeLessThanOrEqual(100);
  });

  it("reaches 100% forest cover on an island of healthy forest", () => {
    const world = createDefaultWorld();
    const forest = {
      ...world,
      tiles: world.tiles.map((tile) => ({
        ...setNewElement(tile, "forest"),
        conditionValue: 100,
      })),
    };
    const metrics = worldMetrics(forest);

    expect(metrics.forestCover).toBe(100);
    expect(metrics.population).toBe(0);
    expect(metrics.waterQuality).toBeNull();
  });

  it("follows the climate", () => {
    const world = {
      ...createDefaultWorld(),
      worldly: { temperatureC: 18.4, carbon: 66, weather: "drought" as const },
    };
    expect(worldMetrics(world)).toMatchObject({
      temperatureC: 18.4,
      carbon: 66,
      weather: "drought",
    });
  });
});
