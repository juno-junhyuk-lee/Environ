import { HEX_SIZE } from "./board.ts";
import { ELEMENT_LABELS } from "../world/world.ts";
import type { Element, WorldTile } from "../world/world.ts";

const symbols: Record<Element, string> = {
  settlement: "S",
  forest: "F",
  water: "W",
};

// Six corners, starting at the top, form a pointy-top hexagon.
const points = Array.from({ length: 6 }, (_, index) => {
  const angle = ((60 * index - 90) * Math.PI) / 180;
  return `${String(HEX_SIZE * Math.cos(angle))},${String(HEX_SIZE * Math.sin(angle))}`;
}).join(" ");

export function HexTile({ tile }: { tile: WorldTile }) {
  // Convert axial coordinates to SVG positions; offset each row horizontally.
  const x = Math.sqrt(3) * HEX_SIZE * (tile.q + tile.r / 2);
  const y = 1.5 * HEX_SIZE * tile.r;

  return (
    <g transform={`translate(${String(x)}, ${String(y)})`}>
      <title>
        {ELEMENT_LABELS[tile.element]} at {tile.id}: {tile.condition}
      </title>
      <polygon
        className={`hex-tile hex-tile--${tile.element}`}
        points={points}
      />
      <text
        className="hex-tile-label"
        textAnchor="middle"
        dy="0.35em"
        aria-hidden="true"
      >
        {symbols[tile.element]}
      </text>
    </g>
  );
}
