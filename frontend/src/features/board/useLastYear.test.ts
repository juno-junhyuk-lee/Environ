import { renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { createDefaultWorld, type World } from "../../world/index.ts";
import { worldReducer } from "./boardState.ts";
import { useLastYear } from "./useLastYear.ts";

function render(start: World) {
  return renderHook(({ world }: { world: World }) => useLastYear(world), {
    initialProps: { world: start },
  });
}

it("is null until a year passes, then holds the world before the step", () => {
  const start = createDefaultWorld();
  const { result, rerender } = render(start);
  expect(result.current).toBeNull();

  const next = worldReducer(start, { type: "advanceYear", roll: 0.5 });
  rerender({ world: next });
  expect(result.current).toBe(start);
});

it("keeps last year through placements, and clears on reset or load", () => {
  const start = createDefaultWorld();
  const { result, rerender } = render(start);
  const year1 = worldReducer(start, { type: "advanceYear", roll: 0.5 });
  rerender({ world: year1 });

  const placed = worldReducer(year1, {
    type: "placeElement",
    tileId: "0,0",
    element: "forest",
  });
  rerender({ world: placed });
  expect(result.current).toBe(start);

  rerender({ world: { ...createDefaultWorld(), year: 40 } });
  expect(result.current).toBeNull();
});
