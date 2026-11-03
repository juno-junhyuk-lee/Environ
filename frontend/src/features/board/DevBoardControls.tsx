import { type SubmitEvent, useState } from "react";
import {
  ELEMENT_NAMES,
  ELEMENTS,
  type ElementName,
  isElementName,
} from "../../world/index.ts";
import { useBoard, useBoardActions } from "./boardContext.ts";

/** Dev-only: place elements by hand until the elements pane and drag-and-drop exist. */
export function DevBoardControls() {
  const { tiles } = useBoard();
  const { placeElement } = useBoardActions();
  const [tileId, setTileId] = useState("0,0");
  const [element, setElement] = useState<ElementName>("human_settlement");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    placeElement(tileId, element);
  }

  return (
    <form className="dev-controls" onSubmit={handleSubmit}>
      <p className="dev-controls-title">Dev: place by hand</p>
      <label>
        Tile
        <select
          value={tileId}
          onChange={(event) => {
            setTileId(event.target.value);
          }}
        >
          {tiles.map((tile) => (
            <option key={tile.id} value={tile.id}>
              {tile.id} ({ELEMENTS[tile.element].label})
            </option>
          ))}
        </select>
      </label>
      <label>
        Element
        <select
          value={element}
          onChange={(event) => {
            if (isElementName(event.target.value)) {
              setElement(event.target.value);
            }
          }}
        >
          {ELEMENT_NAMES.map((name) => (
            <option key={name} value={name}>
              {ELEMENTS[name].label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Place</button>
    </form>
  );
}
