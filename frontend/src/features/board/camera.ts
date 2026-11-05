import type { Point3 } from "./geometry.ts";

// Slightly wider than the island, so a thin rim of sea shows around it.
export const SEA_RADIUS = 2.8;

export const VIEW_ANGLE_FROM_VERTICAL = (40 * Math.PI) / 180;

// Narrow on purpose: less perspective, so the near edge of the board doesn't balloon.
export const CAMERA_FOV = 35;

const FRAME_MARGIN = 1.03;

/**
 * How far the camera must be from the board centre so the whole sea disc fits
 * a canvas with this aspect ratio (width / height).
 *
 * Seen from the camera, the disc is its full radius wide but only
 * radius * cos(angle) tall, because it's tilted away. Its near edge is also
 * radius * sin(angle) closer to the camera, so it looks bigger: adding that
 * amount to the distance keeps the near edge inside the frame.
 */
export function fitDistance(aspect: number, fovDegrees = CAMERA_FOV): number {
  const tanHalfVertical = Math.tan((fovDegrees * Math.PI) / 360);
  const tanHalfHorizontal = tanHalfVertical * aspect;

  const forWidth = SEA_RADIUS / tanHalfHorizontal;
  const forHeight =
    (SEA_RADIUS * Math.cos(VIEW_ANGLE_FROM_VERTICAL)) / tanHalfVertical;
  const nearEdge = SEA_RADIUS * Math.sin(VIEW_ANGLE_FROM_VERTICAL);

  return FRAME_MARGIN * (Math.max(forWidth, forHeight) + nearEdge);
}

export function cameraPosition(distance: number): Point3 {
  return [
    0,
    distance * Math.cos(VIEW_ANGLE_FROM_VERTICAL),
    distance * Math.sin(VIEW_ANGLE_FROM_VERTICAL),
  ];
}
