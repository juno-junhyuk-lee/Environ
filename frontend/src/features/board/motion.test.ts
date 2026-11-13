import { describe, expect, it } from "vitest";
import { easeStep } from "./motion.ts";

describe("easeStep", () => {
  it("covers part of the distance each frame, more for longer frames", () => {
    const short = easeStep(1 / 120, 5, false);
    const long = easeStep(1 / 60, 5, false);

    expect(short).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(short);
    expect(long).toBeLessThan(0.2);
  });

  it("doesn't snap on the first frame after a pause", () => {
    // On-demand canvases report the whole idle time as the first delta.
    const afterPause = easeStep(8, 5, false);

    expect(afterPause).toBeLessThan(0.2);
    expect(afterPause).toBeCloseTo(easeStep(1, 5, false));
  });

  it("jumps straight there with reduced motion", () => {
    expect(easeStep(1 / 60, 5, true)).toBe(1);
  });
});
