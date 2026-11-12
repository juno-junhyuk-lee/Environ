import { Line, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import type { Group, Mesh, Object3D } from "three";
import type { Tile } from "./board.ts";
import { axialToWorld, hexOutline } from "./geometry.ts";
import { ELEMENT_MODELS } from "./models.ts";
import { easeStep, prefersReducedMotion } from "./motion.ts";
import { rippleSeed } from "./ripples.ts";
import { WaterRipples } from "./WaterRipples.tsx";

// Preload every model so swapping a tile's element never waits on the network.
for (const model of Object.values(ELEMENT_MODELS)) {
  useGLTF.preload(model.url);
}

const OUTLINE_ABOVE_GROUND = 0.003;

const OUTLINE_COLOR = "#2f4f36";
const OUTLINE_WIDTH = 2.5;
// Drop target: a bright, thicker border that reads on grass, water and town.
const TARGET_OUTLINE_COLOR = "#ffd84a";
const TARGET_OUTLINE_WIDTH = 5;

// A drop target pops up a little from its neighbours; settles in about 0.25s.
const TARGET_POP_HEIGHT = 0.1;
const POP_RESPONSE = 12;
const SETTLED = 0.0005;

function isMesh(object: Object3D): object is Mesh {
  return "isMesh" in object && object.isMesh === true;
}

// useGLTF caches one scene per URL, but a three.js object can only sit in one
// place in the scene, so every tile needs its own copy.
function useShadowedModelCopy(url: string): Object3D {
  const { scene } = useGLTF(url);

  return useMemo(() => {
    const copy = scene.clone();
    copy.traverse((child) => {
      if (isMesh(child)) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return copy;
  }, [scene]);
}

/** Eases its children up while `raised`, and back down after. */
function Pop({ raised, children }: { raised: boolean; children: ReactNode }) {
  const group = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const instant = useMemo(() => prefersReducedMotion(), []);

  // Wake on-demand canvases (the pane's previews) when the target changes.
  useEffect(() => {
    invalidate();
  }, [raised, invalidate]);

  useFrame((_, delta) => {
    const pop = group.current;
    if (!pop) return;
    const y = raised ? TARGET_POP_HEIGHT : 0;
    pop.position.y +=
      (y - pop.position.y) * easeStep(delta, POP_RESPONSE, instant);
    if (Math.abs(y - pop.position.y) < SETTLED) {
      pop.position.y = y;
    } else {
      invalidate();
    }
  });

  return (
    <group ref={group} name="tile-pop">
      {children}
    </group>
  );
}

interface Tile3DProps {
  tile: Tile;
  /** A held element would land here: highlight the border and pop it up. */
  isDropTarget?: boolean;
}

export function Tile3D({ tile, isDropTarget = false }: Tile3DProps) {
  const {
    url,
    surfaceHeight,
    heightScale = 1,
    hasRipples = false,
  } = ELEMENT_MODELS[tile.element];
  const model = useShadowedModelCopy(url);
  const outline = useMemo(
    () => hexOutline(surfaceHeight + OUTLINE_ABOVE_GROUND),
    [surfaceHeight],
  );

  return (
    <group name={`tile-${tile.id}`} position={axialToWorld(tile.q, tile.r)}>
      <Pop raised={isDropTarget}>
        <primitive
          key={url}
          object={model}
          name="tile-model"
          scale={[1, heightScale, 1]}
        />
        {hasRipples && (
          <WaterRipples
            surfaceHeight={surfaceHeight}
            seed={rippleSeed(tile.q, tile.r)}
          />
        )}
        <Line
          name="tile-outline"
          points={outline}
          color={isDropTarget ? TARGET_OUTLINE_COLOR : OUTLINE_COLOR}
          lineWidth={isDropTarget ? TARGET_OUTLINE_WIDTH : OUTLINE_WIDTH}
        />
      </Pop>
    </group>
  );
}
