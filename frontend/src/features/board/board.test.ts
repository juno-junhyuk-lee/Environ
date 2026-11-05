import { describe, expect, it } from "vitest";
import { createBoard } from "./board.ts";

describe("createBoard", () => {
  const tiles = createBoard();

  it("creates 19 tiles", () => {
    expect(tiles).toHaveLength(19);
  });

  it("arranges rows of 3, 4, 5, 4 and 3 tiles", () => {
    const rowSizes = [-2, -1, 0, 1, 2].map(
      (r) => tiles.filter((tile) => tile.r === r).length,
    );
    expect(rowSizes).toEqual([3, 4, 5, 4, 3]);
  });

  it("gives every tile a unique id", () => {
    const ids = new Set(tiles.map((tile) => tile.id));
    expect(ids.size).toBe(tiles.length);
  });
});
