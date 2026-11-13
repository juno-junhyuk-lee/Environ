import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { exportWorldToFile, importWorldFromFile } from "../../world/index.ts";
import { useBoard, useBoardActions } from "./boardContext.ts";

const ICON_DIR = `${import.meta.env.BASE_URL}icons/`;

/** Success messages fade out after this; errors stay until the next action. */
const STATUS_VISIBLE_MS = 3000;

interface Feedback {
  text: string;
  error: boolean;
}

interface IconButtonProps {
  label: string;
  icon: string;
  disabled: boolean;
  onClick: () => void;
}

/**
 * Icon only. On hover or keyboard focus its label pops up in a comic speech
 * bubble centred below the row of icons; screen readers get the same label
 * as its name.
 */
function IconButton({ label, icon, disabled, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      className="world-control"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <img src={`${ICON_DIR}${icon}`} alt="" width={28} height={28} />
      <span className="speech-bubble" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}

/** Reset, save and load the world: a row of icons tucked into the header. */
export function WorldControls() {
  const world = useBoard();
  const { resetWorld, loadWorld } = useBoardActions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (feedback === null || feedback.error) return;
    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, STATUS_VISIBLE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [feedback]);

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
      {feedback && (
        <p
          className={
            feedback.error ? "world-feedback is-error" : "world-feedback"
          }
          role={feedback.error ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      )}
      {/* The bubbles centre on this row, so they all pop up in one spot. */}
      <div className="world-control-row">
        <IconButton
          label="Reset world"
          icon="reset.png"
          disabled={isLoading}
          onClick={() => {
            resetWorld();
            setFeedback(null);
          }}
        />
        <IconButton
          label="Save world"
          icon="save.png"
          disabled={isLoading}
          onClick={handleSave}
        />
        <IconButton
          label={isLoading ? "Loading…" : "Upload world"}
          icon="load.png"
          disabled={isLoading}
          onClick={() => {
            inputRef.current?.click();
          }}
        />
      </div>
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
    </div>
  );
}
