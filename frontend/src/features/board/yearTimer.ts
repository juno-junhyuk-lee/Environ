/**
 * The year timer's shape at a point in the year. Computed from the real time
 * since the year started, so it can never drift from the clock: if a frame or
 * a re-render comes late, the bar is simply drawn where it should be by now.
 */

/** Share of the year spent filling; the rest is the pop. */
const FILL_END = 0.86;
/** Where the pop is widest. */
const POP_PEAK = 0.92;
/** How much wider (and a touch taller) the bar gets at the pop's peak. */
const POP_WIDTH = 2;
const POP_HEIGHT = 1.04;

export interface YearTimerPose {
  /** How full, 0 to 1 (vertical scale of the fill). */
  fill: number;
  /** Scale of the whole bar, for the pop. */
  scaleX: number;
  scaleY: number;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Slow start, rushing at the end. */
function easeInCubic(x: number): number {
  return x ** 3;
}

function easeOutCubic(x: number): number {
  return 1 - (1 - x) ** 3;
}

/** Overshoots past 1 and settles back: the spring after the bulge. */
function easeOutBack(x: number): number {
  const c1 = 1.8;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
}

export function yearTimerPose(
  progress: number,
  reducedMotion = false,
): YearTimerPose {
  const t = clamp01(progress);
  if (reducedMotion) return { fill: t, scaleX: 1, scaleY: 1 };

  const fill = t >= FILL_END ? 1 : easeInCubic(t / FILL_END);

  // Bulge: out fast to the peak, then spring back to rest with an overshoot.
  let bulge = 0;
  if (t > FILL_END && t <= POP_PEAK) {
    bulge = easeOutCubic((t - FILL_END) / (POP_PEAK - FILL_END));
  } else if (t > POP_PEAK) {
    bulge = 1 - easeOutBack((t - POP_PEAK) / (1 - POP_PEAK));
  }

  return {
    fill,
    scaleX: 1 + (POP_WIDTH - 1) * bulge,
    scaleY: 1 + (POP_HEIGHT - 1) * bulge,
  };
}
