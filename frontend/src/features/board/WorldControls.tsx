import { type ChangeEvent, useRef, useState } from "react";
import { exportWorldToFile, importWorldFromFile } from "../../world/index.ts";
import { useBoard, useBoardActions } from "./boardContext.ts";

export function WorldControls() {
  const world = useBoard();
  const { resetWorld, loadWorld } = useBoardActions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  function handleSave() {
    try {
      exportWorldToFile(world.year, world);
      setFeedback({ text: "World exported.", error: false });
    } catch {
      setFeedback({
        text: "The world could not be saved. Try again.",
        error: true,
      });
    }
  }

  async function handleLoad(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const result = await importWorldFromFile(file);
      if (result.ok) {
        loadWorld(result.save);
        setFeedback({ text: "World loaded.", error: false });
      } else {
        setFeedback({ text: result.error, error: true });
      }
    } catch {
      setFeedback({
        text: "The file could not be loaded. Try again.",
        error: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="world-controls">
      <p>Year {world.year}</p>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          resetWorld();
          setFeedback(null);
        }}
      >
        Reset world
      </button>
      <button type="button" disabled={isLoading} onClick={handleSave}>
        Save world
      </button>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        {isLoading ? "Loading…" : "Load world"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        aria-label="World save file"
        hidden
        disabled={isLoading}
        onChange={(event) => {
          void handleLoad(event);
        }}
      />
      {feedback && (
        <p
          className="world-feedback"
          role={feedback.error ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
