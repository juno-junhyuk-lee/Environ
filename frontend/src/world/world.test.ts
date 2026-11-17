import { describe, expect, it } from "vitest";
import { ELEMENTS, getDefaultCondition, type ElementName } from "./elements.ts";
import { createDefaultWorld } from "./world.ts";
import { worldReducer } from "../features/board/boardState.ts";
import { DEFAULT_WORLDLY_STATE } from "./worldly.ts";

/** Mixed default layout keyed by tile id (`q,r`). */
const EXPECTED_LAYOUT: ReadonlyMap<string, ElementName> = new Map([
  ["0,-2", "forest"],
  ["1,-2", "fresh_water_body"],
  ["2,-2", "human_settlement"],
  ["-1,-1", "fresh_water_body"],
  ["0,-1", "human_settlement"],
  ["1,-1", "forest"],
  ["2,-1", "fresh_water_body"],
  ["-2,0", "forest"],
  ["-1,0", "fresh_water_body"],
  ["0,0", "human_settlement"],
  ["1,0", "forest"],
  ["2,0", "fresh_water_body"],
  ["-2,1", "fresh_water_body"],
  ["-1,1", "human_settlement"],
  ["0,1", "forest"],
  ["1,1", "fresh_water_body"],
  ["-2,2", "human_settlement"],
  ["-1,2", "forest"],
  ["0,2", "fresh_water_body"],
]);

describe("default world", () => {
  it("fills 19 unique board positions at year zero with the mixed layout", () => {
    const world = createDefaultWorld();
    expect(world.year).toBe(0);
    expect(world.worldly).toEqual(DEFAULT_WORLDLY_STATE);
    expect(world.maxTiles).toBe(19);
    expect(world.tiles).toHaveLength(19);
    expect(new Set(world.tiles.map((tile) => tile.id)).size).toBe(19);
    expect(
      [-2, -1, 0, 1, 2].map(
        (r) => world.tiles.filter((tile) => tile.r === r).length,
      ),
    ).toEqual([3, 4, 5, 4, 3]);
    expect(
      world.tiles.filter((tile) => tile.element === "forest"),
    ).toHaveLength(6);
    expect(
      world.tiles.filter((tile) => tile.element === "fresh_water_body"),
    ).toHaveLength(8);
    expect(
      world.tiles.filter((tile) => tile.element === "human_settlement"),
    ).toHaveLength(5);
    for (const tile of world.tiles) {
      expect(tile.id).toBe(`${String(tile.q)},${String(tile.r)}`);
      expect(
        Math.max(Math.abs(tile.q), Math.abs(tile.r), Math.abs(tile.q + tile.r)),
      ).toBeLessThanOrEqual(2);
      expect(tile.element).toBe(EXPECTED_LAYOUT.get(tile.id));
      expect(tile.conditionValue).toBe(
        getDefaultCondition(ELEMENTS[tile.element]),
      );
    }
  });

  it("resets changed tiles and year without sharing mutable tiles", () => {
    const original = createDefaultWorld();
    const changed = createDefaultWorld();
    changed.year = 42;
    const tile = changed.tiles[0];
    if (tile === undefined) throw new Error("missing tile");
    tile.element = "human_settlement";
    tile.conditionValue = 3;
    changed.tiles.pop();
    const reset = worldReducer(changed, { type: "resetWorld" });
    expect(reset).toEqual(original);
    expect(reset.tiles).not.toBe(original.tiles);
    reset.tiles.forEach((tile, index) => {
      expect(tile).not.toBe(original.tiles[index]);
    });
    expect(worldReducer(reset, { type: "resetWorld" })).toEqual(original);
    expect(changed.year).toBe(42);
    expect(changed.tiles).toHaveLength(18);
  });

  it("preserves the year and climate when editing and skips unchanged edits", () => {
    const climate = {
      temperatureC: 18,
      carbon: 62,
      weather: "storm" as const,
    };
    const world = { ...createDefaultWorld(), year: 42, worldly: climate };
    const edited = worldReducer(world, {
      type: "placeElement",
      tileId: "0,0",
      element: "forest",
    });
    expect(edited.year).toBe(42);
    expect(edited.worldly).toEqual(climate);
    expect(edited.tiles.find((tile) => tile.id === "0,0")?.element).toBe(
      "forest",
    );
    expect(
      worldReducer(edited, {
        type: "placeElement",
        tileId: "0,0",
        element: "forest",
      }),
    ).toBe(edited);
  });
});
