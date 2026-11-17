import { describe, expect, it } from "vitest";
import type { Tile } from "../features/board/board.ts";
import { createBoardState, getNeighbors, type Board } from "./board.ts";
import { applyToBoard } from "./rules.ts";
import { createTimeSimulation } from "./time.ts";
import { createDefaultWorld } from "./world.ts";
import {
  airQualityFactor,
  airQualityOf,
  createSeededRng,
  drawWeather,
  NEUTRAL_CONTEXT,
  nextCarbon,
  nextTemperature,
  ruleModifiersFor,
  temperatureFactors,
  weatherFactors,
} from "./worldly.ts";

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

describe("air quality", () => {
  it("is higher for a settlement next to forests than next to settlements", () => {
    const settlement = tile(0, 0, "human_settlement", 50);
    const byForests = boardOf(
      settlement,
      tile(-1, 0, "forest", 80),
      tile(1, 0, "forest", 80),
    );
    const bySettlements = boardOf(
      settlement,
      tile(-1, 0, "human_settlement", 80),
      tile(1, 0, "human_settlement", 80),
    );
    const forestAqi = airQualityOf(
      settlement,
      getNeighbors(byForests, settlement),
    );
    const settlementAqi = airQualityOf(
      settlement,
      getNeighbors(bySettlements, settlement),
    );
    expect(forestAqi).toBeGreaterThan(settlementAqi);
  });

  it("clamps to 0–100", () => {
    const smothered = tile(0, 0, "human_settlement", 100);
    const board = boardOf(
      smothered,
      tile(1, 0, "human_settlement", 100),
      tile(-1, 0, "human_settlement", 100),
      tile(0, 1, "human_settlement", 100),
      tile(0, -1, "human_settlement", 100),
      tile(1, -1, "human_settlement", 100),
      tile(-1, 1, "human_settlement", 100),
    );
    const low = airQualityOf(smothered, getNeighbors(board, smothered));
    expect(low).toBeGreaterThanOrEqual(0);
    expect(low).toBeLessThanOrEqual(100);

    // Raw value would be 100 + 0.3 * 100 = 130 before the clamp.
    const lush = tile(0, 0, "forest", 50);
    const lushBoard = boardOf(
      lush,
      tile(1, 0, "forest", 100),
      tile(-1, 0, "forest", 100),
    );
    expect(airQualityOf(lush, getNeighbors(lushBoard, lush))).toBe(100);
  });
});

describe("carbon and temperature", () => {
  it("leaves carbon unchanged when settlement and forest totals match", () => {
    const board = boardOf(
      tile(0, 0, "human_settlement", 50),
      tile(1, 0, "forest", 50),
    );
    expect(nextCarbon(50, board)).toBe(50);
  });

  it("rises on a settlement-heavy board and falls on a forest-heavy board", () => {
    const settlements = boardOf(
      tile(0, 0, "human_settlement", 80),
      tile(1, 0, "human_settlement", 80),
      tile(-1, 0, "forest", 10),
    );
    const forests = boardOf(
      tile(0, 0, "forest", 80),
      tile(1, 0, "forest", 80),
      tile(-1, 0, "human_settlement", 10),
    );
    expect(nextCarbon(50, settlements)).toBeGreaterThan(50);
    expect(nextCarbon(50, forests)).toBeLessThan(50);
  });

  it("moves temperature 10% toward its carbon target and holds still at carbon 50", () => {
    expect(nextTemperature(15, 50)).toBe(15);
    // target = 15 + (70 - 50) * 0.2 = 19; 15 + 0.1 * 4 = 15.4
    expect(nextTemperature(15, 70)).toBe(15.4);
  });
});

describe("weather", () => {
  it("gives the same sequence for the same seed", () => {
    const first = createSeededRng(42);
    const second = createSeededRng(42);
    const sequenceA = Array.from({ length: 20 }, () => drawWeather(first, 15));
    const sequenceB = Array.from({ length: 20 }, () => drawWeather(second, 15));
    expect(sequenceA).toEqual(sequenceB);
  });

  it("raises drought weight with heat", () => {
    const coolRng = createSeededRng(7);
    const hotRng = createSeededRng(7);
    const coolDraws = Array.from({ length: 5000 }, () =>
      drawWeather(coolRng, 15),
    );
    const hotDraws = Array.from({ length: 5000 }, () =>
      drawWeather(hotRng, 30),
    );
    const coolDrought =
      coolDraws.filter((kind) => kind === "drought").length / coolDraws.length;
    const hotDrought =
      hotDraws.filter((kind) => kind === "drought").length / hotDraws.length;
    expect(hotDrought).toBeGreaterThan(coolDrought);
  });
});

describe("time simulation worldly state", () => {
  it("advances year, carbon, temperature, and weather with a fixed seed", () => {
    const steps: {
      year: number;
      worldly: ReturnType<
        ReturnType<typeof createTimeSimulation>["getWorldly"]
      >;
    }[] = [];
    const simulation = createTimeSimulation({
      board: createDefaultWorld(),
      rng: createSeededRng(99),
      setIntervalFn: () => 1,
      clearIntervalFn: () => undefined,
      onStep: (_board, year, worldly) => {
        steps.push({ year, worldly: { ...worldly } });
      },
    });
    expect(simulation.getWorldly()).toEqual({
      temperatureC: 15,
      carbon: 50,
      weather: "sunny",
    });
    simulation.start();
    simulation.advanceStep();
    expect(simulation.getCurrentYear()).toBe(1);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.year).toBe(1);
    expect(steps[0]?.worldly).toEqual(simulation.getWorldly());
    expect(typeof simulation.getWorldly().weather).toBe("string");
    expect(simulation.getWorldly().carbon).not.toBeNaN();
    expect(simulation.getWorldly().temperatureC).not.toBeNaN();
    simulation.advanceStep();
    expect(simulation.getCurrentYear()).toBe(2);
    expect(steps).toHaveLength(2);
    simulation.dispose();
  });

  it("loads worldly via setBoard and leaves climate alone when omitted", () => {
    const simulation = createTimeSimulation({
      board: createDefaultWorld(),
      setIntervalFn: () => 1,
      clearIntervalFn: () => undefined,
    });
    expect(
      simulation.setBoard(createDefaultWorld(), {
        temperatureC: 18,
        carbon: 62,
        weather: "storm",
      }),
    ).toBe(true);
    expect(simulation.getWorldly()).toEqual({
      temperatureC: 18,
      carbon: 62,
      weather: "storm",
    });
    expect(simulation.setBoard(createDefaultWorld())).toBe(true);
    expect(simulation.getWorldly()).toEqual({
      temperatureC: 18,
      carbon: 62,
      weather: "storm",
    });
    simulation.dispose();
  });
});

describe("modifiers", () => {
  it("equals all 1.0 at sunny 15 degrees", () => {
    expect(temperatureFactors(15)).toEqual({
      forest: 1,
      water: 1,
      settlement: 1,
    });
    expect(weatherFactors("sunny")).toEqual({
      forest: 1,
      water: 1,
      settlement: 1,
    });
    expect(ruleModifiersFor(15, "sunny")).toEqual({
      forest: 1,
      water: 1,
      settlement: 1,
    });
  });

  it("matches drought at 25 degrees", () => {
    // Forest: max(0.5, 1 - 0.1 * 5) = 0.5; water: max(0.6, 1 - 0.04 * 10) = 0.6;
    // settlement: max(0.8, 1 - 0.07 * 3) = max(0.8, 0.79) = 0.8.
    expect(temperatureFactors(25)).toEqual({
      forest: 0.5,
      water: 0.6,
      settlement: 0.8,
    });
    expect(weatherFactors("drought")).toEqual({
      forest: 0.5,
      water: 0.3,
      settlement: 0.9,
    });
    const droughtHot = ruleModifiersFor(25, "drought");
    expect(droughtHot.forest).toBeCloseTo(0.25);
    expect(droughtHot.water).toBeCloseTo(0.18);
    expect(droughtHot.settlement).toBeCloseTo(0.72);
  });

  it("airQualityFactor is 1.0 at AQI 100 and 0.76 / 0.84 at AQI 20", () => {
    expect(airQualityFactor("forest", 100)).toBe(1);
    expect(airQualityFactor("settlement", 100)).toBe(1);
    expect(airQualityFactor("forest", 20)).toBeCloseTo(0.76);
    expect(airQualityFactor("settlement", 20)).toBeCloseTo(0.84);
  });
});

describe("20-year sanity on the default striped world", () => {
  it("keeps carbon and temperature near defaults and close to a neutral run", () => {
    const seed = 20261117;
    const simulation = createTimeSimulation({
      board: createDefaultWorld(),
      rng: createSeededRng(seed),
      setIntervalFn: () => 1,
      clearIntervalFn: () => undefined,
    });
    simulation.start();
    for (let year = 0; year < 20; year += 1) {
      simulation.advanceStep();
    }
    const worldly = simulation.getWorldly();
    expect(worldly.carbon).toBeGreaterThanOrEqual(40);
    expect(worldly.carbon).toBeLessThanOrEqual(60);
    expect(worldly.temperatureC).toBeGreaterThanOrEqual(13);
    expect(worldly.temperatureC).toBeLessThanOrEqual(17);

    let neutralBoard: Board = createDefaultWorld();
    for (let year = 0; year < 20; year += 1) {
      neutralBoard = applyToBoard(neutralBoard, NEUTRAL_CONTEXT);
    }
    const worldlyBoard = simulation.getBoard();
    for (const tileEntry of worldlyBoard.tiles) {
      const neutral = neutralBoard.tiles.find(
        (candidate) => candidate.id === tileEntry.id,
      );
      if (!neutral) throw new Error(`missing tile ${tileEntry.id}`);
      expect(
        Math.abs(tileEntry.conditionValue - neutral.conditionValue),
      ).toBeLessThanOrEqual(15);
    }
    simulation.dispose();
  });
});
