import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, Suspense, useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import type { Tile } from "./board.ts";
import { easeStep, prefersReducedMotion } from "./motion.ts";
import { Tile3D } from "./Tile3D.tsx";

// Picked up: the tile rises a little and turns slightly towards the viewer.
const LIFT_HEIGHT = 0.12;
const LIFT_TURN = -0.35;
// Settles in about 0.6s (see easeStep).
const LIFT_RESPONSE = 5;
const SETTLED = 0.0005;

function Lift({ lifted, children }: { lifted: boolean; children: ReactNode }) {
  const group = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const instant = useMemo(() => prefersReducedMotion(), []);

  // The canvas only draws on demand, so wake it whenever the target changes.
  useEffect(() => {
    invalidate();
  }, [lifted, invalidate]);

  useFrame((_, delta) => {
    const tile = group.current;
    if (!tile) return;
    const y = lifted ? LIFT_HEIGHT : 0;
    const turn = lifted ? LIFT_TURN : 0;
    const step = easeStep(delta, LIFT_RESPONSE, instant);

    tile.position.y += (y - tile.position.y) * step;
    tile.rotation.y += (turn - tile.rotation.y) * step;

    if (
      Math.abs(y - tile.position.y) < SETTLED &&
      Math.abs(turn - tile.rotation.y) < SETTLED
    ) {
      tile.position.y = y;
      tile.rotation.y = turn;
    } else {
      invalidate();
    }
  });

  return <group ref={group}>{children}</group>;
}

interface TilePreviewProps {
  element: Tile["element"];
  /** Raise the tile, as if picked up (hover, focus or drag). */
  lifted?: boolean;
  /** Narrower values frame the tile more tightly. */
  fov?: number;
}

export function TilePreview({
  element,
  lifted = false,
  fov = 40,
}: TilePreviewProps) {
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
        camera={{ position: [0, 1.6, 1.8], fov }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0.15, 0);
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <Lift lifted={lifted}>
            <Tile3D tile={previewTile} />
          </Lift>
        </Suspense>
      </Canvas>
    </div>
  );
}
