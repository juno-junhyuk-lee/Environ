import type { Tile } from "../features/board/board.ts";
import {
  getDefaultCondition,
  getElementDefinition,
  type ElementName,
} from "./elements.ts";

export function getElement(tile: Tile): ElementName {
  return tile.element;
}

export function getConditionValue(tile: Tile): number {
  return tile.conditionValue;
}

/** Returns a new tile with conditionValue clamped to 0–100. */
export function setConditionValue(tile: Tile, value: number): Tile {
  return {
    ...tile,
    conditionValue: clampCondition(value),
  };
}

/**
 * Changes the element and resets conditionValue to the new element's
 * defaultCondition.
 */
export function setNewElement(tile: Tile, element: ElementName): Tile {
  const definition = getElementDefinition(element);
  return {
    ...tile,
    element,
    conditionValue: getDefaultCondition(definition),
  };
}

export function clampCondition(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}
