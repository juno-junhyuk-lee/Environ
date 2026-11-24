import { describe, expect, it } from "vitest";
import { HOP_HEIGHT, hopPose } from "./hop.ts";

const samples = Array.from({ length: 101 }, (_, i) => hopPose(i / 100));

describe("hopPose", () => {
  it("starts and ends at rest", () => {
    expect(hopPose(0)).toEqual({ y: 0, spin: 0 });
    expect(hopPose(1).y).toBeCloseTo(0);
    expect(hopPose(1).spin).toBe(0);
  });

  it("jumps to its full height and never sinks below the board", () => {
    const heights = samples.map((pose) => pose.y);
    expect(Math.max(...heights)).toBeCloseTo(HOP_HEIGHT, 2);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(-1e-9);
  });

  it("bounces after landing: touches down, rises again, settles", () => {
    const heights = samples.map((pose) => pose.y);
    const peak = heights.indexOf(Math.max(...heights));
    const afterPeak = heights.slice(peak);
    const firstTouch = afterPeak.findIndex((y) => y < 0.01);
    expect(firstTouch).toBeGreaterThan(0);
    expect(Math.max(...afterPeak.slice(firstTouch))).toBeGreaterThan(0.05);
  });

  it("spins one full turn, finishing while still in the air", () => {
    const spinDone = samples.findIndex(
      (pose) => pose.spin >= 2 * Math.PI - 1e-6,
    );
    expect(spinDone).toBeGreaterThan(0);
    expect(samples[spinDone]?.y ?? 0).toBeGreaterThan(0);
  });

  it("clamps progress outside 0 to 1", () => {
    expect(hopPose(-1)).toEqual(hopPose(0));
    expect(hopPose(2)).toEqual(hopPose(1));
  });
});
