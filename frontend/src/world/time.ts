import { applyToBoard } from "./rules.ts";
import type { Board } from "./board.ts";
import {
  createSeededRng,
  DEFAULT_WORLDLY_STATE,
  drawWeather,
  nextCarbon,
  nextTemperature,
  type WorldlyState,
} from "./worldly.ts";

/** 1 simulation step = 1 year, every 10 seconds. */
export const DEFAULT_TIME_STEP_INTERVAL_MS = 10000;

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

function sanitizeWorldly(worldly: WorldlyState): WorldlyState {
  return {
    temperatureC: Number.isFinite(worldly.temperatureC)
      ? worldly.temperatureC
      : DEFAULT_WORLDLY_STATE.temperatureC,
    carbon: Number.isFinite(worldly.carbon)
      ? worldly.carbon
      : DEFAULT_WORLDLY_STATE.carbon,
    weather: worldly.weather,
  };
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

    const weather = drawWeather(rng, state.temperatureC);
    const carbon = nextCarbon(state.carbon, board);
    const temperatureC = nextTemperature(state.temperatureC, carbon);
    const ctx = { temperatureC, weather };
    board = applyToBoard(board, ctx);
    state = {
      ...state,
      currentYear: state.currentYear + 1,
      temperatureC,
      carbon,
      weather,
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
