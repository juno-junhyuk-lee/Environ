import { useEffect, useRef, useState } from "react";
import { useBoard } from "../board/boardContext.ts";
import { useElementDragActions } from "../board/elementDrag.ts";
import { useLastYear } from "../board/useLastYear.ts";
import { type TileInsight, tileInsight } from "./tileInsight.ts";
import "./inspector.css";

/** Gap between the pointer and the card (px). */
const POINTER_GAP = 18;
/** Keep the card this far inside the window's edges (px). */
const EDGE_MARGIN = 8;

/** In words, as the bubble reads: "+1.2 this year", "no change this year". */
function formatChange(change: number): string {
  if (change === 0) return "no change this year";
  const sign = change > 0 ? "+" : "−";
  return `${sign}${Math.abs(change).toFixed(1)} this year`;
}

function Meter({ value }: { value: number }) {
  return (
    <span className="inspector-meter">
      <span
        className="inspector-meter-fill"
        style={{ width: `${String(Math.min(100, Math.max(0, value)))}%` }}
      />
    </span>
  );
}

function InspectorCard({ insight }: { insight: TileInsight }) {
  return (
    <>
      <strong className="inspector-name">{insight.label}</strong>
      <span className="inspector-status">{insight.status}</span>
      <dl className="inspector-stats">
        <div className="inspector-stat">
          <dt>
            <span>{insight.measure}</span>
            <span className="inspector-value">
              {insight.condition.toFixed(1)}
            </span>
          </dt>
          <dd>
            <Meter value={insight.condition} />
            {insight.change !== null && (
              <span className="inspector-change">
                {formatChange(insight.change)}
              </span>
            )}
          </dd>
        </div>
        <div className="inspector-stat">
          <dt>
            <span>Air quality</span>
            <span className="inspector-value">
              {insight.airQuality.toFixed(0)}
            </span>
          </dt>
          <dd>
            <Meter value={insight.airQuality} />
          </dd>
        </div>
      </dl>
    </>
  );
}

/**
 * Hover a board tile to see how it's doing: its condition and this year's
 * change, its air quality, and what it's next to. Follows the mouse; live
 * while the simulation runs. Hidden while a piece is carried, and for touch
 * (no hover).
 */
export function TileInspector() {
  const world = useBoard();
  const lastYear = useLastYear(world);
  const { tileAt } = useElementDragActions();
  const [hovered, setHovered] = useState<string | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  // Place the card beside the pointer, flipping to the other side near the
  // window's right or bottom edge. Written directly: no render per move.
  function placeCard() {
    const node = card.current;
    if (!node) return;
    const { x, y } = pointer.current;
    const { width, height } = node.getBoundingClientRect();
    let left = x + POINTER_GAP;
    let top = y + POINTER_GAP;
    if (left + width > window.innerWidth - EDGE_MARGIN) {
      left = x - POINTER_GAP - width;
    }
    if (top + height > window.innerHeight - EDGE_MARGIN) {
      top = y - POINTER_GAP - height;
    }
    node.style.translate = `${String(Math.max(EDGE_MARGIN, left))}px ${String(
      Math.max(EDGE_MARGIN, top),
    )}px`;
  }

  useEffect(() => {
    function onMove(event: PointerEvent) {
      // Touch has no hover; a pressed button means a piece is being carried.
      if (event.pointerType === "touch" || event.buttons !== 0) {
        setHovered(null);
        return;
      }
      pointer.current = { x: event.clientX, y: event.clientY };
      setHovered(tileAt(event.clientX, event.clientY));
      placeCard();
    }
    function hide() {
      setHovered(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", hide);
    window.addEventListener("blur", hide);
    document.documentElement.addEventListener("pointerleave", hide);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", hide);
      window.removeEventListener("blur", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, [tileAt]);

  const insight =
    hovered === null ? null : tileInsight(world, hovered, lastYear);

  // The card's size changes with its content, so re-place it after each
  // render that shows it.
  useEffect(() => {
    if (insight !== null) placeCard();
  });

  return (
    <div
      ref={card}
      className={insight ? "inspector is-open" : "inspector"}
      data-element={insight?.element}
      // The board is a single image to screen readers; this hover detail is
      // a mouse convenience on top of it.
      aria-hidden="true"
    >
      {insight && <InspectorCard insight={insight} />}
    </div>
  );
}
