import { createBoard } from "../features/board/board.ts";
import { createBoardState, type Board } from "./board.ts";
import { setNewElement } from "./tile.ts";

export interface World extends Board {
  year: number;
}

export function createDefaultWorld(): World {
  const tiles = createBoard().map((tile) => {
    // A river separates forests from settlements.
    const element =
      tile.q === 0
        ? "fresh_water_body"
        : tile.q < 0
          ? "forest"
          : "human_settlement";
    return setNewElement(tile, element);
  });

  return { ...createBoardState(tiles), year: 0 };
}
