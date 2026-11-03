import { Line, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { Mesh, Object3D } from "three";
import type { Tile } from "./board.ts";
import { axialToWorld, hexOutline } from "./geometry.ts";
import { ELEMENT_MODELS } from "./models.ts";
import { rippleSeed } from "./ripples.ts";
import { WaterRipples } from "./WaterRipples.tsx";

// Preload every model so swapping a tile's element never waits on the network.
for (const model of Object.values(ELEMENT_MODELS)) {
  useGLTF.preload(model.url);
}

const OUTLINE_ABOVE_GROUND = 0.003;

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

export function Tile3D({ tile }: { tile: Tile }) {
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
        color="#2f4f36"
        lineWidth={2.5}
      />
    </group>
  );
}
