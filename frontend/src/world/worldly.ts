import type { Tile } from "../features/board/board.ts";
import type { Board } from "./board.ts";
import { FOREST, HUMAN_SETTLEMENT } from "./elements.ts";
import { clampCondition } from "./tile.ts";

export type WeatherKind = "sunny" | "rainy" | "cloudy" | "drought" | "storm";

export interface WorldlyState {
  temperatureC: number;
  carbon: number;
  weather: WeatherKind;
}

export interface WorldlyContext {
  temperatureC: number;
  weather: WeatherKind;
}

export const DEFAULT_WORLDLY_STATE: WorldlyState = {
  temperatureC: 15,
  carbon: 50,
  weather: "sunny",
};

/** Every multiplier is 1.0 at this climate. */
export const NEUTRAL_CONTEXT: WorldlyContext = {
  temperatureC: 15,
  weather: "sunny",
};

export const WORLDLY_RATES = {
  airQuality: {
    adjacentSettlementWeight: 0.5,
    ownSettlementWeight: 0.3,
    adjacentForestWeight: 0.3,
  },
  carbon: {
    /** Design value; the mixed default layout is what keeps carbon near 50. */
    rate: 0.01,
  },
  temperature: {
    baseC: 15,
    carbonPivot: 50,
    carbonScale: 0.2,
    lerp: 0.1,
  },
  weather: {
    baseWeights: {
      sunny: 35,
      rainy: 25,
      cloudy: 20,
      drought: 10,
      storm: 10,
    },
    droughtHeatThresholdC: 20,
    droughtHeatWeightPerDegree: 2,
  },
  temperatureFactors: {
    forest: {
      coolBelowC: 10,
      coolFactor: 0.85,
      idealUpToC: 20,
      hotPenaltyPerDegree: 0.1,
      hotFloor: 0.5,
    },
    water: {
      idealUpToC: 15,
      hotPenaltyPerDegree: 0.04,
      hotFloor: 0.6,
    },
    settlement: {
      idealUpToC: 22,
      hotPenaltyPerDegree: 0.07,
      hotFloor: 0.8,
    },
  },
  weatherFactors: {
    sunny: { forest: 1, water: 1, settlement: 1 },
    rainy: { forest: 1.2, water: 1.5, settlement: 1 },
    cloudy: { forest: 0.9, water: 1, settlement: 1 },
    drought: { forest: 0.5, water: 0.3, settlement: 0.9 },
    storm: { forest: 0.7, water: 1.3, settlement: 0.9 },
  },
  airQualityFactor: {
    forest: { base: 0.7, scale: 0.3 },
    settlement: { base: 0.8, scale: 0.2 },
  },
} as const;

const WEATHER_KINDS = [
  "sunny",
  "rainy",
  "cloudy",
  "drought",
  "storm",
] as const satisfies readonly WeatherKind[];

export function isWeatherKind(value: string): value is WeatherKind {
  return (WEATHER_KINDS as readonly string[]).includes(value);
}

/**
 * Coerces climate into a safe WorldlyState: non-finite temperature/carbon
 * fall back to the defaults; unknown weather becomes sunny.
 */
export function sanitizeWorldly(worldly: {
  temperatureC: number;
  carbon: number;
  weather: string;
}): WorldlyState {
  return {
    temperatureC: Number.isFinite(worldly.temperatureC)
      ? worldly.temperatureC
      : DEFAULT_WORLDLY_STATE.temperatureC,
    carbon: Number.isFinite(worldly.carbon)
      ? worldly.carbon
      : DEFAULT_WORLDLY_STATE.carbon,
    weather: isWeatherKind(worldly.weather)
      ? worldly.weather
      : DEFAULT_WORLDLY_STATE.weather,
  };
}

function meanMatchingCondition(
  neighbors: Tile[],
  element: Tile["element"],
): number {
  const matching = neighbors.filter((neighbor) => neighbor.element === element);
  if (matching.length === 0) {
    return 0;
  }
  const total = matching.reduce(
    (sum, neighbor) => sum + neighbor.conditionValue,
    0,
  );
  return total / matching.length;
}

function sumConditions(board: Board, element: Tile["element"]): number {
  return board.tiles
    .filter((tile) => tile.element === element)
    .reduce((sum, tile) => sum + tile.conditionValue, 0);
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

/** Local air quality 0–100 from this tile and its neighbours. */
export function airQualityOf(tile: Tile, neighbors: Tile[]): number {
  const rates = WORLDLY_RATES.airQuality;
  const meanAdjacentSettlement = meanMatchingCondition(
    neighbors,
    HUMAN_SETTLEMENT.name,
  );
  const ownSettlement =
    tile.element === HUMAN_SETTLEMENT.name ? tile.conditionValue : 0;
  const meanAdjacentForest = meanMatchingCondition(neighbors, FOREST.name);

  return clampCondition(
    100 -
      rates.adjacentSettlementWeight * meanAdjacentSettlement -
      rates.ownSettlementWeight * ownSettlement +
      rates.adjacentForestWeight * meanAdjacentForest,
  );
}

/** Next global carbon from settlement vs forest totals. */
export function nextCarbon(carbon: number, board: Board): number {
  const safeCarbon = finiteOr(carbon, DEFAULT_WORLDLY_STATE.carbon);
  const settlementTotal = sumConditions(board, HUMAN_SETTLEMENT.name);
  const forestTotal = sumConditions(board, FOREST.name);
  return clampCondition(
    safeCarbon + WORLDLY_RATES.carbon.rate * (settlementTotal - forestTotal),
  );
}

/** Temperature eases 10% of the way toward the carbon-driven target. */
export function nextTemperature(temperatureC: number, carbon: number): number {
  const rates = WORLDLY_RATES.temperature;
  const safeTemperature = finiteOr(
    temperatureC,
    DEFAULT_WORLDLY_STATE.temperatureC,
  );
  const safeCarbon = finiteOr(carbon, DEFAULT_WORLDLY_STATE.carbon);
  const target =
    rates.baseC + (safeCarbon - rates.carbonPivot) * rates.carbonScale;
  const next = safeTemperature + rates.lerp * (target - safeTemperature);
  return Math.round(next * 10) / 10;
}

/** Mulberry32 — deterministic [0, 1) from a numeric seed. */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Weighted weather draw. Heat shifts weight from sunny into drought; sunny
 * floors at 0 so the total stays 100.
 */
export function drawWeather(
  rng: () => number,
  temperatureC: number,
): WeatherKind {
  const rates = WORLDLY_RATES.weather;
  const safeTemperature = finiteOr(
    temperatureC,
    DEFAULT_WORLDLY_STATE.temperatureC,
  );
  let sunny = rates.baseWeights.sunny;
  let drought = rates.baseWeights.drought;
  const heatBoost =
    rates.droughtHeatWeightPerDegree *
    Math.max(0, safeTemperature - rates.droughtHeatThresholdC);
  const takenFromSunny = Math.min(sunny, heatBoost);
  sunny -= takenFromSunny;
  drought += takenFromSunny;

  const weights: { kind: WeatherKind; weight: number }[] = [
    { kind: "sunny", weight: sunny },
    { kind: "rainy", weight: rates.baseWeights.rainy },
    { kind: "cloudy", weight: rates.baseWeights.cloudy },
    { kind: "drought", weight: drought },
    { kind: "storm", weight: rates.baseWeights.storm },
  ];

  const roll = rng() * 100;
  let cumulative = 0;
  for (const entry of weights) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      return entry.kind;
    }
  }
  return "storm";
}

export function temperatureFactors(temperatureC: number): {
  forest: number;
  water: number;
  settlement: number;
} {
  const rates = WORLDLY_RATES.temperatureFactors;
  const T = finiteOr(temperatureC, DEFAULT_WORLDLY_STATE.temperatureC);

  let forest: number;
  if (T < rates.forest.coolBelowC) {
    forest = rates.forest.coolFactor;
  } else if (T <= rates.forest.idealUpToC) {
    forest = 1;
  } else {
    forest = Math.max(
      rates.forest.hotFloor,
      1 - rates.forest.hotPenaltyPerDegree * (T - rates.forest.idealUpToC),
    );
  }

  const water =
    T <= rates.water.idealUpToC
      ? 1
      : Math.max(
          rates.water.hotFloor,
          1 - rates.water.hotPenaltyPerDegree * (T - rates.water.idealUpToC),
        );

  const settlement =
    T <= rates.settlement.idealUpToC
      ? 1
      : Math.max(
          rates.settlement.hotFloor,
          1 -
            rates.settlement.hotPenaltyPerDegree *
              (T - rates.settlement.idealUpToC),
        );

  return { forest, water, settlement };
}

export function weatherFactors(weather: WeatherKind): {
  forest: number;
  water: number;
  settlement: number;
} {
  return { ...WORLDLY_RATES.weatherFactors[weather] };
}

/** Per-element multipliers from temperature and weather combined. */
export function ruleModifiersFor(
  temperatureC: number,
  weather: WeatherKind,
): { forest: number; water: number; settlement: number } {
  const fromTemp = temperatureFactors(temperatureC);
  const fromWeather = weatherFactors(weather);
  return {
    forest: fromTemp.forest * fromWeather.forest,
    water: fromTemp.water * fromWeather.water,
    settlement: fromTemp.settlement * fromWeather.settlement,
  };
}

export function airQualityFactor(
  kind: "forest" | "settlement",
  aqi: number,
): number {
  const rates = WORLDLY_RATES.airQualityFactor[kind];
  const safeAqi = clampCondition(finiteOr(aqi, 100));
  return rates.base + (rates.scale * safeAqi) / 100;
}
