import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BoardProvider } from "../board/BoardProvider.tsx";
import {
  type BoardActions,
  type SimulationState,
  useBoardActions,
  useSimulation,
} from "../board/boardContext.ts";
import { MetricsDashboard } from "./MetricsDashboard.tsx";

const YEAR_MS = 1000;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

let actions: BoardActions | undefined;
let simulation: SimulationState | undefined;
function CaptureActions() {
  const boardActions = useBoardActions();
  const state = useSimulation();
  useEffect(() => {
    actions = boardActions;
    simulation = state;
  }, [boardActions, state]);
  return null;
}

function renderDashboard() {
  render(
    <BoardProvider timeStepInterval={YEAR_MS}>
      <CaptureActions />
      <MetricsDashboard />
    </BoardProvider>,
  );
  return screen.getByRole("region", { name: "How your world is doing" });
}

function metric(region: HTMLElement, label: string): HTMLElement {
  const term = within(region).getByText(label);
  const group = term.parentElement;
  if (group === null) throw new Error(`no group for ${label}`);
  return group;
}

it("shows the starting world in plain words", () => {
  const region = renderDashboard();

  expect(metric(region, "Population")).toHaveTextContent("250");
  expect(metric(region, "Forest cover")).toHaveTextContent("16%");
  expect(metric(region, "Water quality")).toHaveTextContent("50%");
  expect(metric(region, "Temperature")).toHaveTextContent("15.0°C");
  expect(metric(region, "Carbon")).toHaveTextContent("50");
  expect(metric(region, "Weather")).toHaveTextContent("Sunny");
  expect(within(region).getByText("Air quality")).toBeInTheDocument();
  expect(region).not.toHaveTextContent("Since last year");
});

it("shows each change since last year once a year passes", () => {
  const region = renderDashboard();

  act(() => {
    actions?.play();
  });
  act(() => {
    vi.advanceTimersByTime(YEAR_MS);
  });

  for (const label of ["Population", "Forest cover", "Temperature"]) {
    expect(metric(region, label)).toHaveTextContent(
      /Since last year: ([+−]\d+\.\d|no change)/,
    );
  }
  // Weather is a word, not a number: no change line.
  expect(metric(region, "Weather")).not.toHaveTextContent("Since last year");
});

it("clears the changes on reset", () => {
  const region = renderDashboard();
  act(() => {
    actions?.play();
  });
  act(() => {
    vi.advanceTimersByTime(YEAR_MS);
  });
  act(() => {
    actions?.pause();
  });
  act(() => {
    actions?.resetWorld();
  });

  expect(region).not.toHaveTextContent("Since last year");
  expect(metric(region, "Population")).toHaveTextContent("250");
});

function explain() {
  fireEvent.click(
    screen.getByRole("button", { name: "What do these numbers mean?" }),
  );
  return screen.getByRole("dialog", { name: "What the numbers mean" });
}

it("pauses and explains every number in real life", () => {
  renderDashboard();
  act(() => {
    actions?.play();
  });
  expect(simulation?.isRunning).toBe(true);

  const panel = explain();
  expect(simulation?.isRunning).toBe(false);
  for (const label of [
    "Population",
    "Forest cover",
    "Water quality",
    "Air quality",
    "Temperature",
    "Carbon",
    "Weather",
  ]) {
    expect(
      within(panel).getByRole("heading", { name: new RegExp(`^${label}`) }),
    ).toBeInTheDocument();
  }
  for (const line of ["The number", "In real life", "In Environ"]) {
    expect(within(panel).getAllByText(line)).toHaveLength(7);
  }
  // Every metric but population says why it matters in real life.
  expect(within(panel).getAllByText("Why it matters")).toHaveLength(6);
  // "The number" reads the current value.
  expect(panel).toHaveTextContent("250 is all your towns' sizes added up");
  expect(panel).toHaveTextContent("Your island is 15.0 °C on average");

  // Time stands still while it's open.
  act(() => {
    vi.advanceTimersByTime(YEAR_MS * 3);
  });
  expect(panel).toHaveTextContent("250");
});

it("resumes on close if it was running, and stays paused if not", () => {
  renderDashboard();

  act(() => {
    actions?.play();
  });
  explain();
  fireEvent.click(screen.getByRole("button", { name: "Back to my world" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(simulation?.isRunning).toBe(true);

  act(() => {
    actions?.pause();
  });
  explain();
  fireEvent.click(screen.getByRole("button", { name: "Back to my world" }));
  expect(simulation?.isRunning).toBe(false);
});

it("centres the metrics until the first changes appear", () => {
  const region = renderDashboard();
  const list = region.querySelector(".metrics-list");
  expect(list).not.toHaveClass("has-changes");

  act(() => {
    actions?.play();
  });
  act(() => {
    vi.advanceTimersByTime(YEAR_MS);
  });
  expect(list).toHaveClass("has-changes");
});
