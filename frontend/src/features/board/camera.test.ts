import { describe, expect, it } from "vitest";
import {
  cameraPosition,
  fitDistance,
  VIEW_ANGLE_FROM_VERTICAL,
} from "./camera.ts";

describe("fitDistance", () => {
  it("moves the camera back on a tall, narrow canvas", () => {
    expect(fitDistance(0.6)).toBeGreaterThan(fitDistance(1.5));
  });

  it("stops moving back once the canvas is wide enough", () => {
    expect(fitDistance(4)).toBeCloseTo(fitDistance(8));
  });
});

describe("cameraPosition", () => {
  it("is the requested distance from the centre, at the view angle", () => {
    const [x, y, z] = cameraPosition(7);
    expect(x).toBe(0);
    expect(Math.hypot(x, y, z)).toBeCloseTo(7);
    expect(Math.acos(y / 7)).toBeCloseTo(VIEW_ANGLE_FROM_VERTICAL);
  });
});
