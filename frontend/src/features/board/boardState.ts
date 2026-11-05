import {
  type Board,
  type ElementName,
  type World,
  type WorldSave,
  boardFromSave,
  createDefaultWorld,
  getTile,
  replaceTile,
  setNewElement,
} from "../../world/index.ts";

export interface BoardAction {
  type: "placeElement";
  tileId: string;
  element: ElementName;
}

export type WorldAction =
  BoardAction | { type: "resetWorld" } | { type: "loadWorld"; save: WorldSave };

export function worldReducer(world: World, action: WorldAction): World {
  if (action.type === "resetWorld") {
    return createDefaultWorld();
  }
  if (action.type === "loadWorld") {
    return { ...boardFromSave(action.save), year: action.save.year };
  }

  const board = boardReducer(world, action);
  return board === world ? world : { ...board, year: world.year };
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
