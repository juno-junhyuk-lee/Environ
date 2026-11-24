import { useEffect, useState } from "react";
import type { Tile } from "./board.ts";
import { HOP_DURATION } from "./hop.ts";

/** How long a converted tile stays highlighted: the length of its hop. */
export const CONVERSION_POP_MS = HOP_DURATION * 1000;

const NONE: ReadonlySet<string> = new Set();

/**
 * Tiles that changed element in the yearly step just taken (forest ↔
 * settlement), for as long as they should stay popped up. Placements don't
 * count (the year doesn't move), and neither do reset or load (the year
 * jumps rather than moving on by one).
 */
export function useConversions(
  tiles: readonly Tile[],
  year: number,
): ReadonlySet<string> {
  const [previous, setPrevious] = useState({ tiles, year });
  const [converting, setConverting] = useState(NONE);

  // Compare while rendering, so the pop starts in the same frame as the new
  // model (React's pattern for reacting to a new prop without an effect).
  if (previous.tiles !== tiles) {
    setPrevious({ tiles, year });
    if (year === previous.year + 1) {
      const before = new Map(previous.tiles.map((tile) => [tile.id, tile]));
      const converted = tiles
        .filter((tile) => {
          const old = before.get(tile.id);
          return old !== undefined && old.element !== tile.element;
        })
        .map((tile) => tile.id);
      if (converted.length > 0) setConverting(new Set(converted));
    }
  }

  useEffect(() => {
    if (converting.size === 0) return;
    const timer = window.setTimeout(() => {
      setConverting(NONE);
    }, CONVERSION_POP_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [converting]);

  return converting;
}
