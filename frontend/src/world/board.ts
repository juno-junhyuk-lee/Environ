import { createBoard, type Tile } from "../features/board/board.ts";
import { setNewElement } from "./tile.ts";

/** Fixed size of the 3-4-5-4-3 hexagonal board. */
export const MAX_TILES = 19;

/** Axial neighbor offsets for a pointy-top hex grid. */
export const HEX_DIRECTIONS: readonly { dq: number; dr: number }[] = [
  { dq: 1, dr: 0 },
  { dq: 1, dr: -1 },
  { dq: 0, dr: -1 },
  { dq: -1, dr: 0 },
  { dq: -1, dr: 1 },
  { dq: 0, dr: 1 },
];

export interface Board {
  tiles: Tile[];
  maxTiles: typeof MAX_TILES;
}

export function createBoardState(tiles: Tile[] = createBoard()): Board {
  return { tiles, maxTiles: MAX_TILES };
}

/**
 * Minimal board fixture for simulation tests — not the default world layout
 * (Ticket 3). Center forest, one adjacent settlement, one adjacent water body.
 */
export function createMinimalBoardFixture(): Board {
  const tiles = createBoard().map((tile) => {
    if (tile.q === 1 && tile.r === 0) {
      return setNewElement(tile, "human_settlement");
    }
    if (tile.q === -1 && tile.r === 0) {
      return setNewElement(tile, "fresh_water_body");
    }
    return tile;
  });

  return createBoardState(tiles);
}

export function getTile(board: Board, id: string): Tile | undefined {
  return board.tiles.find((tile) => tile.id === id);
}

export function getNeighbors(board: Board, tile: Tile): Tile[] {
  const byCoord = new Map(
    board.tiles.map((candidate) => [
      `${String(candidate.q)},${String(candidate.r)}`,
      candidate,
    ]),
  );

  const neighbors: Tile[] = [];
  for (const { dq, dr } of HEX_DIRECTIONS) {
    const neighbor = byCoord.get(
      `${String(tile.q + dq)},${String(tile.r + dr)}`,
    );
    if (neighbor) {
      neighbors.push(neighbor);
    }
  }
  return neighbors;
}

/** Returns a new board with the given tile replaced by id. */
export function replaceTile(board: Board, nextTile: Tile): Board {
  return {
    ...board,
    tiles: board.tiles.map((tile) =>
      tile.id === nextTile.id ? nextTile : tile,
    ),
  };
}
