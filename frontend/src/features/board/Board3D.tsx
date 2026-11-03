import { Html } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect } from "react";
import { BoardScene } from "./BoardScene.tsx";
import { CAMERA_FOV, cameraPosition, fitDistance } from "./camera.ts";
import "./board.css";

/** Fixed view (no controls) that re-frames the board whenever the canvas resizes. */
function CameraFit() {
  const camera = useThree((state) => state.camera);
  const { width, height } = useThree((state) => state.size);
  const distance = fitDistance(height > 0 ? width / height : 1);

  useLayoutEffect(() => {
    camera.position.set(...cameraPosition(distance));
    camera.lookAt(0, 0, 0);
  }, [camera, distance]);

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
