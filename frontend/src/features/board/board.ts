export interface Tile {
  id: string;
  // q = axial column; r = axial row.
  q: number;
  r: number;
}

// HEX_SIZE = distance from a tile's center to a corner.
export const HEX_SIZE = 50;

export function createBoard(): Tile[] {
  const radius = 2; // Two rings around the center give 19 tiles.
  const tiles: Tile[] = [];

  for (let r = -radius; r <= radius; r += 1) {
    // Limit each row to the hexagonal outline: 3, 4, 5, 4, 3.
    const firstQ = Math.max(-radius, -r - radius);
    const lastQ = Math.min(radius, -r + radius);

    for (let q = firstQ; q <= lastQ; q += 1) {
      tiles.push({ id: `${String(q)},${String(r)}`, q, r });
    }
  }

  return tiles;
}
