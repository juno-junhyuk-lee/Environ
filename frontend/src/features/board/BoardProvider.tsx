import { type ReactNode, useMemo, useReducer } from "react";
import { type Board, createDefaultWorld } from "../../world/index.ts";
import {
  type BoardActions,
  BoardActionsContext,
  BoardStateContext,
} from "./boardContext.ts";
import { worldReducer } from "./boardState.ts";

interface BoardProviderProps {
  children: ReactNode;
  initialBoard?: Board | undefined;
}

export function BoardProvider({ children, initialBoard }: BoardProviderProps) {
  const [board, dispatch] = useReducer(worldReducer, initialBoard, (start) =>
    start ? { ...start, year: 0 } : createDefaultWorld(),
  );

  // `dispatch` is stable, so no dependencies.
  const actions = useMemo<BoardActions>(
    () => ({
      loadWorld: (save) => {
        dispatch({ type: "loadWorld", save });
      },
      resetWorld: () => {
        dispatch({ type: "resetWorld" });
      },
      placeElement: (tileId, element) => {
        dispatch({ type: "placeElement", tileId, element });
      },
    }),
    [],
  );

  return (
    <BoardActionsContext value={actions}>
      <BoardStateContext value={board}>{children}</BoardStateContext>
    </BoardActionsContext>
  );
}
