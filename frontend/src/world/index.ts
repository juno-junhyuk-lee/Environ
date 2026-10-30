export {
  createBoardState,
  createMinimalBoardFixture,
  getNeighbors,
  getTile,
  MAX_TILES,
  replaceTile,
  HEX_DIRECTIONS,
  type Board,
} from "./board.ts";
export {
  ELEMENTS,
  ELEMENT_NAMES,
  FOREST,
  FRESH_WATER_BODY,
  HUMAN_SETTLEMENT,
  getDefaultCondition,
  getElementDefinition,
  getIcon,
  getLabel,
  getName,
  isElementName,
  type ElementDefinition,
  type ElementName,
} from "./elements.ts";
export {
  SIMULATION_RATES,
  applyToBoard,
  convertTile,
  evaluateForest,
  evaluateFreshWater,
  evaluateSettlements,
} from "./rules.ts";
export {
  LOCAL_STORAGE_KEY,
  WORLD_SAVE_FORMAT,
  WORLD_SAVE_VERSION,
  boardFromSave,
  exportWorldToFile,
  importWorldFromFile,
  loadWorldFromLocalStorage,
  saveWorldToLocalStorage,
  serializeWorld,
  validateWorldSave,
  worldSaveToJson,
  type LoadWorldResult,
  type WorldSave,
} from "./save.ts";
export {
  clampCondition,
  getConditionValue,
  getElement,
  setConditionValue,
  setNewElement,
} from "./tile.ts";
export {
  DEFAULT_TIME_STEP_INTERVAL_MS,
  createTimeSimulation,
  type CreateTimeSimulationOptions,
  type TimeSimulation,
  type TimeSimulationState,
} from "./time.ts";
