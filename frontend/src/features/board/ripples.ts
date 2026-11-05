export const RIPPLE_PERIOD_SECONDS = 3.2;

export const RIPPLE_MAX_RADIUS = 0.2;

export const RIPPLE_MAX_OPACITY = 0.7;

// three.js can't invert a zero scale.
const MIN_RING_RADIUS = 0.001;

/** Where on the tile each ring starts, and its offset in the cycle (0-1). */
export const RIPPLE_SPOTS = [
  { x: -0.14, z: 0.08, delay: 0 },
  { x: 0.15, z: -0.06, delay: 0.38 },
  { x: 0.02, z: 0.2, delay: 0.7 },
] as const;

function fractionalPart(value: number): number {
  return value - Math.floor(value);
}

/** A per-tile offset in [0, 1), so neighbouring lakes don't ripple in sync. */
export function rippleSeed(q: number, r: number): number {
  return fractionalPart(q * 0.37 + r * 0.61);
}

export function ripplePhase(
  cycle: number,
  delay: number,
  seed: number,
): number {
  return fractionalPart(cycle + delay + seed);
}

/** Ring size and opacity at `phase` (0-1) of its cycle. */
export function rippleAt(phase: number): { radius: number; opacity: number } {
  const easedOut = 1 - (1 - phase) ** 2;
  return {
    radius: Math.max(easedOut * RIPPLE_MAX_RADIUS, MIN_RING_RADIUS),
    opacity: RIPPLE_MAX_OPACITY * (1 - phase),
  };
}
