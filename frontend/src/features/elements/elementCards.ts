import type { ElementName } from "../../world/index.ts";

export interface ElementMove {
  name: string;
  text: string;
}

/** Trading-card style copy shown when hovering an element in the pane. */
export interface ElementCard {
  moves: readonly ElementMove[];
  weakness: string;
  flavor: string;
}

/** Top-to-bottom order of the icons in the elements pane. */
export const PANE_ORDER: readonly ElementName[] = [
  "forest",
  "fresh_water_body",
  "human_settlement",
];

// Keep the moves true to the yearly rules in `world/rules.ts`.
export const ELEMENT_CARDS: Readonly<Record<ElementName, ElementCard>> = {
  forest: {
    moves: [
      {
        name: "Deep Roots",
        text: "Grows healthier every year, faster beside clean water. Slows as it nears full health.",
      },
      {
        name: "Watershed",
        text: "Helps nearby fresh water refill and gives settlements room to grow.",
      },
    ],
    weakness: "Every settlement next to it wears it down each year.",
    flavor: "Cut down to nothing, it makes way for a new settlement.",
  },
  fresh_water_body: {
    moves: [
      {
        name: "Spring Fed",
        text: "Refills itself every year, fastest when it is running low.",
      },
      {
        name: "Lifeline",
        text: "Feeds nearby forests, and no settlement can grow without it.",
      },
    ],
    weakness: "Every settlement next to it uses some of it up each year.",
    flavor: "The only element that never turns into another.",
  },
  human_settlement: {
    moves: [
      {
        name: "Build Up",
        text: "Grows when both forest and fresh water are next to it, and grows bigger the healthier they are.",
      },
      {
        name: "Heavy Footprint",
        text: "The bigger it gets, the harder it presses on the forests and water around it.",
      },
    ],
    weakness:
      "Without both forest and water next to it, it shrinks. Small towns shrink fastest.",
    flavor: "Abandoned, it is slowly reclaimed by the forest.",
  },
};
