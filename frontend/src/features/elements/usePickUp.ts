import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ElementName } from "../../world/index.ts";
import { useBoardActions } from "../board/boardContext.ts";
import { useElementDragActions } from "../board/elementDrag.ts";
import { prefersReducedMotion } from "../board/motion.ts";

/** A press only picks the piece up once it moves this far (px). */
const PICK_UP_DISTANCE = 4;
/** In case `transitionend` never fires; longer than the CSS transitions. */
const SETTLE_FALLBACK_MS = 400;
/** Set on <html> while holding, for the grabbing cursor everywhere. */
export const HOLDING_CLASS = "is-holding-element";

/**
 * What the held piece is doing, set on it as `data-phase` (no attribute: not
 * shown). Set directly on the element, not through React, so a phase and the
 * position it animates to always change together.
 */
type PiecePhase = "holding" | "placing" | "returning";

interface PickUpOptions {
  /** A piece left its slot. */
  onPickUp?: () => void;
  /** The piece landed or went back; the slot is filled again. */
  onSettled?: (element: ElementName, placed: boolean) => void;
}

export interface PickUp {
  /** The element whose slot is empty because its piece is out. */
  held: ElementName | null;
  /** The element the floating piece shows (kept after it settles). */
  pieceElement: ElementName;
  /** The floating piece: a fixed-position box the size of a slot's icon. */
  pieceRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (
    element: ElementName,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
}

/**
 * Pick a piece up from its slot, carry it over the board and put it down on
 * a tile. Dropped anywhere else, it goes back to its slot.
 */
export function usePickUp(
  firstElement: ElementName,
  { onPickUp, onSettled }: PickUpOptions = {},
): PickUp {
  const { tileAt, setDropTarget } = useElementDragActions();
  const { placeElement } = useBoardActions();
  const [held, setHeld] = useState<ElementName | null>(null);
  const [pieceElement, setPieceElement] = useState(firstElement);
  const pieceRef = useRef<HTMLDivElement>(null);
  // Tears down the press or hold in progress; null when idle.
  const stopActive = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      stopActive.current?.();
    },
    [],
  );

  function onPointerDown(
    element: ElementName,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (event.button !== 0 || !event.isPrimary || stopActive.current) return;

    const source = event.currentTarget;
    const { pointerId } = event;
    const start = { x: event.clientX, y: event.clientY };
    // Where in the piece it was grabbed; null until it's picked up.
    let grab: { x: number; y: number } | null = null;
    let target: string | null = null;
    let settleTimer: number | undefined;
    let stopWaitingToSettle: (() => void) | undefined;

    // Swap the floating piece's model now, so it's ready when it appears.
    setPieceElement(element);
    source.setPointerCapture(pointerId);

    function setPhase(phase: PiecePhase | null) {
      const piece = pieceRef.current;
      if (!piece) return;
      if (phase === null) delete piece.dataset.phase;
      else piece.dataset.phase = phase;
    }

    function placePieceAt(left: number, top: number) {
      pieceRef.current?.style.setProperty(
        "translate",
        `${String(left)}px ${String(top)}px`,
      );
    }

    function setTarget(next: string | null) {
      if (next === target) return;
      target = next;
      setDropTarget(next);
      pieceRef.current?.classList.toggle("is-over-tile", next !== null);
    }

    function pickUp() {
      const piece = pieceRef.current;
      const rect = source.getBoundingClientRect();
      grab = { x: start.x - rect.left, y: start.y - rect.top };
      if (piece) {
        piece.style.width = `${String(rect.width)}px`;
        piece.style.height = `${String(rect.height)}px`;
        piece.style.transformOrigin = `${String(grab.x)}px ${String(grab.y)}px`;
      }
      placePieceAt(rect.left, rect.top);
      setPhase("holding");
      document.documentElement.classList.add(HOLDING_CLASS);
      setHeld(element);
      onPickUp?.();
    }

    function onMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      const { clientX: x, clientY: y } = moveEvent;
      if (!grab) {
        if (Math.hypot(x - start.x, y - start.y) < PICK_UP_DISTANCE) return;
        pickUp();
      }
      if (!grab) return;
      placePieceAt(x - grab.x, y - grab.y);
      setTarget(tileAt(x, y));
    }

    function onUp(upEvent: PointerEvent) {
      if (upEvent.pointerId !== pointerId) return;
      if (!grab) {
        stop(); // A click, not a pick-up.
        return;
      }
      const tileId = tileAt(upEvent.clientX, upEvent.clientY);
      if (tileId === null) {
        putBack();
      } else {
        placeElement(tileId, element);
        settle("placing");
      }
    }

    function onCancel(cancelEvent: PointerEvent) {
      if (cancelEvent.pointerId === pointerId) cancel();
    }

    function onKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") cancel();
    }

    function cancel() {
      if (grab) putBack();
      else stop();
    }

    function putBack() {
      const rect = source.getBoundingClientRect();
      settle("returning");
      placePieceAt(rect.left, rect.top);
    }

    /** Let go: animate the piece into the tile or back to its slot. */
    function settle(phase: "placing" | "returning") {
      removeListeners();
      setTarget(null);
      setPhase(phase);
      document.documentElement.classList.remove(HOLDING_CLASS);

      const placed = phase === "placing";
      const piece = pieceRef.current;
      if (!piece || prefersReducedMotion()) {
        finish(placed);
        return;
      }
      // Several properties animate; the first to end settles it.
      const done = (transitionEvent: TransitionEvent) => {
        if (transitionEvent.target === piece) finish(placed);
      };
      piece.addEventListener("transitionend", done);
      settleTimer = window.setTimeout(() => {
        finish(placed);
      }, SETTLE_FALLBACK_MS);
      stopWaitingToSettle = () => {
        piece.removeEventListener("transitionend", done);
      };
      stopActive.current = () => {
        finish(placed);
      };
    }

    function finish(placed: boolean) {
      stopWaitingToSettle?.();
      stop();
      setHeld(null);
      onSettled?.(element, placed);
    }

    function removeListeners() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", cancel);
    }

    /** Back to idle, at once. */
    function stop() {
      removeListeners();
      window.clearTimeout(settleTimer);
      setTarget(null);
      setPhase(null);
      document.documentElement.classList.remove(HOLDING_CLASS);
      if (source.hasPointerCapture(pointerId)) {
        source.releasePointerCapture(pointerId);
      }
      stopActive.current = null;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", cancel);
    stopActive.current = stop;
  }

  return { held, pieceElement, pieceRef, onPointerDown };
}
