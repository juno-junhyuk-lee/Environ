import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { BufferGeometry, Mesh, MeshBasicMaterial } from "three";
import { prefersReducedMotion } from "./motion.ts";
import {
  RIPPLE_PERIOD_SECONDS,
  RIPPLE_SPOTS,
  rippleAt,
  ripplePhase,
} from "./ripples.ts";

type Ring = Mesh<BufferGeometry, MeshBasicMaterial>;

const STILL_CYCLE = 0.5;
const ABOVE_WATER = 0.002;

interface WaterRipplesProps {
  surfaceHeight: number;
  seed: number;
}

/** Cartoon rings that grow and fade on top of a lake tile. */
export function WaterRipples({ surfaceHeight, seed }: WaterRipplesProps) {
  const rings = useRef<(Ring | null)[]>([]);
  const elapsedSeconds = useRef(0);
  const animate = useMemo(() => !prefersReducedMotion(), []);

  useFrame((_, delta) => {
    if (animate) {
      elapsedSeconds.current += delta;
    }
    const cycle = animate
      ? elapsedSeconds.current / RIPPLE_PERIOD_SECONDS
      : STILL_CYCLE;

    rings.current.forEach((ring, index) => {
      const spot = RIPPLE_SPOTS[index];
      if (!ring || !spot) return;
      const { radius, opacity } = rippleAt(
        ripplePhase(cycle, spot.delay, seed),
      );
      ring.scale.setScalar(radius);
      ring.material.opacity = opacity;
    });
  });

  return (
    <group name="water-ripples" position-y={surfaceHeight + ABOVE_WATER}>
      {RIPPLE_SPOTS.map((spot, index) => (
        <mesh
          key={`${String(spot.x)},${String(spot.z)}`}
          name="water-ripple"
          ref={(ring: Ring | null) => {
            rings.current[index] = ring;
          }}
          position={[spot.x, 0, spot.z]}
          rotation-x={-Math.PI / 2}
          scale={0.001}
        >
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
