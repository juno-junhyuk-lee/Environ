import type { Tile } from "../features/board/board.ts";
import { MAX_TILES, type Board } from "./board.ts";
import { isElementName } from "./elements.ts";

export const WORLD_SAVE_FORMAT = "environ-world" as const;
export const WORLD_SAVE_VERSION = 1 as const;
export const LOCAL_STORAGE_KEY = "environ-world-autosave";

export interface WorldSave {
  format: typeof WORLD_SAVE_FORMAT;
  version: typeof WORLD_SAVE_VERSION;
  year: number;
  tiles: Tile[];
}

export type LoadWorldResult =
  { ok: true; save: WorldSave } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidTile(value: unknown): value is Tile {
  if (!isRecord(value)) {
    return false;
  }
  const { id, q, r, element, conditionValue } = value;
  return (
    typeof id === "string" &&
    typeof q === "number" &&
    Number.isFinite(q) &&
    typeof r === "number" &&
    Number.isFinite(r) &&
    typeof element === "string" &&
    isElementName(element) &&
    typeof conditionValue === "number" &&
    Number.isFinite(conditionValue) &&
    conditionValue >= 0 &&
    conditionValue <= 100
  );
}

export function validateWorldSave(data: unknown): LoadWorldResult {
  if (!isRecord(data)) {
    return { ok: false, error: "Save data must be an object." };
  }

  if (data.format !== WORLD_SAVE_FORMAT) {
    return { ok: false, error: "Unrecognized save format." };
  }

  if (data.version !== WORLD_SAVE_VERSION) {
    return { ok: false, error: "Unsupported save version." };
  }

  if (
    typeof data.year !== "number" ||
    !Number.isFinite(data.year) ||
    data.year < 0
  ) {
    return { ok: false, error: "Year must be a number >= 0." };
  }

  if (!Array.isArray(data.tiles)) {
    return { ok: false, error: "Tiles must be an array." };
  }

  if (data.tiles.length !== MAX_TILES) {
    return {
      ok: false,
      error: `Expected exactly ${String(MAX_TILES)} tiles.`,
    };
  }

  const ids = new Set<string>();
  const tiles: Tile[] = [];
  for (const candidate of data.tiles) {
    if (!isValidTile(candidate)) {
      return {
        ok: false,
        error:
          "Each tile must have valid id, q, r, element, and condition 0–100.",
      };
    }
    if (ids.has(candidate.id)) {
      return { ok: false, error: "Duplicate tile ids are not allowed." };
    }
    ids.add(candidate.id);
    tiles.push(candidate);
  }

  return {
    ok: true,
    save: {
      format: WORLD_SAVE_FORMAT,
      version: WORLD_SAVE_VERSION,
      year: data.year,
      tiles,
    },
  };
}

export function serializeWorld(year: number, board: Board): WorldSave {
  return {
    format: WORLD_SAVE_FORMAT,
    version: WORLD_SAVE_VERSION,
    year,
    tiles: board.tiles,
  };
}

export function worldSaveToJson(save: WorldSave): string {
  return `${JSON.stringify(save, null, 2)}\n`;
}

/**
 * Triggers a browser download of the world as a .json file.
 * No-op outside a browser document context.
 */
export function exportWorldToFile(
  year: number,
  board: Board,
  filename = "environ-world.json",
): void {
  const save = serializeWorld(year, board);
  const blob = new Blob([worldSaveToJson(save)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads and validates a save file. On failure, reports that the file could
 * not be loaded; caller must leave the current board unchanged.
 */
export async function importWorldFromFile(
  file: File,
): Promise<LoadWorldResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: "The file could not be loaded." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "The file could not be loaded." };
  }

  const result = validateWorldSave(parsed);
  if (!result.ok) {
    return { ok: false, error: "The file could not be loaded." };
  }
  return result;
}

export function saveWorldToLocalStorage(year: number, board: Board): void {
  const save = serializeWorld(year, board);
  localStorage.setItem(LOCAL_STORAGE_KEY, worldSaveToJson(save));
}

/**
 * Loads and validates the autosave. On failure, leaves the current board
 * alone (returns ok: false).
 */
export function loadWorldFromLocalStorage(): LoadWorldResult {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (raw === null) {
    return { ok: false, error: "The file could not be loaded." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: "The file could not be loaded." };
  }

  const result = validateWorldSave(parsed);
  if (!result.ok) {
    return { ok: false, error: "The file could not be loaded." };
  }
  return result;
}

/** Builds a Board from a validated save without touching the previous board. */
export function boardFromSave(save: WorldSave): Board {
  return {
    tiles: save.tiles.map((tile) => ({ ...tile })),
    maxTiles: MAX_TILES,
  };
}
