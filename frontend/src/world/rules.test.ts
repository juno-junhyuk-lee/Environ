import { describe, expect, it } from "vitest";
import type { Tile } from "../features/board/board.ts";
import { createBoardState, getNeighbors, type Board } from "./board.ts";
import {
  applyToBoard,
  convertTile,
  evaluateForest,
  evaluateFreshWater,
  evaluateSettlements,
} from "./rules.ts";
import { createTimeSimulation, DEFAULT_TIME_STEP_INTERVAL_MS } from "./time.ts";
import { createDefaultWorld } from "./world.ts";

function tile(
  q: number,
  r: number,
  element: Tile["element"],
  conditionValue: number,
): Tile {
  return {
    id: `${String(q)},${String(r)}`,
    q,
    r,
    element,
    conditionValue,
  };
}

function boardOf(...tiles: Tile[]): Board {
  return createBoardState(tiles);
}

function centreNext(
  evaluate: (tile: Tile, neighbors: Tile[]) => number,
  centre: Tile,
  ...neighbors: Tile[]
): number {
  const board = boardOf(centre, ...neighbors);
  return evaluate(centre, getNeighbors(board, centre));
}

describe("forest rules", () => {
  it("grows +2.0 when isolated at 50", () => {
    expect(centreNext(evaluateForest, tile(0, 0, "forest", 50))).toBe(52);
  });

  it("declines -1.25 with water 50 and one settlement at 50", () => {
    expect(
      centreNext(
        evaluateForest,
        tile(0, 0, "forest", 50),
        tile(1, 0, "fresh_water_body", 50),
        tile(-1, 0, "human_settlement", 50),
      ),
    ).toBe(48.8);
  });

  it("slows near capacity: isolated forest at 90 only gains +0.7", () => {
    expect(centreNext(evaluateForest, tile(0, 0, "forest", 90))).toBe(90.7);
  });

  it("caps decline at -8 with two settlements at 70", () => {
    expect(
      centreNext(
        evaluateForest,
        tile(0, 0, "forest", 50),
        tile(1, 0, "human_settlement", 70),
        tile(0, 1, "human_settlement", 70),
      ),
    ).toBe(42);
  });
});

describe("fresh water rules", () => {
  it("improves +1.5 with forest 50 and one settlement at 50", () => {
    expect(
      centreNext(
        evaluateFreshWater,
        tile(0, 0, "fresh_water_body", 50),
        tile(-1, 0, "forest", 50),
        tile(1, 0, "human_settlement", 50),
      ),
    ).toBe(51.5);
  });

  it("caps recharge at +6 for dirty water with a strong forest", () => {
    // Raw recharge = 8.64 before the +6 cap.
    expect(
      centreNext(
        evaluateFreshWater,
        tile(0, 0, "fresh_water_body", 20),
        tile(-1, 0, "forest", 80),
      ),
    ).toBe(26);
  });

  it("caps decline at -8 with no forest and two settlements at 70", () => {
    expect(
      centreNext(
        evaluateFreshWater,
        tile(0, 0, "fresh_water_body", 90),
        tile(1, 0, "human_settlement", 70),
        tile(0, 1, "human_settlement", 70),
      ),
    ).toBe(82);
  });
});

describe("settlement rules", () => {
  it("grows about +1.26 at 50 with forest 70 and water 70", () => {
    expect(
      centreNext(
        evaluateSettlements,
        tile(0, 0, "human_settlement", 50),
        tile(-1, 0, "forest", 70),
        tile(1, 0, "fresh_water_body", 70),
      ),
    ).toBe(51.3);
  });

  it("caps decline at -5 when there is no forest", () => {
    expect(
      centreNext(
        evaluateSettlements,
        tile(0, 0, "human_settlement", 50),
        tile(1, 0, "fresh_water_body", 70),
      ),
    ).toBe(45);
  });

  it("applies the Allee penalty below 18 and flips small growth negative", () => {
    expect(
      centreNext(
        evaluateSettlements,
        tile(0, 0, "human_settlement", 15),
        tile(-1, 0, "forest", 70),
        tile(1, 0, "fresh_water_body", 70),
      ),
    ).toBe(14.5);
  });

  it("still declines at condition 5 even with good neighbours", () => {
    expect(
      centreNext(
        evaluateSettlements,
        tile(0, 0, "human_settlement", 5),
        tile(-1, 0, "forest", 70),
        tile(1, 0, "fresh_water_body", 70),
      ),
    ).toBe(3.9);
  });
});

describe("conversions", () => {
  it("converts forest and settlement at 0 to the other at 30, and never converts water", () => {
    expect(convertTile(tile(0, 0, "forest", 0))).toEqual(
      tile(0, 0, "human_settlement", 30),
    );
    expect(convertTile(tile(0, 0, "human_settlement", 0))).toEqual(
      tile(0, 0, "forest", 30),
    );
    expect(convertTile(tile(0, 0, "fresh_water_body", 0))).toEqual(
      tile(0, 0, "fresh_water_body", 0),
    );
  });

  it("does not flip a newly converted settlement at 30 in the next year", () => {
    const afterConversion = boardOf(tile(0, 0, "human_settlement", 30));
    const next = applyToBoard(afterConversion);
    const centre = next.tiles[0];
    if (!centre) throw new Error("missing tile");
    expect(centre.element).toBe("human_settlement");
    expect(centre.conditionValue).toBe(25.2);
  });

  it("does not flip a newly converted forest at 30 with one settlement neighbour", () => {
    const afterConversion = boardOf(
      tile(0, 0, "forest", 30),
      tile(1, 0, "human_settlement", 50),
    );
    const next = applyToBoard(afterConversion);
    const centre = next.tiles.find((candidate) => candidate.id === "0,0");
    if (!centre) throw new Error("missing tile");
    expect(centre.element).toBe("forest");
    expect(centre.conditionValue).toBe(29.4);
  });
});

describe("applyToBoard and time", () => {
  it("does not mutate the input board and is order-independent", () => {
    const board = boardOf(
      tile(0, 0, "forest", 50),
      tile(1, 0, "human_settlement", 50),
      tile(-1, 0, "fresh_water_body", 50),
    );
    const snapshot = structuredClone(board);
    const forward = applyToBoard(board);
    expect(board).toEqual(snapshot);

    const reversed = createBoardState([...board.tiles].reverse());
    const reverseResult = applyToBoard(reversed);
    const byId = (state: Board) =>
      Object.fromEntries(
        state.tiles.map((entry) => [
          entry.id,
          { element: entry.element, conditionValue: entry.conditionValue },
        ]),
      );
    expect(byId(forward)).toEqual(byId(reverseResult));
  });

  it("runs 20 years on the default world without leaving 0–100, with eastern settlements declining", () => {
    const start = createDefaultWorld();
    const easternStart = start.tiles
      .filter((entry) => entry.q > 0)
      .map((entry) => entry.conditionValue);
    expect(easternStart.every((value) => value === 50)).toBe(true);

    let board: Board = start;
    for (let year = 0; year < 20; year += 1) {
      board = applyToBoard(board);
      expect(board.tiles).toHaveLength(19);
      for (const entry of board.tiles) {
        expect(entry.conditionValue).toBeGreaterThanOrEqual(0);
        expect(entry.conditionValue).toBeLessThanOrEqual(100);
      }
    }

    const easternEnd = board.tiles.filter((entry) => entry.q > 0);
    expect(
      easternEnd.every(
        (entry) => entry.conditionValue < 50 || entry.element === "forest",
      ),
    ).toBe(true);
  });

  it("uses a 10000 ms step and advances exactly one year per advanceStep", () => {
    expect(DEFAULT_TIME_STEP_INTERVAL_MS).toBe(10000);

    const simulation = createTimeSimulation({
      board: createDefaultWorld(),
      setIntervalFn: () => 1,
      clearIntervalFn: () => undefined,
    });
    expect(simulation.getCurrentYear()).toBe(0);
    simulation.start();
    simulation.advanceStep();
    expect(simulation.getCurrentYear()).toBe(1);
    simulation.advanceStep();
    expect(simulation.getCurrentYear()).toBe(2);
    simulation.dispose();
  });
});
