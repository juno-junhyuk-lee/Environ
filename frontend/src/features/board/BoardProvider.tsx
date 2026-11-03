import { type ReactNode, useMemo, useReducer } from "react";
import { type Board, createBoardState } from "../../world/index.ts";
import {
  type BoardActions,
  BoardActionsContext,
  BoardStateContext,
} from "./boardContext.ts";
import { boardReducer } from "./boardState.ts";

interface BoardProviderProps {
  children: ReactNode;
  initialBoard?: Board | undefined;
}

export function BoardProvider({ children, initialBoard }: BoardProviderProps) {
  const [board, dispatch] = useReducer(
    boardReducer,
    initialBoard,
    (start) => start ?? createBoardState(),
  );

  // `dispatch` is stable, so no dependencies.
  const actions = useMemo<BoardActions>(
    () => ({
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
