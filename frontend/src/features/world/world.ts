import { createBoard } from "../board/board.ts";
import type { Tile } from "../board/board.ts";

export type Element = "settlement" | "forest" | "water";

export interface WorldTile extends Tile {
  element: Element;
  condition: number;
}

export interface World {
  year: number;
  tiles: WorldTile[];
}

export const ELEMENT_LABELS: Record<Element, string> = {
  settlement: "Human settlement",
  forest: "Forest",
  water: "Fresh water body",
};

export const DEFAULT_CONDITIONS: Record<Element, number> = {
  settlement: 50,
  forest: 100,
  water: 100,
};

export function createDefaultWorld(): World {
  return {
    year: 0,
    tiles: createBoard().map((tile) => {
      // A river through the center separates settlements and forests.
      const element: Element =
        tile.q === 0 ? "water" : tile.q < 0 ? "forest" : "settlement";

      return { ...tile, element, condition: DEFAULT_CONDITIONS[element] };
    }),
  };
}
