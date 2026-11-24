import { createContext, useContext } from "react";
import type {
  World,
  ElementName,
  WorldSave,
  WorldlyState,
} from "../../world/index.ts";

export interface BoardActions {
  /** Refused (returns false) while the simulation runs: pause first. */
  resetWorld: () => boolean;
  /** Refused (returns false) while the simulation runs: pause first. */
  loadWorld: (save: WorldSave) => boolean;
  /** Works while running too: drops land between yearly steps. */
  placeElement: (tileId: string, element: ElementName) => void;
  setWorldly: (worldly: WorldlyState) => void;
  /** Start, or resume after a pause: one year passes every interval. */
  play: () => void;
  pause: () => void;
}

export interface SimulationState {
  isRunning: boolean;
  /** Milliseconds per simulated year. */
  timeStepInterval: number;
  /**
   * How far through the current year, 0 to 1, measured from the moment it
   * started (`performance.now()`). For animations that must stay in step
   * with the clock; read it each frame rather than storing it.
   */
  yearProgress: () => number;
}

// Split so components that only change the board don't re-render when it changes.
export const BoardStateContext = createContext<World | null>(null);
export const BoardActionsContext = createContext<BoardActions | null>(null);
export const SimulationStateContext = createContext<SimulationState | null>(
  null,
);

function required<T>(value: T | null, hook: string): T {
  if (value === null) {
    throw new Error(`${hook} must be used inside <BoardProvider>`);
  }
  return value;
}

export function useBoard(): World {
  return required(useContext(BoardStateContext), "useBoard");
}

export function useBoardActions(): BoardActions {
  return required(useContext(BoardActionsContext), "useBoardActions");
}

export function useSimulation(): SimulationState {
  return required(useContext(SimulationStateContext), "useSimulation");
}
