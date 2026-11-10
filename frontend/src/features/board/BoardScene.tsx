import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Group, Raycaster, Vector2 } from "three";
import { isElementName } from "../../world/index.ts";
import { useBoard, useBoardActions } from "./boardContext.ts";
import { SEA_RADIUS } from "./camera.ts";
import { ELEMENT_DRAG_TYPE } from "./elementDrag.ts";
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
  const { placeElement } = useBoardActions();
  const getSceneState = useThree((state) => state.get);
  const tileGroup = useRef<Group>(null);

  useEffect(() => {
    const canvas = getSceneState().gl.domElement;
    const raycaster = new Raycaster();

    function allowDrop(event: DragEvent) {
      if (event.dataTransfer?.types.includes(ELEMENT_DRAG_TYPE)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }
    }

    function dropElement(event: DragEvent) {
      const element = event.dataTransfer?.getData(ELEMENT_DRAG_TYPE);
      const group = tileGroup.current;
      if (!element || !isElementName(element) || !group) return;
      event.preventDefault();

      const { left, top, width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const pointer = new Vector2(
        ((event.clientX - left) / width) * 2 - 1,
        1 - ((event.clientY - top) / height) * 2,
      );
      raycaster.setFromCamera(pointer, getSceneState().camera);

      const models = group.children.flatMap((tile) =>
        tile.children.filter((child) => child.name === "tile-model"),
      );
      let target = raycaster.intersectObjects(models)[0]?.object;
      while (target && target.parent !== group) {
        target = target.parent ?? undefined;
      }
      if (target) {
        placeElement(target.name.slice("tile-".length), element);
      }
    }

    canvas.addEventListener("dragover", allowDrop);
    canvas.addEventListener("drop", dropElement);
    return () => {
      canvas.removeEventListener("dragover", allowDrop);
      canvas.removeEventListener("drop", dropElement);
    };
  }, [getSceneState, placeElement]);

  return (
    <>
      <Lights />
      <Sea />
      <group ref={tileGroup} name="tiles">
        {tiles.map((tile) => (
          <Tile3D key={tile.id} tile={tile} />
        ))}
      </group>
    </>
  );
}
