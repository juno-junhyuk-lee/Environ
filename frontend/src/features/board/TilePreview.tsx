import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { Tile } from "./board.ts";
import { Tile3D } from "./Tile3D.tsx";

interface TilePreviewProps {
  element: Tile["element"];
}

export function TilePreview({ element }: TilePreviewProps) {
  const previewTile: Tile = {
    id: `preview-${element}`,
    q: 0,
    r: 0,
    element,
    conditionValue: 50,
  };

  return (
    <div className="tile-preview" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, 1.6, 1.8], fov: 40 }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <Tile3D tile={previewTile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
