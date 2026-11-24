import {
  type ReactNode,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  type Board,
  createDefaultWorld,
  DEFAULT_TIME_STEP_INTERVAL_MS,
  DEFAULT_WORLDLY_STATE,
} from "../../world/index.ts";
import {
  type BoardActions,
  BoardActionsContext,
  BoardStateContext,
  type SimulationState,
  SimulationStateContext,
} from "./boardContext.ts";
import { worldReducer } from "./boardState.ts";

interface BoardProviderProps {
  children: ReactNode;
  initialBoard?: Board | undefined;
  /** Milliseconds per simulated year. */
  timeStepInterval?: number;
  /** Debugging only: multiplies each tile's yearly change (see debug.ts). */
  debugSpeed?: number;
}

export function BoardProvider({
  children,
  initialBoard,
  timeStepInterval = DEFAULT_TIME_STEP_INTERVAL_MS,
  debugSpeed = 1,
}: BoardProviderProps) {
  const [board, dispatch] = useReducer(worldReducer, initialBoard, (start) =>
    start
      ? { ...start, year: 0, worldly: { ...DEFAULT_WORLDLY_STATE } }
      : createDefaultWorld(),
  );
  const [isRunning, setIsRunning] = useState(false);

  // Read by the stable actions below, so they can refuse reset and load while
  // running without being recreated on every play and pause. Only play and
  // pause change it, alongside the state.
  const isRunningRef = useRef(false);

  // When the current year started, so animations can follow the clock
  // exactly instead of keeping their own time.
  const yearStartedAt = useRef(0);

  // The clock: one year per interval while running. Pausing clears it, so
  // the year in progress restarts from zero on resume.
  useEffect(() => {
    if (!isRunning) return;
    yearStartedAt.current = performance.now();
    const timer = window.setInterval(() => {
      yearStartedAt.current = performance.now();
      dispatch({
        type: "advanceYear",
        roll: Math.random(),
        deltaScale: debugSpeed,
      });
    }, timeStepInterval);
    return () => {
      window.clearInterval(timer);
    };
  }, [isRunning, timeStepInterval, debugSpeed]);

  // `dispatch` and the setter are stable, so no dependencies.
  const actions = useMemo<BoardActions>(
    () => ({
      loadWorld: (save) => {
        if (isRunningRef.current) return false;
        dispatch({ type: "loadWorld", save });
        return true;
      },
      resetWorld: () => {
        if (isRunningRef.current) return false;
        dispatch({ type: "resetWorld" });
        return true;
      },
      placeElement: (tileId, element) => {
        dispatch({ type: "placeElement", tileId, element });
      },
      setWorldly: (worldly) => {
        dispatch({ type: "setWorldly", worldly });
      },
      play: () => {
        isRunningRef.current = true;
        setIsRunning(true);
      },
      pause: () => {
        isRunningRef.current = false;
        setIsRunning(false);
      },
    }),
    [],
  );

  const simulation = useMemo<SimulationState>(
    () => ({
      isRunning,
      timeStepInterval,
      yearProgress: () =>
        Math.min(
          1,
          Math.max(
            0,
            (performance.now() - yearStartedAt.current) / timeStepInterval,
          ),
        ),
    }),
    [isRunning, timeStepInterval],
  );

  return (
    <BoardActionsContext value={actions}>
      <SimulationStateContext value={simulation}>
        <BoardStateContext value={board}>{children}</BoardStateContext>
      </SimulationStateContext>
    </BoardActionsContext>
  );
}
