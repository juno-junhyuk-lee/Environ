import { HexBoard } from "./features/board/HexBoard.tsx";
import { useState } from "react";
import { createDefaultWorld } from "./features/world/world.ts";

function App() {
  const [world, setWorld] = useState(createDefaultWorld);

  return (
    <main>
      <h1>Environ</h1>
      <p>Build a world. See how your choices shape its future.</p>
      <div className="world-controls">
        <p>Year {world.year}</p>
        <button
          type="button"
          onClick={() => {
            setWorld(createDefaultWorld());
          }}
        >
          Reset world
        </button>
      </div>
      <HexBoard tiles={world.tiles} />
      <ul className="world-legend" aria-label="World elements">
        <li>Forest (F)</li>
        <li>Fresh water body (W)</li>
        <li>Human settlement (S)</li>
      </ul>
    </main>
  );
}

export default App;
