/**
 * Dev-only switches, read from the page URL. Production builds ignore them,
 * so a kiosk can never be left in a debug mode.
 */

const MAX_DEBUG_SPEED = 50;

/**
 * `?debugSpeed=N` multiplies every tile's yearly change by N, so declines and
 * conversions happen in a few years instead of decades. 5 converts the
 * default world's first tile around year 9; 10 converts tiles from year 1.
 * The formulas themselves are unchanged; see `applyToBoard`.
 */
export function readDebugSpeed(
  search: string,
  isDev: boolean = import.meta.env.DEV,
): number {
  if (!isDev) return 1;
  const raw = new URLSearchParams(search).get("debugSpeed");
  if (raw === null) return 1;
  const speed = Number(raw);
  if (!Number.isFinite(speed) || speed <= 0) return 1;
  return Math.min(speed, MAX_DEBUG_SPEED);
}

export const DEBUG_SPEED =
  typeof window === "undefined" ? 1 : readDebugSpeed(window.location.search);
