import {
  airQualityOf,
  type Board,
  type ElementName,
  ELEMENTS,
  getNeighbors,
} from "../../world/index.ts";

/** What a tile's condition means for its element, in plain words. */
export const MEASURE_NAMES: Readonly<Record<ElementName, string>> = {
  human_settlement: "Population",
  forest: "Forest health",
  fresh_water_body: "Water quality",
};

export type TileStatus = "Thriving" | "Healthy" | "Struggling" | "Critical";

export function statusFor(condition: number): TileStatus {
  if (condition >= 70) return "Thriving";
  if (condition >= 40) return "Healthy";
  if (condition >= 15) return "Struggling";
  return "Critical";
}

export interface TileInsight {
  element: ElementName;
  label: string;
  measure: string;
  status: TileStatus;
  condition: number;
  /**
   * Change in condition over the last yearly step, or null when there's
   * nothing to compare with (no year has passed, or the tile's element
   * changed since).
   */
  change: number | null;
  /** Local air quality, 0–100, from this tile and its neighbours. */
  airQuality: number;
}

/** Rounds to one decimal, as conditions are stored; avoids "-0". */
function round1(value: number): number {
  const rounded = Math.round(value * 10) / 10;
  return rounded === 0 ? 0 : rounded;
}

/**
 * Everything the inspector shows for one tile. `lastYear` is the board just
 * before the most recent yearly step (null if none has happened).
 */
export function tileInsight(
  board: Board,
  tileId: string,
  lastYear: Board | null,
): TileInsight | null {
  const tile = board.tiles.find((candidate) => candidate.id === tileId);
  if (tile === undefined) return null;

  const before = lastYear?.tiles.find((candidate) => candidate.id === tileId);
  const change =
    before?.element === tile.element
      ? round1(tile.conditionValue - before.conditionValue)
      : null;

  return {
    element: tile.element,
    label: ELEMENTS[tile.element].label,
    measure: MEASURE_NAMES[tile.element],
    status: statusFor(tile.conditionValue),
    condition: tile.conditionValue,
    change,
    airQuality: airQualityOf(tile, getNeighbors(board, tile)),
  };
}
