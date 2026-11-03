export type Point3 = [number, number, number];

export const TILE_WIDTH = 1;
const TILE_CORNER_RADIUS = TILE_WIDTH / Math.sqrt(3);

export function axialToWorld(q: number, r: number): Point3 {
  const x = TILE_WIDTH * (q + r / 2);
  const z = TILE_WIDTH * r * (Math.sqrt(3) / 2);
  return [x, 0, z];
}

/** Corners of a pointy-top hex at height `y`, with the first repeated to close the loop. */
export function hexOutline(y: number): Point3[] {
  const corners: Point3[] = [];

  for (let i = 0; i <= 6; i += 1) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    corners.push([
      TILE_CORNER_RADIUS * Math.cos(angle),
      y,
      TILE_CORNER_RADIUS * Math.sin(angle),
    ]);
  }

  return corners;
}
