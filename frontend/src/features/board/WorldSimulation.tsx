import type { Tile } from "./board.ts";
import { ELEMENT_DRAG_TYPE } from "./elementDrag.ts";
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

      <h3>Drag an element onto a board tile</h3>
      <div className="world-simulation-controls">
        {ELEMENT_BUTTONS.map(({ element, label }) => (
          <button
            key={element}
            type="button"
            className="element-button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData(ELEMENT_DRAG_TYPE, element);
            }}
          >
            <TilePreview element={element} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
