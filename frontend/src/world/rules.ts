import type { Tile } from "../features/board/board.ts";
import { getNeighbors, type Board } from "./board.ts";
import { FOREST, FRESH_WATER_BODY, HUMAN_SETTLEMENT } from "./elements.ts";
import { clampCondition, setNewElement } from "./tile.ts";

/** All provisional rates — tune freely without changing rule structure. */
export const SIMULATION_RATES = {
  healthyThreshold: 50,
  forest: {
    /** Forest condition increase per step. */
    regrowth: 3,
    /** Penalty per adjacent Human Settlement. */
    settlementPenalty: 8,
  },
  freshWater: {
    /** Gain per adjacent Forest. */
    forestBonus: 4,
    /** Loss per adjacent Human Settlement. */
    settlementPenalty: 6,
  },
  settlement: {
    /** Growth when both healthy Forest and healthy Water neighbours exist. */
    growth: 5,
    /** Decline otherwise. */
    decline: 4,
  },
} as const;

function countAdjacent(neighbors: Tile[], element: Tile["element"]): number {
  return neighbors.filter((neighbor) => neighbor.element === element).length;
}

function hasHealthyNeighbor(
  neighbors: Tile[],
  element: Tile["element"],
  threshold: number,
): boolean {
  return neighbors.some(
    (neighbor) =>
      neighbor.element === element && neighbor.conditionValue >= threshold,
  );
}

/** Next forest health from current tile + neighbours (does not mutate). */
export function evaluateForest(tile: Tile, neighbors: Tile[]): number {
  const settlementCount = countAdjacent(neighbors, HUMAN_SETTLEMENT.name);
  const next =
    tile.conditionValue +
    SIMULATION_RATES.forest.regrowth -
    settlementCount * SIMULATION_RATES.forest.settlementPenalty;
  return clampCondition(next);
}

/** Next water quality from current tile + neighbours (does not mutate). */
export function evaluateFreshWater(tile: Tile, neighbors: Tile[]): number {
  const forestCount = countAdjacent(neighbors, FOREST.name);
  const settlementCount = countAdjacent(neighbors, HUMAN_SETTLEMENT.name);
  const next =
    tile.conditionValue +
    forestCount * SIMULATION_RATES.freshWater.forestBonus -
    settlementCount * SIMULATION_RATES.freshWater.settlementPenalty;
  return clampCondition(next);
}

/**
 * Next settlement population from current tile + neighbours (does not mutate).
 * Grows only when both a healthy Forest and a healthy Water neighbour exist.
 */
export function evaluateSettlements(tile: Tile, neighbors: Tile[]): number {
  const threshold = SIMULATION_RATES.healthyThreshold;
  const hasForest = hasHealthyNeighbor(neighbors, FOREST.name, threshold);
  const hasWater = hasHealthyNeighbor(
    neighbors,
    FRESH_WATER_BODY.name,
    threshold,
  );
  const delta =
    hasForest && hasWater
      ? SIMULATION_RATES.settlement.growth
      : -SIMULATION_RATES.settlement.decline;
  return clampCondition(tile.conditionValue + delta);
}

/**
 * Applies conversion rules to a tile whose condition has already been updated.
 * Forest at 0 → Settlement; Settlement at 0 → Forest; Water never converts.
 * Converted tiles start at the new element's defaultCondition.
 */
export function convertTile(tile: Tile): Tile {
  if (tile.conditionValue !== 0) {
    return tile;
  }

  if (tile.element === FOREST.name) {
    return setNewElement(tile, HUMAN_SETTLEMENT.name);
  }

  if (tile.element === HUMAN_SETTLEMENT.name) {
    return setNewElement(tile, FOREST.name);
  }

  // Fresh water never converts.
  return tile;
}

function evaluateTile(tile: Tile, neighbors: Tile[]): number {
  switch (tile.element) {
    case "forest":
      return evaluateForest(tile, neighbors);
    case "fresh_water_body":
      return evaluateFreshWater(tile, neighbors);
    case "human_settlement":
      return evaluateSettlements(tile, neighbors);
  }
}

/**
 * Two-phase, pure step: read every next value from the start-of-step board,
 * then build a new board. Processing order does not affect the result.
 */
export function applyToBoard(board: Board): Board {
  const nextTiles = board.tiles.map((tile) => {
    const neighbors = getNeighbors(board, tile);
    const nextCondition = evaluateTile(tile, neighbors);
    const updated: Tile = { ...tile, conditionValue: nextCondition };
    return convertTile(updated);
  });

  return {
    ...board,
    tiles: nextTiles,
  };
}
