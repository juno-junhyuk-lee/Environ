import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Group, Raycaster, Vector2 } from "three";
import { useBoard } from "./boardContext.ts";
import { SEA_RADIUS } from "./camera.ts";
import {
  type TileHitTest,
  useDropTarget,
  useElementDragActions,
} from "./elementDrag.ts";
import { Tile3D } from "./Tile3D.tsx";

function Lights() {
  return (
    <>
      <hemisphereLight args={["#ffffff", "#8fb39a", 1.4]} />
      <directionalLight
        position={[4, 8, 3]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
    </>
  );
}

// Darker than the kit's lake tiles, so lakes never blend into the sea.
const SEA_COLOR = "#4f87ad";

function Sea() {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow>
      <circleGeometry args={[SEA_RADIUS, 64]} />
      <meshStandardMaterial color={SEA_COLOR} />
    </mesh>
  );
}

export function BoardScene() {
  const { tiles } = useBoard();
  const { registerTileHitTest } = useElementDragActions();
  const dropTarget = useDropTarget();
  const getSceneState = useThree((state) => state.get);
  const tileGroup = useRef<Group>(null);

  useEffect(() => {
    const canvas = getSceneState().gl.domElement;
    const raycaster = new Raycaster();
    const pointer = new Vector2();

    const tileAt: TileHitTest = (clientX, clientY) => {
      const group = tileGroup.current;
      if (!group) return null;
      // Only tiles you can see: not under the elements pane or off the canvas.
      if (document.elementFromPoint(clientX, clientY) !== canvas) return null;

      const { left, top, width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return null;
      pointer.set(
        ((clientX - left) / width) * 2 - 1,
        1 - ((clientY - top) / height) * 2,
      );
      raycaster.setFromCamera(pointer, getSceneState().camera);

      const models = group.children.flatMap(
        (tile) => tile.getObjectByName("tile-model") ?? [],
      );
      let target = raycaster.intersectObjects(models)[0]?.object;
      while (target && target.parent !== group) {
        target = target.parent ?? undefined;
      }
      return target ? target.name.slice("tile-".length) : null;
    };

    return registerTileHitTest(tileAt);
  }, [getSceneState, registerTileHitTest]);

  return (
    <>
      <Lights />
      <Sea />
      <group ref={tileGroup} name="tiles">
        {tiles.map((tile) => (
          <Tile3D
            key={tile.id}
            tile={tile}
            isDropTarget={tile.id === dropTarget}
          />
        ))}
      </group>
    </>
  );
}
