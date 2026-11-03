import { describe, expect, it } from "vitest";
import {
  RIPPLE_MAX_OPACITY,
  RIPPLE_MAX_RADIUS,
  RIPPLE_SPOTS,
  rippleAt,
  ripplePhase,
  rippleSeed,
} from "./ripples.ts";

describe("rippleAt", () => {
  it("starts as a tiny, fully visible ring", () => {
    const start = rippleAt(0);
    expect(start.radius).toBeLessThan(0.01);
    expect(start.opacity).toBe(RIPPLE_MAX_OPACITY);
  });

  it("grows and fades as the cycle goes on", () => {
    const phases = [0.1, 0.3, 0.5, 0.7, 0.9];
    const rings = phases.map(rippleAt);
    for (let i = 1; i < rings.length; i += 1) {
      expect(rings[i]?.radius).toBeGreaterThan(rings[i - 1]?.radius ?? NaN);
      expect(rings[i]?.opacity).toBeLessThan(rings[i - 1]?.opacity ?? NaN);
    }
  });

  it("ends at full size and invisible", () => {
    const end = rippleAt(1);
    expect(end.radius).toBeCloseTo(RIPPLE_MAX_RADIUS);
    expect(end.opacity).toBe(0);
  });

  it("keeps every ring inside the tile", () => {
    const centreToFlatSide = 0.5;
    for (const spot of RIPPLE_SPOTS) {
      expect(Math.hypot(spot.x, spot.z) + RIPPLE_MAX_RADIUS).toBeLessThan(
        centreToFlatSide,
      );
    }
  });
});

describe("rippleSeed", () => {
  it("stays in [0, 1) for tiles on every side of the centre", () => {
    for (const [q, r] of [
      [0, 0],
      [-2, 0],
      [0, -2],
      [-1, -1],
      [2, -2],
      [-2, 2],
    ] as const) {
      const seed = rippleSeed(q, r);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(1);
    }
  });
});

describe("ripplePhase", () => {
  it("wraps into [0, 1)", () => {
    expect(ripplePhase(2.25, 0.5, 0.5)).toBeCloseTo(0.25);
    expect(ripplePhase(0, 0, 0)).toBe(0);
  });
});
