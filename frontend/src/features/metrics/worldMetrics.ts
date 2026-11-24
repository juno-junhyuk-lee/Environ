import {
  airQualityOf,
  type Board,
  getNeighbors,
  type WeatherKind,
  type World,
} from "../../world/index.ts";

/**
 * The island at a glance, in plain numbers for the dashboard (SSDS Req 4).
 * Derived from the board and climate each time; nothing here is stored.
 */
export interface WorldMetrics {
  /** Every town's population added up (each town is 0–100). */
  population: number;
  /** How much of the island is healthy forest, 0–100 %. */
  forestCover: number;
  /** Average quality of the lakes, 0–100 %; null with no lakes. */
  waterQuality: number | null;
  /** Average air quality over every tile, 0–100. */
  airQuality: number;
  temperatureC: number;
  /** The climate's carbon level, 0–100 (50 at the start). */
  carbon: number;
  weather: WeatherKind;
}

function conditionsOf(board: Board, element: string): number[] {
  return board.tiles
    .filter((tile) => tile.element === element)
    .map((tile) => tile.conditionValue);
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function worldMetrics(world: World): WorldMetrics {
  const lakes = conditionsOf(world, "fresh_water_body");
  const air = world.tiles.map((tile) =>
    airQualityOf(tile, getNeighbors(world, tile)),
  );

  return {
    population: sum(conditionsOf(world, "human_settlement")),
    forestCover: sum(conditionsOf(world, "forest")) / world.tiles.length,
    waterQuality: lakes.length === 0 ? null : sum(lakes) / lakes.length,
    airQuality: sum(air) / air.length,
    temperatureC: world.worldly.temperatureC,
    carbon: world.worldly.carbon,
    weather: world.worldly.weather,
  };
}

export const WEATHER_WORDS: Readonly<Record<WeatherKind, string>> = {
  sunny: "Sunny",
  rainy: "Rainy",
  cloudy: "Cloudy",
  drought: "Drought",
  storm: "Stormy",
};
