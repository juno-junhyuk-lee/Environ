import { applyToBoard } from "./rules.ts";
import type { Board } from "./board.ts";
import {
  createSeededRng,
  DEFAULT_WORLDLY_STATE,
  drawWeather,
  nextCarbon,
  nextTemperature,
  sanitizeWorldly,
  type WorldlyState,
} from "./worldly.ts";

/** 1 simulation step = 1 year, every 10 seconds. */
export const DEFAULT_TIME_STEP_INTERVAL_MS = 10000;

/**
 * One year, pure: draw weather → update carbon → update temperature →
 * `applyToBoard`. The board and climate passed in are never mutated. The
 * caller owns the year counter. `deltaScale` (debugging only) speeds up tile
 * changes; see `applyToBoard`.
 */
export function stepWorld(
  board: Board,
  worldly: WorldlyState,
  rng: () => number,
  deltaScale = 1,
): { board: Board; worldly: WorldlyState } {
  const weather = drawWeather(rng, worldly.temperatureC);
  const carbon = nextCarbon(worldly.carbon, board);
  const temperatureC = nextTemperature(worldly.temperatureC, carbon);
  return {
    board: applyToBoard(board, { temperatureC, weather }, deltaScale),
    worldly: { temperatureC, carbon, weather },
  };
}

export interface TimeSimulationState {
  currentYear: number;
  timeStepInterval: number;
  isPaused: boolean;
  isRunning: boolean;
  temperatureC: number;
  carbon: number;
  weather: WorldlyState["weather"];
}

export interface TimeSimulation {
  getState: () => TimeSimulationState;
  getBoard: () => Board;
  getCurrentYear: () => number;
  getWorldly: () => WorldlyState;
  setCurrentYear: (year: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  advanceStep: () => void;
  /**
   * Gate for tile edits. True before start or while paused; false while
   * the simulation is actively running.
   */
  editBoard: () => boolean;
  /**
   * Replace the board when editBoard() allows it. Optionally replace climate
   * too (load); omit worldly when editing a tile so climate stays put.
   */
  setBoard: (board: Board, worldly?: WorldlyState) => boolean;
  dispose: () => void;
}

export interface CreateTimeSimulationOptions {
  board: Board;
  currentYear?: number;
  timeStepInterval?: number;
  worldly?: WorldlyState;
  /** Injected for tests; defaults to a Date.now()-seeded mulberry32. */
  rng?: () => number;
  onStep?: (board: Board, year: number, worldly: WorldlyState) => void;
  /** Injected for tests; defaults to window.setTimeout / clearTimeout. */
  setIntervalFn?: (handler: () => void, ms: number) => number;
  clearIntervalFn?: (id: number) => void;
}

export function createTimeSimulation(
  options: CreateTimeSimulationOptions,
): TimeSimulation {
  let board = options.board;
  const initialWorldly = sanitizeWorldly(
    options.worldly ?? DEFAULT_WORLDLY_STATE,
  );
  let state: TimeSimulationState = {
    currentYear: options.currentYear ?? 0,
    timeStepInterval: options.timeStepInterval ?? DEFAULT_TIME_STEP_INTERVAL_MS,
    isPaused: false,
    isRunning: false,
    temperatureC: initialWorldly.temperatureC,
    carbon: initialWorldly.carbon,
    weather: initialWorldly.weather,
  };

  const rng = options.rng ?? createSeededRng(Date.now());

  const setIntervalFn =
    options.setIntervalFn ?? ((handler, ms) => window.setInterval(handler, ms));
  const clearIntervalFn =
    options.clearIntervalFn ??
    ((id) => {
      window.clearInterval(id);
    });

  let timerId: number | null = null;

  function clearTimer(): void {
    if (timerId !== null) {
      clearIntervalFn(timerId);
      timerId = null;
    }
  }

  function scheduleTimer(): void {
    clearTimer();
    timerId = setIntervalFn(() => {
      advanceStep();
    }, state.timeStepInterval);
  }

  function worldlyFromState(): WorldlyState {
    return {
      temperatureC: state.temperatureC,
      carbon: state.carbon,
      weather: state.weather,
    };
  }

  function advanceStep(): void {
    if (!state.isRunning || state.isPaused) {
      return;
    }

    const next = stepWorld(board, worldlyFromState(), rng);
    board = next.board;
    state = {
      ...state,
      currentYear: state.currentYear + 1,
      ...next.worldly,
    };
    options.onStep?.(board, state.currentYear, worldlyFromState());
  }

  return {
    getState: () => ({ ...state }),
    getBoard: () => board,
    getCurrentYear: () => state.currentYear,
    getWorldly: () => worldlyFromState(),
    setCurrentYear: (year: number) => {
      state = { ...state, currentYear: Math.max(0, Math.floor(year)) };
    },
    start: () => {
      if (state.isRunning && !state.isPaused) {
        return;
      }
      state = { ...state, isRunning: true, isPaused: false };
      scheduleTimer();
    },
    pause: () => {
      if (!state.isRunning || state.isPaused) {
        return;
      }
      state = { ...state, isPaused: true };
      clearTimer();
    },
    resume: () => {
      if (!state.isRunning || !state.isPaused) {
        return;
      }
      state = { ...state, isPaused: false };
      scheduleTimer();
    },
    advanceStep,
    editBoard: () => !state.isRunning || state.isPaused,
    setBoard: (nextBoard: Board, worldly?: WorldlyState) => {
      if (!(!state.isRunning || state.isPaused)) {
        return false;
      }
      board = nextBoard;
      if (worldly !== undefined) {
        const next = sanitizeWorldly(worldly);
        state = {
          ...state,
          temperatureC: next.temperatureC,
          carbon: next.carbon,
          weather: next.weather,
        };
      }
      return true;
    },
    dispose: () => {
      clearTimer();
    },
  };
}
