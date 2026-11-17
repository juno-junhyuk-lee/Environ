import { createBoard } from "../features/board/board.ts";
import { createBoardState, type Board } from "./board.ts";
import type { ElementName } from "./elements.ts";
import { setNewElement } from "./tile.ts";

export interface World extends Board {
  year: number;
}

/**
 * Mixed starter layout: every settlement touches forest and water so towns
 * can grow under v2 rules. Counts: 5 settlements, 6 forests, 8 water.
 */
const DEFAULT_LAYOUT: ReadonlyMap<string, ElementName> = new Map([
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

export function createDefaultWorld(): World {
  const tiles = createBoard().map((tile) => {
    const element = DEFAULT_LAYOUT.get(tile.id);
    if (element === undefined) {
      throw new Error(`Missing default layout for tile ${tile.id}`);
    }
    return setNewElement(tile, element);
  });

  return { ...createBoardState(tiles), year: 0 };
}
