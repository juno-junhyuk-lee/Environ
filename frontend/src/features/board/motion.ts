export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Longest frame the easing will step over, in seconds. Canvases that only
 * draw on demand (the pane's tile icons) report the whole idle time as the
 * first frame's delta; without a cap, an animation starting after a pause
 * would cover the full distance in that one frame and snap.
 */
const MAX_FRAME_DELTA = 1 / 30;

/**
 * Share of the remaining distance to cover this frame. Exponential easing: no
 * overshoot, no bounce, and the same feel at any frame rate. Higher
 * `response` settles faster (about 3 / response seconds).
 */
export function easeStep(
  delta: number,
  response: number,
  instant: boolean,
): number {
  if (instant) return 1;
  return 1 - Math.exp(-response * Math.min(delta, MAX_FRAME_DELTA));
}
