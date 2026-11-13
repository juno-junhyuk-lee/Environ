import { Html } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect } from "react";
import { PerspectiveCamera } from "three";
import { BoardScene } from "./BoardScene.tsx";
import {
  CAMERA_FOV,
  cameraPosition,
  centringOffset,
  fitDistance,
} from "./camera.ts";
import "./board.css";

/**
 * Fixed view (no controls) that re-frames the board whenever the canvas
 * resizes, with the sea centred vertically.
 */
export function CameraFit() {
  const camera = useThree((state) => state.camera);
  const { width, height } = useThree((state) => state.size);
  const distance = fitDistance(height > 0 ? width / height : 1);

  useLayoutEffect(() => {
    camera.position.set(...cameraPosition(distance));
    camera.lookAt(0, 0, 0);
    if (camera instanceof PerspectiveCamera && width > 0 && height > 0) {
      // Pass the canvas's real size: setViewOffset also sets the camera's
      // aspect from it, and anything else would stretch the board sideways.
      const shift = centringOffset(distance) * height;
      camera.setViewOffset(width, height, 0, shift, width, height);
    }
  }, [camera, distance, width, height]);

  return null;
}

export function Board3D() {
  return (
    <div
      className="board-3d"
      role="img"
      aria-label="3D island of 19 hexagonal tiles in rows of 3, 4, 5, 4 and 3"
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: cameraPosition(fitDistance(1)), fov: CAMERA_FOV }}
      >
        <Suspense
          fallback={
            <Html center>
              <p className="board-loading">Loading board...</p>
            </Html>
          }
        >
          <BoardScene />
        </Suspense>
        <CameraFit />
      </Canvas>
    </div>
  );
}
