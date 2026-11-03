import { describe, expect, it } from "vitest";
import { axialToWorld, hexOutline, TILE_WIDTH } from "./geometry.ts";

describe("hexOutline", () => {
  const outline = hexOutline(0.2);

  it("returns six corners plus the first one again to close the loop", () => {
    expect(outline).toHaveLength(7);
    expect(outline[6]?.[0]).toBeCloseTo(outline[0]?.[0] ?? NaN);
    expect(outline[6]?.[2]).toBeCloseTo(outline[0]?.[2] ?? NaN);
  });

  it("puts every corner on the tile's edge at the requested height", () => {
    for (const [x, y, z] of outline) {
      expect(y).toBe(0.2);
      expect(Math.hypot(x, z)).toBeCloseTo(TILE_WIDTH / Math.sqrt(3));
    }
  });

  it("matches the pointy-top tile: corners at the tips and the flat sides", () => {
    const xs = outline.map(([x]) => x);
    const zs = outline.map(([, , z]) => z);
    expect(Math.max(...xs)).toBeCloseTo(TILE_WIDTH / 2);
    expect(Math.max(...zs)).toBeCloseTo(TILE_WIDTH / Math.sqrt(3));
  });
});

describe("axialToWorld", () => {
  it("puts the centre tile at the origin", () => {
    expect(axialToWorld(0, 0)).toEqual([0, 0, 0]);
  });

  it("places all six neighbours exactly one tile width away", () => {
    const neighbours = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, -1],
      [-1, 1],
    ] as const;

    for (const [q, r] of neighbours) {
      const [x, y, z] = axialToWorld(q, r);
      expect(y).toBe(0);
      expect(Math.hypot(x, z)).toBeCloseTo(TILE_WIDTH);
    }
  });
});
