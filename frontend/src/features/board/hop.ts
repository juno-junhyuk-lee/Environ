/**
 * The hop a tile does when it converts (forest ↔ settlement): it jumps well
 * clear of its neighbours, spins a full turn while up, then drops back and
 * bounces as it lands.
 */

/** Seconds from take-off to the last bounce settling. */
export const HOP_DURATION = 1;

/** How high the tile jumps (world units; a tile is about 0.2 tall). */
export const HOP_HEIGHT = 0.45;

/** Share of the hop spent rising; the rest is the fall and bounces. */
const RISE = 0.35;

function easeOutCubic(x: number): number {
  return 1 - (1 - x) ** 3;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
}

/** Robert Penner's bounce-out: lands, then two shrinking bounces. */
function easeOutBounce(x: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x - 1.5 / d) ** 2 + 0.75;
  if (x < 2.5 / d) return n * (x - 2.25 / d) ** 2 + 0.9375;
  return n * (x - 2.625 / d) ** 2 + 0.984375;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * Height and spin (radians about the vertical axis) at `progress` through the
 * hop, 0 to 1. Both start and end at 0; a full turn leaves the hexagon
 * exactly as it was.
 */
export function hopPose(progress: number): { y: number; spin: number } {
  const t = clamp01(progress);
  const y =
    t < RISE
      ? HOP_HEIGHT * easeOutCubic(t / RISE)
      : HOP_HEIGHT * (1 - easeOutBounce((t - RISE) / (1 - RISE)));
  // Spins while airborne, finishing just as it first touches down.
  const spin = 2 * Math.PI * easeInOutCubic(clamp01((t - 0.05) / 0.6));
  return { y, spin: t >= 1 ? 0 : spin };
}
