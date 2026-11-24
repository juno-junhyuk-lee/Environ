import { describe, expect, it } from "vitest";
import { readDebugSpeed } from "./debug.ts";

describe("readDebugSpeed", () => {
  it("reads ?debugSpeed in development", () => {
    expect(readDebugSpeed("?debugSpeed=5", true)).toBe(5);
    expect(readDebugSpeed("?foo=1&debugSpeed=2.5", true)).toBe(2.5);
  });

  it("is always 1 in production builds", () => {
    expect(readDebugSpeed("?debugSpeed=5", false)).toBe(1);
  });

  it("falls back to 1 when absent or invalid, and caps huge values", () => {
    expect(readDebugSpeed("", true)).toBe(1);
    for (const bad of ["abc", "0", "-3", "Infinity", ""]) {
      expect(readDebugSpeed(`?debugSpeed=${bad}`, true)).toBe(1);
    }
    expect(readDebugSpeed("?debugSpeed=1000", true)).toBe(50);
  });
});
