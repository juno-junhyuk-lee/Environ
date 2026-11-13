import type { Point3 } from "./geometry.ts";

// Slightly wider than the island, so a thin rim of sea shows around it.
export const SEA_RADIUS = 2.8;

export const VIEW_ANGLE_FROM_VERTICAL = (40 * Math.PI) / 180;

// Narrow on purpose: less perspective, so the near edge of the board doesn't balloon.
export const CAMERA_FOV = 35;

const FRAME_MARGIN = 1.03;

/**
 * How far the camera must be from the board centre so the whole sea disc fits
 * a canvas with this aspect ratio (width / height), with FRAME_MARGIN to spare.
 *
 * With the camera at distance d and angle a from vertical, a point on the sea
 * at depth z (towards the camera) is d - z sin(a) away and z cos(a) off
 * centre vertically. So:
 * - Height: the near edge (z = r) is the tightest; it needs
 *   d >= r cos(a) / tan(halfFovV) + r sin(a).
 * - Width: the disc looks widest a little in front of its centre, at
 *   z = r^2 sin(a) / d, where it spans r / sqrt(d^2 - (r sin(a))^2); so
 *   d >= sqrt((r / tan(halfFovH))^2 + (r sin(a))^2).
 */
export function fitDistance(aspect: number, fovDegrees = CAMERA_FOV): number {
  const tanHalfVertical = Math.tan((fovDegrees * Math.PI) / 360);
  const tanHalfHorizontal = tanHalfVertical * aspect;
  const sin = Math.sin(VIEW_ANGLE_FROM_VERTICAL);
  const cos = Math.cos(VIEW_ANGLE_FROM_VERTICAL);
  const r = SEA_RADIUS;

  const forHeight = (FRAME_MARGIN * r * cos) / tanHalfVertical + r * sin;
  const forWidth = Math.hypot((FRAME_MARGIN * r) / tanHalfHorizontal, r * sin);

  return Math.max(forWidth, forHeight);
}

/**
 * How far to shift the view up, as a fraction of the canvas height, so the
 * sea sits in the middle of the canvas vertically. Seen at an angle, its far
 * edge looks smaller than its near edge, so with the camera aimed at its
 * centre it sits low, with extra sky above. (For THREE's setViewOffset.)
 */
export function centringOffset(
  distance: number,
  fovDegrees = CAMERA_FOV,
): number {
  const tanHalfVertical = Math.tan((fovDegrees * Math.PI) / 360);
  const sin = Math.sin(VIEW_ANGLE_FROM_VERTICAL);
  const cos = Math.cos(VIEW_ANGLE_FROM_VERTICAL);
  const r = SEA_RADIUS;

  // How far the near and far edges reach from the middle, in half-heights.
  const nearEdge = (r * cos) / (distance - r * sin) / tanHalfVertical;
  const farEdge = (r * cos) / (distance + r * sin) / tanHalfVertical;
  // Moving up by half the difference evens them out; a half-height is half
  // the canvas.
  return (nearEdge - farEdge) / 4;
}

/**
 * Canvas width / height at which the sea fits both ways at once, so no sky is
 * left beside it. The board's canvas uses this ratio (board.css).
 */
export const SEA_ASPECT = 1.06;

export function cameraPosition(distance: number): Point3 {
  return [
    0,
    distance * Math.cos(VIEW_ANGLE_FROM_VERTICAL),
    distance * Math.sin(VIEW_ANGLE_FROM_VERTICAL),
  ];
}
