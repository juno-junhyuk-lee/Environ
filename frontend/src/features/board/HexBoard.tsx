import { createBoard, HEX_SIZE } from "./board.ts";
import { HexTile } from "./HexTile.tsx";
import "./board.css";

const tiles = createBoard();
// Board bounds plus padding to keep border strokes inside the viewBox.
const width = Math.sqrt(3) * HEX_SIZE * 5 + 4;
const height = HEX_SIZE * 8 + 4;

export function HexBoard() {
  return (
    <svg
      className="hex-board"
      viewBox={`${String(-width / 2)} ${String(-height / 2)} ${String(width)} ${String(height)}`}
      role="img"
      aria-labelledby="board-title"
    >
      <title id="board-title">
        19 hexagonal tiles arranged in five rows of 3, 4, 5, 4, and 3
      </title>
      {tiles.map((tile) => (
        <HexTile key={tile.id} tile={tile} />
      ))}
    </svg>
  );
}
