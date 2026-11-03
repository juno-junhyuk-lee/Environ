import { describe, expect, it } from "vitest";
import {
  createBoardState,
  ELEMENTS,
  getDefaultCondition,
  getTile,
  replaceTile,
  setConditionValue,
} from "../../world/index.ts";
import { boardReducer } from "./boardState.ts";

const board = createBoardState();

describe("boardReducer", () => {
  it("places an element on a tile", () => {
    const next = boardReducer(board, {
      type: "placeElement",
      tileId: "0,0",
      element: "human_settlement",
    });

    expect(getTile(next, "0,0")?.element).toBe("human_settlement");
    expect(getTile(next, "1,0")).toBe(getTile(board, "1,0"));
    expect(getTile(board, "0,0")?.element).toBe("forest");
  });

  it("replaces the element and resets the condition to its default", () => {
    const settled = boardReducer(board, {
      type: "placeElement",
      tileId: "0,0",
      element: "human_settlement",
    });
    const next = boardReducer(settled, {
      type: "placeElement",
      tileId: "0,0",
      element: "fresh_water_body",
    });

    expect(getTile(next, "0,0")).toMatchObject({
      element: "fresh_water_body",
      conditionValue: getDefaultCondition(ELEMENTS.fresh_water_body),
    });
  });

  it("keeps the tile's condition when placing the element it already has", () => {
    const tile = getTile(board, "0,0");
    if (tile === undefined) throw new Error("centre tile missing");
    const grown = replaceTile(board, setConditionValue(tile, 90));

    const next = boardReducer(grown, {
      type: "placeElement",
      tileId: "0,0",
      element: tile.element,
    });

    expect(next).toBe(grown);
    expect(getTile(next, "0,0")?.conditionValue).toBe(90);
  });

  it("ignores unknown tile ids", () => {
    const next = boardReducer(board, {
      type: "placeElement",
      tileId: "9,9",
      element: "forest",
    });

    expect(next).toBe(board);
  });
});
