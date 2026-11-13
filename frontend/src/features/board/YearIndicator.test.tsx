import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { createDefaultWorld, serializeWorld } from "../../world/index.ts";
import { type BoardActions, useBoardActions } from "./boardContext.ts";
import { BoardProvider } from "./BoardProvider.tsx";
import { YearIndicator } from "./YearIndicator.tsx";

function renderYear() {
  let actions: BoardActions | undefined;
  function CaptureActions() {
    const boardActions = useBoardActions();
    useEffect(() => {
      actions = boardActions;
    }, [boardActions]);
    return null;
  }
  const { container } = render(
    <BoardProvider>
      <YearIndicator />
      <CaptureActions />
    </BoardProvider>,
  );

  return {
    setYear(year: number) {
      act(() => {
        actions?.loadWorld(serializeWorld(year, createDefaultWorld()));
      });
    },
    reset() {
      act(() => {
        actions?.resetWorld();
      });
    },
    /** What each digit window shows: one digit, or old+new while rolling. */
    digits(): string[] {
      return [...container.querySelectorAll(".year-digit")].map(
        (digit) => digit.textContent,
      );
    },
    finishRolls() {
      // jsdom has no AnimationEvent, so React listens for the WebKit-prefixed
      // name instead of "animationend" (browsers get the standard one).
      for (const roll of container.querySelectorAll(".year-digit-roll")) {
        fireEvent(roll, new Event("webkitAnimationEnd", { bubbles: true }));
      }
    },
  };
}

describe("YearIndicator", () => {
  it("names the year for screen readers, and follows the world", () => {
    const year = renderYear();
    expect(screen.getByText("Year 0")).toBeInTheDocument();

    year.setYear(37);
    expect(screen.getByText("Year 37")).toBeInTheDocument();

    year.reset();
    expect(screen.getByText("Year 0")).toBeInTheDocument();
  });

  it("rolls only the digits that change, then settles on the new year", () => {
    const year = renderYear();
    year.setYear(41);
    year.finishRolls();
    expect(year.digits()).toEqual(["4", "1"]);

    year.setYear(42);
    // The tens stays put; the ones holds the old and new digit while rolling.
    expect(year.digits()).toEqual(["4", "12"]);
    expect(screen.getByText("Year 42")).toBeInTheDocument();

    year.finishRolls();
    expect(year.digits()).toEqual(["4", "2"]);
  });

  it("rolls the ones and adds a tens digit as the year grows (9 to 10)", () => {
    const year = renderYear();
    year.setYear(9);
    year.finishRolls();

    year.setYear(10);
    expect(year.digits()).toEqual(["1", "90"]);
    year.finishRolls();
    expect(year.digits()).toEqual(["1", "0"]);
  });
});
