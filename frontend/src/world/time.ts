import { applyToBoard } from "./rules.ts";
import type { Board } from "./board.ts";

/** Provisional: 1 simulation step = 1 year, every 2 seconds. */
export const DEFAULT_TIME_STEP_INTERVAL_MS = 2000;

export interface TimeSimulationState {
  currentYear: number;
  timeStepInterval: number;
  isPaused: boolean;
  isRunning: boolean;
}

export interface TimeSimulation {
  getState: () => TimeSimulationState;
  getBoard: () => Board;
  getCurrentYear: () => number;
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
  /** Replace the board when editBoard() allows it. Returns whether it applied. */
  setBoard: (board: Board) => boolean;
  dispose: () => void;
}

export interface CreateTimeSimulationOptions {
  board: Board;
  currentYear?: number;
  timeStepInterval?: number;
  onStep?: (board: Board, year: number) => void;
  /** Injected for tests; defaults to window.setTimeout / clearTimeout. */
  setIntervalFn?: (handler: () => void, ms: number) => number;
  clearIntervalFn?: (id: number) => void;
}

export function createTimeSimulation(
  options: CreateTimeSimulationOptions,
): TimeSimulation {
  let board = options.board;
  let state: TimeSimulationState = {
    currentYear: options.currentYear ?? 0,
    timeStepInterval: options.timeStepInterval ?? DEFAULT_TIME_STEP_INTERVAL_MS,
    isPaused: false,
    isRunning: false,
  };

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

  function advanceStep(): void {
    if (!state.isRunning || state.isPaused) {
      return;
    }
    board = applyToBoard(board);
    state = { ...state, currentYear: state.currentYear + 1 };
    options.onStep?.(board, state.currentYear);
  }

  return {
    getState: () => ({ ...state }),
    getBoard: () => board,
    getCurrentYear: () => state.currentYear,
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
    setBoard: (nextBoard: Board) => {
      if (!(!state.isRunning || state.isPaused)) {
        return false;
      }
      board = nextBoard;
      return true;
    },
    dispose: () => {
      clearTimer();
    },
  };
}
