import { describe, expect, it } from "vitest";
import { ELEMENTS, getDefaultCondition } from "./elements.ts";
import { createDefaultWorld } from "./world.ts";
import { worldReducer } from "../features/board/boardState.ts";

describe("default world", () => {
  it("fills 19 unique board positions at year zero with shared defaults", () => {
    const world = createDefaultWorld();
    expect(world.year).toBe(0);
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
    ).toHaveLength(7);
    expect(
      world.tiles.filter((tile) => tile.element === "fresh_water_body"),
    ).toHaveLength(5);
    expect(
      world.tiles.filter((tile) => tile.element === "human_settlement"),
    ).toHaveLength(7);
    for (const tile of world.tiles) {
      expect(tile.id).toBe(`${String(tile.q)},${String(tile.r)}`);
      expect(
        Math.max(Math.abs(tile.q), Math.abs(tile.r), Math.abs(tile.q + tile.r)),
      ).toBeLessThanOrEqual(2);
      expect(tile.element).toBe(
        tile.q === 0
          ? "fresh_water_body"
          : tile.q < 0
            ? "forest"
            : "human_settlement",
      );
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

  it("preserves the year when editing and skips unchanged edits", () => {
    const world = { ...createDefaultWorld(), year: 42 };
    const edited = worldReducer(world, {
      type: "placeElement",
      tileId: "0,0",
      element: "forest",
    });
    expect(edited.year).toBe(42);
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
