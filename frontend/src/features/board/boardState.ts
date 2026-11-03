import {
  type Board,
  type ElementName,
  getTile,
  replaceTile,
  setNewElement,
} from "../../world/index.ts";

export interface BoardAction {
  type: "placeElement";
  tileId: string;
  element: ElementName;
}

/** Returns the same board when nothing changes, so React can skip re-rendering. */
export function boardReducer(board: Board, action: BoardAction): Board {
  const tile = getTile(board, action.tileId);

  // Re-placing the same element is a no-op, so the tile keeps its condition.
  if (tile === undefined || tile.element === action.element) {
    return board;
  }

  return replaceTile(board, setNewElement(tile, action.element));
}
