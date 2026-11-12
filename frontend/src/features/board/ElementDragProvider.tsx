import { type ReactNode, useMemo, useRef, useState } from "react";
import {
  DropTargetContext,
  type ElementDragActions,
  ElementDragActionsContext,
  type TileHitTest,
} from "./elementDrag.ts";

export function ElementDragProvider({ children }: { children: ReactNode }) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const hitTest = useRef<TileHitTest | null>(null);

  const actions = useMemo<ElementDragActions>(
    () => ({
      registerTileHitTest: (registered) => {
        hitTest.current = registered;
        return () => {
          if (hitTest.current === registered) hitTest.current = null;
        };
      },
      tileAt: (clientX, clientY) => hitTest.current?.(clientX, clientY) ?? null,
      setDropTarget,
    }),
    [],
  );

  return (
    <ElementDragActionsContext value={actions}>
      <DropTargetContext value={dropTarget}>{children}</DropTargetContext>
    </ElementDragActionsContext>
  );
}
