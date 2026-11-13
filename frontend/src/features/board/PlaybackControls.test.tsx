import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PlaybackControls } from "./PlaybackControls.tsx";

function button(name: string): HTMLElement {
  return screen.getByRole("button", { name });
}

it("starts paused: play is available, pause is greyed out", () => {
  render(<PlaybackControls />);

  expect(
    screen.getByRole("complementary", { name: "Playback" }),
  ).toBeInTheDocument();
  expect(button("Play")).toBeEnabled();
  expect(button("Pause")).toBeDisabled();
});

it("switches between playing and paused, keeping keyboard focus", () => {
  render(<PlaybackControls />);

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
  render(<PlaybackControls />);

  for (const name of ["Play", "Pause"]) {
    expect(button(name).textContent).toBe("");
    expect(button(name).querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  }
});
