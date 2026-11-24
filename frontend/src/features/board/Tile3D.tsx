import { Line, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { Group, Mesh, Object3D } from "three";
import type { Tile } from "./board.ts";
import {
  desaturatable,
  type SaturationUniform,
  saturationFor,
} from "./conditionColour.ts";
import { axialToWorld, hexOutline } from "./geometry.ts";
import { HOP_DURATION, hopPose } from "./hop.ts";
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

// A yearly change in condition fades in over about a second.
const FADE_RESPONSE = 3;

// Longest frame the hop steps over, so a hitch doesn't skip the animation.
const MAX_HOP_FRAME = 1 / 30;

/**
 * Plays the conversion hop (see hop.ts) each time `active` turns on. Once
 * started it runs to the end, even if `active` turns off first.
 */
function Hop({ active, children }: { active: boolean; children: ReactNode }) {
  const group = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const instant = useMemo(() => prefersReducedMotion(), []);
  // Seconds into the hop; null when resting.
  const elapsed = useRef<number | null>(null);
  const wasActive = useRef(false);

  useEffect(() => {
    invalidate();
  }, [active, invalidate]);

  useFrame((_, delta) => {
    const hop = group.current;
    if (!hop) return;
    if (active && !wasActive.current && !instant) elapsed.current = 0;
    wasActive.current = active;
    if (elapsed.current === null) return;

    elapsed.current += Math.min(delta, MAX_HOP_FRAME);
    const progress = elapsed.current / HOP_DURATION;
    const { y, spin } = hopPose(progress);
    hop.position.y = y;
    hop.rotation.y = spin;
    if (progress >= 1) {
      elapsed.current = null;
    } else {
      invalidate();
    }
  });

  return (
    <group ref={group} name="tile-hop">
      {children}
    </group>
  );
}

function isMesh(object: Object3D): object is Mesh {
  return "isMesh" in object && object.isMesh === true;
}

/**
 * Kept on the model's `userData`: how grey this tile's materials are (see
 * conditionColour.ts). `settled: false` makes the first frame snap to the
 * tile's colour instead of fading in from full colour.
 */
type TileSaturation = SaturationUniform & { settled: boolean };

const SATURATION_KEY = "saturation";

// useGLTF caches one scene per URL, but a three.js object can only sit in one
// place in the scene, so every tile needs its own copy. Materials are copied
// too (scene.clone() shares them), so each tile can fade on its own.
function useTileModelCopy(url: string): Object3D {
  const { scene } = useGLTF(url);

  const model = useMemo(() => {
    const saturation: TileSaturation = { value: 1, settled: false };
    const copy = scene.clone();
    copy.userData = { ...copy.userData, [SATURATION_KEY]: saturation };
    copy.traverse((child) => {
      if (isMesh(child)) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = Array.isArray(child.material)
          ? child.material.map((m) => desaturatable(m, saturation))
          : desaturatable(child.material, saturation);
      }
    });
    return copy;
  }, [scene]);

  // The copied materials are this tile's alone; the texture stays shared.
  useEffect(
    () => () => {
      model.traverse((child) => {
        if (!isMesh(child)) return;
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const material of materials) material.dispose();
      });
    },
    [model],
  );

  return model;
}

/**
 * Fades a tile's model toward the colour its condition calls for. Attach the
 * returned ref to the model.
 */
function useConditionColour(condition: number): RefObject<Object3D | null> {
  const model = useRef<Object3D>(null);
  const instant = useMemo(() => prefersReducedMotion(), []);

  useFrame((_, delta) => {
    const saturation = model.current?.userData[SATURATION_KEY] as
      TileSaturation | undefined;
    if (!saturation) return;
    const target = saturationFor(condition);
    if (!saturation.settled) {
      saturation.value = target;
      saturation.settled = true;
      return;
    }
    saturation.value +=
      (target - saturation.value) * easeStep(delta, FADE_RESPONSE, instant);
    if (Math.abs(target - saturation.value) < SETTLED) {
      saturation.value = target;
    }
  });

  return model;
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
  /**
   * Just turned into another element over a yearly step: hops (jump, spin,
   * bounce) with the same highlighted border as a drop target.
   */
  isConverting?: boolean;
  /**
   * Grey the tile out as its condition falls. Off for the palette's
   * previews, which show each element at its best.
   */
  showCondition?: boolean;
}

export function Tile3D({
  tile,
  isDropTarget = false,
  isConverting = false,
  showCondition = true,
}: Tile3DProps) {
  const highlighted = isDropTarget || isConverting;
  const {
    url,
    surfaceHeight,
    heightScale = 1,
    hasRipples = false,
  } = ELEMENT_MODELS[tile.element];
  const model = useTileModelCopy(url);
  const modelRef = useConditionColour(
    showCondition ? tile.conditionValue : 100,
  );
  const outline = useMemo(
    () => hexOutline(surfaceHeight + OUTLINE_ABOVE_GROUND),
    [surfaceHeight],
  );

  return (
    <group name={`tile-${tile.id}`} position={axialToWorld(tile.q, tile.r)}>
      <Pop raised={isDropTarget}>
        <Hop active={isConverting}>
          <primitive
            key={url}
            ref={modelRef}
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
            color={highlighted ? TARGET_OUTLINE_COLOR : OUTLINE_COLOR}
            lineWidth={highlighted ? TARGET_OUTLINE_WIDTH : OUTLINE_WIDTH}
          />
        </Hop>
      </Pop>
    </group>
  );
}
