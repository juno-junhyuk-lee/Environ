import type { ElementName } from "../../world/index.ts";

const MODEL_DIR = `${import.meta.env.BASE_URL}models/hexagon-kit/`;

export interface TileModel {
  url: string;
  /** Top of the tile's ground (after `heightScale`): where its border is drawn. */
  surfaceHeight: number;
  heightScale?: number;
  hasRipples?: boolean;
}

const LAND_HEIGHT = 0.2;

// water.glb is only half as tall as land, so a lake blended into the sea.
// Stretch it to sit just below the surrounding land, like water in a basin.
const WATER_GLB_HEIGHT = 0.1;
const LAKE_HEIGHT = 0.17;

export const ELEMENT_MODELS: Readonly<Record<ElementName, TileModel>> = {
  human_settlement: {
    url: `${MODEL_DIR}building-village.glb`,
    surfaceHeight: LAND_HEIGHT,
  },
  forest: { url: `${MODEL_DIR}grass-forest.glb`, surfaceHeight: LAND_HEIGHT },
  fresh_water_body: {
    url: `${MODEL_DIR}water.glb`,
    surfaceHeight: LAKE_HEIGHT,
    heightScale: LAKE_HEIGHT / WATER_GLB_HEIGHT,
    hasRipples: true,
  },
};
