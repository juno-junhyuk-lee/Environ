import { describe, expect, it } from "vitest";
import { yearTimerPose } from "./yearTimer.ts";

const poses = Array.from({ length: 1001 }, (_, i) => yearTimerPose(i / 1000));

describe("yearTimerPose", () => {
  it("starts empty and at rest, and ends full and at rest", () => {
    expect(yearTimerPose(0)).toEqual({ fill: 0, scaleX: 1, scaleY: 1 });
    const end = yearTimerPose(1);
    expect(end.fill).toBe(1);
    expect(end.scaleX).toBeCloseTo(1);
    expect(end.scaleY).toBeCloseTo(1);
  });

  it("fills slowly at first, then faster (ease-in), never going back", () => {
    expect(yearTimerPose(0.43).fill).toBeLessThan(0.43);
    poses.slice(1).forEach((pose, i) => {
      expect(pose.fill).toBeGreaterThanOrEqual(poses[i]?.fill ?? 0);
    });
  });

  it("pops only once full: bulges wide, then springs back past rest", () => {
    const filling = poses.filter((pose) => pose.fill < 1);
    expect(filling.every((pose) => pose.scaleX === 1)).toBe(true);

    const widest = Math.max(...poses.map((pose) => pose.scaleX));
    expect(widest).toBeCloseTo(2, 1);
    // The spring overshoots: briefly narrower than at rest.
    expect(Math.min(...poses.map((pose) => pose.scaleX))).toBeLessThan(1);
  });

  it("clamps progress outside 0 to 1", () => {
    expect(yearTimerPose(-0.5)).toEqual(yearTimerPose(0));
    expect(yearTimerPose(3)).toEqual(yearTimerPose(1));
  });

  it("fills steadily with no pop for reduced motion", () => {
    expect(yearTimerPose(0.3, true)).toEqual({
      fill: 0.3,
      scaleX: 1,
      scaleY: 1,
    });
    expect(yearTimerPose(0.95, true).scaleX).toBe(1);
  });
});
