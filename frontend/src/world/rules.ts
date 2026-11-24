import type { Tile } from "../features/board/board.ts";
import { getNeighbors, type Board } from "./board.ts";
import { FOREST, FRESH_WATER_BODY, HUMAN_SETTLEMENT } from "./elements.ts";
import { clampCondition } from "./tile.ts";
import {
  airQualityFactor,
  airQualityOf,
  ruleModifiersFor,
  type WorldlyContext,
} from "./worldly.ts";

/** All tunable rates — adjust freely without changing formula structure. */
export const SIMULATION_RATES = {
  /** Condition after forest↔settlement conversion (design choice, not SSDS). */
  conversionRestartCondition: 30,
  forest: {
    growthRate: 0.1,
    carryingCapacity: 100,
    waterSupportBase: 0.8,
    waterSupportScale: 0.4,
    pressureRate: 0.15,
    deltaMin: -8,
    deltaMax: 6,
  },
  freshWater: {
    rechargeRate: 0.1,
    forestSupportBase: 0.6,
    forestSupportScale: 0.6,
    useRate: 0.12,
    deltaMin: -8,
    deltaMax: 6,
  },
  settlement: {
    growthRate: 0.08,
    carryingCapacityFloor: 10,
    carryingCapacitySpan: 90,
    alleeThreshold: 18,
    alleePenalty: 1.5,
    deltaMin: -5,
    deltaMax: 4,
  },
} as const;

function meanAdjacentCondition(
  neighbors: Tile[],
  element: Tile["element"],
): number {
  const matching = neighbors.filter((neighbor) => neighbor.element === element);
  if (matching.length === 0) {
    return 0;
  }
  const total = matching.reduce(
    (sum, neighbor) => sum + neighbor.conditionValue,
    0,
  );
  return total / matching.length;
}

/** S = sum of adjacent settlement conditions / 100. */
function settlementLoad(neighbors: Tile[]): number {
  return (
    neighbors
      .filter((neighbor) => neighbor.element === HUMAN_SETTLEMENT.name)
      .reduce((sum, neighbor) => sum + neighbor.conditionValue, 0) / 100
  );
}

function capDelta(delta: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, delta));
}

/**
 * Next forest health from current tile + neighbours (does not mutate).
 * Pass `ctx` to scale growth by climate and local air quality; omit it for
 * plain v2 logistic rules (existing two-argument callers stay unchanged).
 */
export function evaluateForest(
  tile: Tile,
  neighbors: Tile[],
  ctx?: WorldlyContext,
): number {
  const rates = SIMULATION_RATES.forest;
  const C = tile.conditionValue;
  const W = meanAdjacentCondition(neighbors, FRESH_WATER_BODY.name);
  const S = settlementLoad(neighbors);

  let growth =
    rates.growthRate *
    C *
    (1 - C / rates.carryingCapacity) *
    (rates.waterSupportBase + (rates.waterSupportScale * W) / 100);
  if (ctx !== undefined) {
    const aqi = airQualityOf(tile, neighbors);
    const mods = ruleModifiersFor(ctx.temperatureC, ctx.weather);
    growth *= mods.forest * airQualityFactor("forest", aqi);
  }
  const pressure = rates.pressureRate * C * S;
  const delta = capDelta(growth - pressure, rates.deltaMin, rates.deltaMax);
  return clampCondition(C + delta);
}

/**
 * Next water quality from current tile + neighbours (does not mutate).
 * Pass `ctx` to scale recharge by climate; omit it for plain v2 rules.
 */
export function evaluateFreshWater(
  tile: Tile,
  neighbors: Tile[],
  ctx?: WorldlyContext,
): number {
  const rates = SIMULATION_RATES.freshWater;
  const W_tile = tile.conditionValue;
  const F = meanAdjacentCondition(neighbors, FOREST.name);
  const S = settlementLoad(neighbors);

  let recharge =
    rates.rechargeRate *
    (100 - W_tile) *
    (rates.forestSupportBase + (rates.forestSupportScale * F) / 100);
  if (ctx !== undefined) {
    const mods = ruleModifiersFor(ctx.temperatureC, ctx.weather);
    recharge *= mods.water;
  }
  const use = rates.useRate * W_tile * S;
  const delta = capDelta(recharge - use, rates.deltaMin, rates.deltaMax);
  return clampCondition(W_tile + delta);
}

/**
 * Next settlement population from current tile + neighbours (does not mutate).
 * Carrying capacity K depends on the geometric mean of adjacent forest and
 * water quality; both are required.
 * Pass `ctx` to scale growth by climate and air quality; omit it for plain v2.
 */
export function evaluateSettlements(
  tile: Tile,
  neighbors: Tile[],
  ctx?: WorldlyContext,
): number {
  const rates = SIMULATION_RATES.settlement;
  const C = tile.conditionValue;
  const F = meanAdjacentCondition(neighbors, FOREST.name);
  const W = meanAdjacentCondition(neighbors, FRESH_WATER_BODY.name);

  const R = Math.sqrt((F / 100) * (W / 100));
  const K = rates.carryingCapacityFloor + rates.carryingCapacitySpan * R;
  let delta = rates.growthRate * C * (1 - C / K);
  if (ctx !== undefined) {
    const aqi = airQualityOf(tile, neighbors);
    const mods = ruleModifiersFor(ctx.temperatureC, ctx.weather);
    delta *= mods.settlement * airQualityFactor("settlement", aqi);
  }
  if (C < rates.alleeThreshold) {
    delta -= rates.alleePenalty;
  }
  delta = capDelta(delta, rates.deltaMin, rates.deltaMax);
  return clampCondition(C + delta);
}

/**
 * Applies conversion rules to a tile whose condition has already been updated.
 * Forest at 0 → Settlement at 30; Settlement at 0 → Forest at 30;
 * Water never converts. Restart 30 is set here (not via element defaultCondition).
 */
export function convertTile(tile: Tile): Tile {
  if (tile.conditionValue !== 0) {
    return tile;
  }

  const restart = SIMULATION_RATES.conversionRestartCondition;

  if (tile.element === FOREST.name) {
    return {
      ...tile,
      element: HUMAN_SETTLEMENT.name,
      conditionValue: restart,
    };
  }

  if (tile.element === HUMAN_SETTLEMENT.name) {
    return {
      ...tile,
      element: FOREST.name,
      conditionValue: restart,
    };
  }

  // Fresh water never converts.
  return tile;
}

function evaluateTile(
  tile: Tile,
  neighbors: Tile[],
  ctx?: WorldlyContext,
): number {
  switch (tile.element) {
    case "forest":
      return evaluateForest(tile, neighbors, ctx);
    case "fresh_water_body":
      return evaluateFreshWater(tile, neighbors, ctx);
    case "human_settlement":
      return evaluateSettlements(tile, neighbors, ctx);
  }
}

/**
 * Two-phase, pure step: read every next value from the start-of-step board,
 * then build a new board. Processing order does not affect the result.
 * Pass `ctx` to apply worldly climate/air modifiers; omit it for plain v2.
 *
 * `deltaScale` is a debugging aid: it multiplies each tile's yearly change
 * after the rules (caps included) have run, so trends play out faster without
 * touching the formulas. Leave it at 1 for the real simulation.
 */
export function applyToBoard(
  board: Board,
  ctx?: WorldlyContext,
  deltaScale = 1,
): Board {
  const nextTiles = board.tiles.map((tile) => {
    const neighbors = getNeighbors(board, tile);
    const evaluated = evaluateTile(tile, neighbors, ctx);
    const nextCondition =
      deltaScale === 1
        ? evaluated
        : clampCondition(
            tile.conditionValue +
              deltaScale * (evaluated - tile.conditionValue),
          );
    const updated: Tile = { ...tile, conditionValue: nextCondition };
    return convertTile(updated);
  });

  return {
    ...board,
    tiles: nextTiles,
  };
}
