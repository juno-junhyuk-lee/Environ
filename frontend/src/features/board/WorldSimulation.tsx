import type { Tile } from "./board.ts";
import { TilePreview } from "./TilePreview.tsx";

const ELEMENT_BUTTONS: readonly { element: Tile["element"]; label: string }[] =
  [
    { element: "forest", label: "Forest" },
    { element: "fresh_water_body", label: "Fresh Water Body" },
    { element: "human_settlement", label: "Human Settlement" },
  ];

export function WorldSimulation() {
  return (
    <section>
      <h2>Simulation</h2>
      <div className="world-simulation-controls">
        <button type="button">Start</button>
        <button type="button">Pause</button>
        <button type="button">Resume</button>
      </div>

      <h3>Tap and drag a tile to the board</h3>
      <div className="world-simulation-controls">
        {ELEMENT_BUTTONS.map(({ element, label }) => (
          <button key={element} type="button" className="element-button">
            <TilePreview element={element} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
