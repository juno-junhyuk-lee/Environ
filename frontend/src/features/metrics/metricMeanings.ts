import type { WorldMetrics } from "./worldMetrics.ts";

export interface MetricMeaning {
  /**
   * How to read the number, using its current value, and how it compares
   * with the real world where there's an honest comparison.
   */
  reading: (metrics: WorldMetrics) => string;
  /** What it means for a real place. */
  realLife: string;
  /** Why it matters to real people and places; only where it fits. */
  whyItMatters?: string;
  /** What moves it in Environ. Keep true to `world/rules.ts`, `worldly.ts`. */
  inGame: string;
}

const whole = (value: number) => Math.round(value).toLocaleString("en");

// Plain, calm wording for children (SSDS §2.6): explain, don't alarm.
// Real-world figures are rounded on purpose; check them before changing.
export const METRIC_MEANINGS: Readonly<
  Record<keyof WorldMetrics, MetricMeaning>
> = {
  population: {
    reading: (m) =>
      `${whole(m.population)} is all your towns' sizes added up. Each town counts from 0 to 100, so five full towns would make 500. It's a score, not a count of people.`,
    realLife:
      "How many people live in your towns. People need clean water, food and space, so growing cities often clear forests and use more water.",
    inGame:
      "Towns grow when they have both a forest and a lake next door, and shrink without them.",
  },
  forestCover: {
    reading: (m) =>
      `${whole(m.forestCover)}% of your island is healthy forest. 100% would be every tile a forest in full health. On Earth, about 31% of the land is covered by forest.`,
    realLife:
      "How much of the land is covered by healthy forest. Forests clean the air, soak up carbon, hold soil in place, keep rivers and lakes clean, and are home to most land animals.",
    whyItMatters:
      "Forests give people wood, food and medicines, protect clean water and slow climate change by storing carbon. A forest that's cut down can take a lifetime or more to grow back.",
    inGame:
      "Forests grow back on their own, faster beside lakes, and every neighbouring town wears them down.",
  },
  waterQuality: {
    reading: (m) =>
      m.waterQuality === null
        ? "You have no lakes right now, so there's no water to measure."
        : `Your lakes are ${whole(m.waterQuality)}% clean and full on average. 100% is a clean, full lake; 0% is one that's used up.`,
    realLife:
      "How clean and full your lakes are. Only about 3% of Earth's water is fresh, and most of that is frozen in ice. Towns use fresh water and can pollute it, and forests around lakes help filter the water that flows in.",
    whyItMatters:
      "Everyone needs clean fresh water to drink, grow food and stay healthy. About 2 billion people still don't have safe drinking water at home.",
    inGame:
      "Lakes refill themselves, faster with forests around them, and every neighbouring town uses some of the water.",
  },
  airQuality: {
    reading: (m) =>
      `${whole(m.airQuality)} out of 100, where 100 is the cleanest air. Real air quality numbers work the other way round: there, a low number means clean air.`,
    realLife:
      "How clean the air is to breathe. Cars, factories and burning fuel put smoke and tiny particles into the air, and trees help clean it.",
    whyItMatters:
      "Clean air keeps our lungs and hearts healthy. Dirty air makes many people ill, especially young children and older people.",
    inGame:
      "Towns make the air around them dirtier, and forests nearby make it cleaner. Clean air helps forests and towns grow.",
  },
  temperatureC: {
    reading: (m) =>
      `Your island is ${m.temperatureC.toFixed(1)} °C on average. It starts at 15 °C, which is about Earth's average temperature. Above 20 °C, droughts start to come more often.`,
    realLife:
      "How warm the island is on average. More carbon dioxide in the air traps more of the sun's heat. Earth is already more than 1 °C warmer than it was in the 1800s.",
    whyItMatters:
      "Even a degree or two of warming brings more heatwaves, melting ice and rising seas, and makes life harder for plants and animals that can't move or adapt fast enough.",
    inGame:
      "Slowly follows the carbon level: more carbon, warmer island. Heat slows forests and lakes, and brings more droughts.",
  },
  carbon: {
    reading: (m) =>
      `${whole(m.carbon)} on a scale from 0 to 100, starting at 50. It's a game score, not a real measurement: real air holds about 420 parts of carbon dioxide per million today, up from about 280 before factories and cars.`,
    realLife:
      "How much carbon dioxide is in the air. Burning coal, oil and gas adds it, and forests and oceans take some of it back out.",
    whyItMatters:
      "Carbon dioxide stays in the air for a very long time, so what we add today keeps warming the planet for centuries. That's why using less fossil fuel and protecting forests both help.",
    inGame:
      "Goes up each year when your towns outweigh your forests, and down when forests outweigh towns.",
  },
  weather: {
    reading: () =>
      "There's no number here: each year has one kind of weather. At first sunny years are most common, and a warmer island gets more droughts.",
    realLife:
      "This year's weather. As the world warms, droughts, heavy rain and storms become more common.",
    whyItMatters:
      "Farms, rivers and towns all depend on the right amount of rain. Long droughts can dry up crops and water supplies, and big storms can flood homes.",
    inGame:
      "Rain helps lakes and forests, droughts are hard on both, and storms are hard on forests but refill lakes.",
  },
};
