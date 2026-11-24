import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BoardProvider } from "./BoardProvider.tsx";
import { useBoard, useBoardActions } from "./boardContext.ts";
import { PlaybackControls } from "./PlaybackControls.tsx";
import { WorldControls } from "./WorldControls.tsx";
import { yearTimerPose } from "./yearTimer.ts";

const YEAR_MS = 1000;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function button(name: string): HTMLElement {
  return screen.getByRole("button", { name });
}

function WorldProbe() {
  const { year, tiles } = useBoard();
  const { placeElement } = useBoardActions();
  const center = tiles.find((tile) => tile.id === "0,0");
  return (
    <>
      <span aria-label="Year">{year}</span>
      <span aria-label="Center element">{center?.element}</span>
      <span aria-label="Center condition">{center?.conditionValue}</span>
      <button
        type="button"
        onClick={() => {
          placeElement("0,0", "forest");
        }}
      >
        Plant forest
      </button>
    </>
  );
}

function renderPlayback() {
  return render(
    <BoardProvider timeStepInterval={YEAR_MS}>
      <PlaybackControls />
      <WorldControls />
      <WorldProbe />
    </BoardProvider>,
  );
}

function passYears(count: number) {
  act(() => {
    vi.advanceTimersByTime(count * YEAR_MS);
  });
}

it("starts paused: play is available, pause is greyed out", () => {
  renderPlayback();

  expect(
    screen.getByRole("complementary", { name: "Playback" }),
  ).toBeInTheDocument();
  expect(button("Play")).toBeEnabled();
  expect(button("Pause")).toBeDisabled();
});

it("switches between playing and paused, keeping keyboard focus", () => {
  renderPlayback();

  fireEvent.click(button("Play"));
  expect(button("Play")).toBeDisabled();
  expect(button("Pause")).toBeEnabled();
  expect(button("Pause")).toHaveFocus();

  fireEvent.click(button("Pause"));
  expect(button("Pause")).toBeDisabled();
  expect(button("Play")).toBeEnabled();
  expect(button("Play")).toHaveFocus();
});

it("shows icons only, named for screen readers", () => {
  renderPlayback();

  for (const name of ["Play", "Pause"]) {
    expect(button(name).textContent).toBe("");
    expect(button(name).querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  }
});

it("passes one year per interval while playing, and none while paused", () => {
  renderPlayback();
  const year = () => screen.getByLabelText("Year").textContent;

  passYears(3);
  expect(year()).toBe("0");

  fireEvent.click(button("Play"));
  passYears(3);
  expect(year()).toBe("3");

  fireEvent.click(button("Pause"));
  passYears(5);
  expect(year()).toBe("3");

  fireEvent.click(button("Play"));
  passYears(1);
  expect(year()).toBe("4");
});

it("changes tile conditions as years pass", () => {
  renderPlayback();
  const before = screen.getByLabelText("Center condition").textContent;

  fireEvent.click(button("Play"));
  passYears(5);

  expect(screen.getByLabelText("Center condition").textContent).not.toBe(
    before,
  );
});

it("accepts placements while running, without pausing", () => {
  renderPlayback();
  fireEvent.click(button("Play"));
  passYears(2);

  fireEvent.click(button("Plant forest"));
  expect(screen.getByLabelText("Center element")).toHaveTextContent("forest");
  expect(button("Pause")).toBeEnabled();

  // The placed forest joins the next yearly step.
  passYears(1);
  expect(screen.getByLabelText("Year")).toHaveTextContent("3");
  expect(screen.getByLabelText("Center element")).toHaveTextContent("forest");
});

it("shows the year timer only while playing", () => {
  const { container } = renderPlayback();
  const timer = container.querySelector(".year-timer");

  expect(timer).not.toHaveClass("is-running");
  expect(timer).toHaveAttribute("aria-hidden", "true");

  fireEvent.click(button("Play"));
  expect(timer).toHaveClass("is-running");

  fireEvent.click(button("Pause"));
  expect(timer).not.toHaveClass("is-running");
});

it("draws the year timer from the clock, restarting with each year", () => {
  const { container } = renderPlayback();
  // How full the bar is drawn (its vertical scale).
  const fill = () =>
    Number(
      container
        .querySelector<HTMLElement>(".year-timer-fill")
        ?.style.scale.split(" ")[1],
    );
  // Frames land every ~16 ms, so the last one drawn may trail by one frame.
  const oneFrame = 16 / YEAR_MS;
  const expectFillNear = (progress: number) => {
    expect(fill()).toBeLessThanOrEqual(yearTimerPose(progress).fill);
    expect(fill()).toBeGreaterThanOrEqual(
      yearTimerPose(progress - oneFrame).fill,
    );
  };

  fireEvent.click(button("Play"));
  act(() => {
    vi.advanceTimersByTime(YEAR_MS / 2);
  });
  expectFillNear(0.5);

  // Into the next year: the bar has started again from near empty.
  act(() => {
    vi.advanceTimersByTime(YEAR_MS / 2 + 100);
  });
  expect(screen.getByLabelText("Year")).toHaveTextContent("1");
  expectFillNear(0.1);
});

it("locks reset and load while running, and unlocks them on pause", () => {
  renderPlayback();

  fireEvent.click(button("Play"));
  expect(button("Reset world")).toBeDisabled();
  expect(button("Upload world")).toBeDisabled();
  expect(button("Save world")).toBeEnabled();
  expect(screen.getByLabelText("World save file")).toBeDisabled();

  fireEvent.click(button("Pause"));
  expect(button("Reset world")).toBeEnabled();
  expect(button("Upload world")).toBeEnabled();
  expect(screen.getByLabelText("World save file")).toBeEnabled();
});
