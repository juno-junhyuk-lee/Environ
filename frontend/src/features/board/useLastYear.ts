import { useState } from "react";
import type { World } from "../../world/index.ts";

/**
 * The world just before its latest yearly step, for "change since last
 * year". Placements (same year) don't move it; reset and load (the year
 * jumps rather than moving on by one) clear it. Null until a year passes.
 */
export function useLastYear(world: World): World | null {
  const [seen, setSeen] = useState(world);
  const [lastYear, setLastYear] = useState<World | null>(null);

  // React's pattern for reacting to a new prop without an effect.
  if (seen !== world) {
    setSeen(world);
    if (world.year === seen.year + 1) setLastYear(seen);
    else if (world.year !== seen.year) setLastYear(null);
  }

  return lastYear;
}
