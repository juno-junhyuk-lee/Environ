import { useBoard } from "./boardContext.ts";
import { SEA_RADIUS } from "./camera.ts";
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

  return (
    <>
      <Lights />
      <Sea />
      <group name="tiles">
        {tiles.map((tile) => (
          <Tile3D key={tile.id} tile={tile} />
        ))}
      </group>
    </>
  );
}
