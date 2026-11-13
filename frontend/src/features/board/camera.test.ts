import { describe, expect, it } from "vitest";
import {
  CAMERA_FOV,
  cameraPosition,
  centringOffset,
  fitDistance,
  SEA_ASPECT,
  SEA_RADIUS,
  VIEW_ANGLE_FROM_VERTICAL,
} from "./camera.ts";

/**
 * How much of the canvas the sea's rim reaches, as fractions of the half
 * width and half height (1 = touching the edge), from points around the rim
 * projected through the camera.
 */
function seaExtent(aspect: number): { width: number; height: number } {
  const d = fitDistance(aspect);
  const sin = Math.sin(VIEW_ANGLE_FROM_VERTICAL);
  const cos = Math.cos(VIEW_ANGLE_FROM_VERTICAL);
  const tanV = Math.tan((CAMERA_FOV * Math.PI) / 360);
  let width = 0;
  let height = 0;
  for (let i = 0; i < 3600; i += 1) {
    const angle = (i / 3600) * 2 * Math.PI;
    const x = SEA_RADIUS * Math.cos(angle);
    const z = SEA_RADIUS * Math.sin(angle);
    const depth = d - z * sin;
    width = Math.max(width, Math.abs(x) / (depth * tanV * aspect));
    height = Math.max(height, Math.abs(z * cos) / (depth * tanV));
  }
  return { width, height };
}

describe("fitDistance", () => {
  it("moves the camera back on a tall, narrow canvas", () => {
    expect(fitDistance(0.6)).toBeGreaterThan(fitDistance(1.5));
  });

  it("stops moving back once the canvas is wide enough", () => {
    expect(fitDistance(4)).toBeCloseTo(fitDistance(8));
  });

  it.each([0.6, 1, 1.5, 3])(
    "fits the whole sea on a %s:1 canvas, touching one pair of edges",
    (aspect) => {
      const { width, height } = seaExtent(aspect);
      expect(width).toBeLessThanOrEqual(1);
      expect(height).toBeLessThanOrEqual(1);
      expect(Math.max(width, height)).toBeGreaterThan(0.95);
    },
  );

  it("at SEA_ASPECT, the sea fills the canvas both ways (no sky beside it)", () => {
    const { width, height } = seaExtent(SEA_ASPECT);
    expect(width).toBeGreaterThan(0.95);
    expect(height).toBeGreaterThan(0.95);
  });
});

describe("centringOffset", () => {
  it("moves the sea up a little, so it's centred vertically", () => {
    const d = fitDistance(SEA_ASPECT);
    const offset = centringOffset(d);
    const sin = Math.sin(VIEW_ANGLE_FROM_VERTICAL);
    const cos = Math.cos(VIEW_ANGLE_FROM_VERTICAL);
    const tanV = Math.tan((CAMERA_FOV * Math.PI) / 360);
    // Where the near (bottom) and far (top) edges land, in half-heights from
    // the middle, after the shift (2 * offset half-heights upwards).
    const bottom = (SEA_RADIUS * cos) / (d - SEA_RADIUS * sin) / tanV;
    const top = (SEA_RADIUS * cos) / (d + SEA_RADIUS * sin) / tanV;

    expect(offset).toBeGreaterThan(0);
    expect(offset).toBeLessThan(0.15);
    expect(bottom - 2 * offset).toBeCloseTo(top + 2 * offset);
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
