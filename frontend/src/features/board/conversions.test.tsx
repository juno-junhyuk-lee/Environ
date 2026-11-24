import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createDefaultWorld, setNewElement } from "../../world/index.ts";
import type { Tile } from "./board.ts";
import { CONVERSION_POP_MS, useConversions } from "./conversions.ts";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const start = createDefaultWorld().tiles;

/** `0,0` starts as a settlement in the default world. */
function withCenter(tiles: Tile[], element: Tile["element"]): Tile[] {
  return tiles.map((tile) =>
    tile.id === "0,0" ? setNewElement(tile, element) : tile,
  );
}

function renderConversions() {
  return renderHook(
    ({ tiles, year }: { tiles: Tile[]; year: number }) =>
      useConversions(tiles, year),
    { initialProps: { tiles: start, year: 0 } },
  );
}

it("pops tiles that changed element in a yearly step, then settles them", () => {
  const { result, rerender } = renderConversions();
  expect(result.current.size).toBe(0);

  rerender({ tiles: withCenter(start, "forest"), year: 1 });
  expect([...result.current]).toEqual(["0,0"]);

  act(() => {
    vi.advanceTimersByTime(CONVERSION_POP_MS);
  });
  expect(result.current.size).toBe(0);
});

it("ignores placements, which change tiles without passing a year", () => {
  const { result, rerender } = renderConversions();

  rerender({ tiles: withCenter(start, "forest"), year: 0 });
  expect(result.current.size).toBe(0);

  // The next year's step doesn't count the earlier placement either.
  const placed = withCenter(start, "forest");
  rerender({ tiles: placed.map((tile) => ({ ...tile })), year: 1 });
  expect(result.current.size).toBe(0);
});

it("ignores reset and load, where the year jumps", () => {
  const { result, rerender } = renderConversions();

  rerender({ tiles: withCenter(start, "forest"), year: 37 });
  expect(result.current.size).toBe(0);

  rerender({ tiles: start, year: 0 });
  expect(result.current.size).toBe(0);
});
