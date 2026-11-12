import { createContext, useContext } from "react";

/** The board tile under a point on screen (client coordinates), if any. */
export type TileHitTest = (clientX: number, clientY: number) => string | null;

/** Links the elements pane (where pieces are picked up) to the board. */
export interface ElementDragActions {
  /** The board registers how to find its tiles; returns an unregister. */
  registerTileHitTest: (hitTest: TileHitTest) => () => void;
  tileAt: TileHitTest;
  /** Highlight the tile a held piece would land on (null: none). */
  setDropTarget: (tileId: string | null) => void;
}

export const DropTargetContext = createContext<string | null>(null);
export const ElementDragActionsContext =
  createContext<ElementDragActions | null>(null);

export function useDropTarget(): string | null {
  return useContext(DropTargetContext);
}

export function useElementDragActions(): ElementDragActions {
  const actions = useContext(ElementDragActionsContext);
  if (actions === null) {
    throw new Error(
      "useElementDragActions must be used inside <ElementDragProvider>",
    );
  }
  return actions;
}
