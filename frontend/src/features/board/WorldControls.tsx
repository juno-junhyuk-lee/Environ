import { useBoard, useBoardActions } from "./boardContext.ts";

export function WorldControls() {
  const { year } = useBoard();
  const { resetWorld } = useBoardActions();

  return (
    <div className="world-controls">
      <p>Year {year}</p>
      <button type="button" onClick={resetWorld}>
        Reset world
      </button>
    </div>
  );
}
