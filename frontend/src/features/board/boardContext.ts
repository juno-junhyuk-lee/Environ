import { createContext, useContext } from "react";
import type { Board, ElementName } from "../../world/index.ts";

export interface BoardActions {
  placeElement: (tileId: string, element: ElementName) => void;
}

// Split so components that only change the board don't re-render when it changes.
export const BoardStateContext = createContext<Board | null>(null);
export const BoardActionsContext = createContext<BoardActions | null>(null);

function required<T>(value: T | null, hook: string): T {
  if (value === null) {
    throw new Error(`${hook} must be used inside <BoardProvider>`);
  }
  return value;
}

export function useBoard(): Board {
  return required(useContext(BoardStateContext), "useBoard");
}

export function useBoardActions(): BoardActions {
  return required(useContext(BoardActionsContext), "useBoardActions");
}
