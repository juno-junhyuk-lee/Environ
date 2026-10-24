import { HEX_SIZE } from "./board.ts";
import type { Tile } from "./board.ts";

// Six corners, starting at the top, form a pointy-top hexagon.
const points = Array.from({ length: 6 }, (_, index) => {
  const angle = ((60 * index - 90) * Math.PI) / 180;
  return `${String(HEX_SIZE * Math.cos(angle))},${String(HEX_SIZE * Math.sin(angle))}`;
}).join(" ");

export function HexTile({ tile }: { tile: Tile }) {
  // Convert axial coordinates to SVG positions; offset each row horizontally.
  const x = Math.sqrt(3) * HEX_SIZE * (tile.q + tile.r / 2);
  const y = 1.5 * HEX_SIZE * tile.r;

  return (
    <polygon
      className="hex-tile"
      points={points}
      transform={`translate(${String(x)}, ${String(y)})`}
    />
  );
}
