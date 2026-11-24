import { describe, expect, it } from "vitest";
import { createDefaultWorld, setNewElement } from "../../world/index.ts";
import { worldReducer } from "../board/boardState.ts";
import { statusFor, tileInsight } from "./tileInsight.ts";

describe("tileInsight", () => {
  it("describes a tile in plain words", () => {
    // 0,0 is a settlement in the default world.
    const insight = tileInsight(createDefaultWorld(), "0,0", null);

    expect(insight).toMatchObject({
      element: "human_settlement",
      label: "Human Settlement",
      measure: "Population",
      status: "Healthy",
      condition: 50,
      change: null,
    });
    expect(insight?.airQuality).toBeGreaterThanOrEqual(0);
    expect(insight?.airQuality).toBeLessThanOrEqual(100);
  });

  it("names what each element's condition measures", () => {
    const world = createDefaultWorld();
    expect(tileInsight(world, "1,0", null)?.measure).toBe("Forest health");
    expect(tileInsight(world, "-1,0", null)?.measure).toBe("Water quality");
  });

  it("shows the change over the last yearly step", () => {
    const before = createDefaultWorld();
    const after = worldReducer(before, { type: "advanceYear", roll: 0 });
    const insight = tileInsight(after, "1,-1", before);
    const was = before.tiles.find((t) => t.id === "1,-1")?.conditionValue ?? 0;
    const now = after.tiles.find((t) => t.id === "1,-1")?.conditionValue ?? 0;

    expect(insight?.change).toBeCloseTo(now - was, 5);
    expect(insight?.change).not.toBe(0);
  });

  it("shows no change once the tile has become another element", () => {
    const before = createDefaultWorld();
    const after = {
      ...before,
      tiles: before.tiles.map((t) =>
        t.id === "0,0" ? setNewElement(t, "forest") : t,
      ),
    };
    expect(tileInsight(after, "0,0", before)?.change).toBeNull();
  });

  it("returns null for a tile that isn't on the board", () => {
    expect(tileInsight(createDefaultWorld(), "9,9", null)).toBeNull();
  });
});

describe("statusFor", () => {
  it.each([
    [100, "Thriving"],
    [70, "Thriving"],
    [69.9, "Healthy"],
    [40, "Healthy"],
    [39.9, "Struggling"],
    [15, "Struggling"],
    [14.9, "Critical"],
    [0, "Critical"],
  ])("calls condition %d %s", (condition, status) => {
    expect(statusFor(condition)).toBe(status);
  });
});
