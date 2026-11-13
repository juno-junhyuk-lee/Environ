import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTile } from "../../world/index.ts";
import { useBoard } from "../board/boardContext.ts";
import { BoardProvider } from "../board/BoardProvider.tsx";
import {
  type ElementDragActions,
  ElementDragActionsContext,
} from "../board/elementDrag.ts";
import { ElementsPane } from "./ElementsPane.tsx";
import { HOLDING_CLASS } from "./usePickUp.ts";

// jsdom has no WebGL: stand in for the 3D tile, exposing whether it's lifted.
vi.mock("../board/TilePreview.tsx", async () => {
  const { createElement } = await import("react");
  return {
    TilePreview: ({ lifted }: { lifted?: boolean }) =>
      createElement("span", { "data-lifted": String(Boolean(lifted)) }),
  };
});

const LABELS = ["Forest", "Fresh Water Body", "Human Settlement"];

// The board isn't rendered here: the tile under the pointer is whatever
// `tileUnderPointer` says.
let tileUnderPointer: string | null = null;
const dragActions = {
  registerTileHitTest: () => () => undefined,
  tileAt: vi.fn(() => tileUnderPointer),
  setDropTarget: vi.fn<(tileId: string | null) => void>(),
} satisfies ElementDragActions;

function CentreTile() {
  const tile = getTile(useBoard(), "0,0");
  return <output aria-label="Centre tile">{tile?.element}</output>;
}

function renderPane() {
  return render(
    <BoardProvider>
      <ElementDragActionsContext value={dragActions}>
        <ElementsPane />
        <CentreTile />
      </ElementDragActionsContext>
    </BoardProvider>,
  );
}

function centreTile(): string | null {
  return screen.getByRole("status", { name: "Centre tile" }).textContent;
}

function icon(name: string): HTMLElement {
  return screen.getByRole("button", { name });
}

/** The icon column (each card also holds a list, so query via an icon). */
function column(): HTMLElement {
  const list = icon("Forest").closest("ul");
  if (!list) throw new Error("icon column not found");
  return list;
}

function isCardOpen(name: string): boolean {
  return icon(name).closest("li")?.classList.contains("is-open") ?? false;
}

function isLifted(name: string): boolean {
  return (
    icon(name).querySelector("[data-lifted]")?.getAttribute("data-lifted") ===
    "true"
  );
}

function isEmpty(name: string): boolean {
  return icon(name).closest("li")?.classList.contains("is-empty") ?? false;
}

function heldPiece(): HTMLElement {
  const piece = document.querySelector<HTMLElement>(".held-piece");
  if (!piece) throw new Error("held piece not rendered");
  return piece;
}

const POINTER = { pointerId: 1, isPrimary: true, button: 0 };

function pickUp(name: string) {
  fireEvent.pointerDown(icon(name), { ...POINTER, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(window, { ...POINTER, clientX: 60, clientY: 40 });
}

function moveTo(clientX: number, clientY: number) {
  fireEvent.pointerMove(window, { ...POINTER, clientX, clientY });
}

function release() {
  fireEvent.pointerUp(window, { ...POINTER, clientX: 200, clientY: 200 });
}

beforeEach(() => {
  vi.useFakeTimers();
  tileUnderPointer = null;
  dragActions.tileAt.mockClear();
  dragActions.setDropTarget.mockClear();
  // jsdom has no pointer capture.
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ElementsPane", () => {
  it("shows one icon per element, in order, with no visible text", () => {
    renderPane();
    const buttons = screen.getAllByRole("button");

    expect(
      screen.getByRole("complementary", { name: "Elements" }),
    ).toBeInTheDocument();
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(
      LABELS,
    );
    for (const button of buttons) {
      expect(button.textContent).toBe("");
    }
  });

  it("describes each icon with its card", () => {
    renderPane();

    expect(icon("Forest")).toHaveAccessibleDescription(/Deep Roots.*Weakness/);
    expect(icon("Fresh Water Body")).toHaveAccessibleDescription(/Spring Fed/);
    expect(icon("Human Settlement")).toHaveAccessibleDescription(/Build Up/);
  });

  it("lifts the tile at once but opens the card only after a short wait", () => {
    renderPane();

    fireEvent.mouseEnter(icon("Forest"));
    expect(isLifted("Forest")).toBe(true);
    expect(isCardOpen("Forest")).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(isCardOpen("Forest")).toBe(true);

    fireEvent.mouseLeave(icon("Forest"));
    expect(isLifted("Forest")).toBe(false);
  });

  it("does not open a card when the mouse just passes over", () => {
    renderPane();

    fireEvent.mouseEnter(icon("Forest"));
    fireEvent.mouseLeave(column());
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(isCardOpen("Forest")).toBe(false);
  });

  it("switches cards instantly once one is open, and closes on leaving the column", () => {
    renderPane();

    fireEvent.mouseEnter(icon("Forest"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.mouseEnter(icon("Fresh Water Body"));

    expect(isCardOpen("Forest")).toBe(false);
    expect(isCardOpen("Fresh Water Body")).toBe(true);

    fireEvent.mouseLeave(column());
    expect(isCardOpen("Fresh Water Body")).toBe(false);
  });

  it("opens on keyboard focus and closes with Escape", () => {
    renderPane();

    fireEvent.focus(icon("Human Settlement"));
    expect(isCardOpen("Human Settlement")).toBe(true);

    fireEvent.keyDown(icon("Human Settlement"), { key: "Escape" });
    expect(isCardOpen("Human Settlement")).toBe(false);
  });

  describe("picking a piece up", () => {
    it("empties its slot and closes its card", () => {
      renderPane();
      const forest = icon("Forest");

      fireEvent.pointerDown(forest, { ...POINTER, clientX: 10, clientY: 10 });
      fireEvent.focus(forest);
      moveTo(12, 11); // Under the pick-up distance: still a press.
      expect(isEmpty("Forest")).toBe(false);
      expect(isCardOpen("Forest")).toBe(true);

      moveTo(60, 40);
      expect(isEmpty("Forest")).toBe(true);
      expect(isCardOpen("Forest")).toBe(false);
      expect(isLifted("Forest")).toBe(true);
      expect(heldPiece().dataset.phase).toBe("holding");
      expect(document.documentElement).toHaveClass(HOLDING_CLASS);
    });

    it("leaves a click alone", () => {
      renderPane();

      fireEvent.pointerDown(icon("Forest"), {
        ...POINTER,
        clientX: 10,
        clientY: 10,
      });
      release();

      expect(isEmpty("Forest")).toBe(false);
      expect(heldPiece().dataset.phase).toBeUndefined();
      expect(dragActions.tileAt).not.toHaveBeenCalled();
    });

    it("carries the piece with the pointer, from where it was grabbed", () => {
      renderPane();
      pickUp("Forest");
      moveTo(150, 90);

      // jsdom lays nothing out, so the slot is at 0,0 and it was grabbed at 10,10.
      expect(heldPiece().style.translate).toBe("140px 80px");
    });

    it("highlights the tile under the piece, and only while over it", () => {
      renderPane();
      pickUp("Forest");

      tileUnderPointer = "0,0";
      moveTo(100, 100);
      expect(dragActions.setDropTarget).toHaveBeenLastCalledWith("0,0");
      expect(heldPiece()).toHaveClass("is-over-tile");

      tileUnderPointer = null;
      moveTo(5, 5);
      expect(dragActions.setDropTarget).toHaveBeenLastCalledWith(null);
      expect(heldPiece()).not.toHaveClass("is-over-tile");
    });

    it("places the element on the tile it's put down on", () => {
      renderPane();
      expect(centreTile()).toBe("fresh_water_body");

      pickUp("Forest");
      tileUnderPointer = "0,0";
      moveTo(100, 100);
      release();

      expect(centreTile()).toBe("forest");
      expect(dragActions.setDropTarget).toHaveBeenLastCalledWith(null);
      expect(heldPiece().dataset.phase).toBe("placing");
      expect(document.documentElement).not.toHaveClass(HOLDING_CLASS);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(heldPiece().dataset.phase).toBeUndefined();
      expect(isEmpty("Forest")).toBe(false);
      expect(isLifted("Forest")).toBe(false);
    });

    it("goes back to its slot when put down off the board", () => {
      renderPane();
      pickUp("Human Settlement");
      release();

      expect(heldPiece().dataset.phase).toBe("returning");
      expect(heldPiece().style.translate).toBe("0px 0px");
      expect(isEmpty("Human Settlement")).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(isEmpty("Human Settlement")).toBe(false);
      expect(centreTile()).toBe("fresh_water_body");
    });

    it("goes back to its slot on Escape", () => {
      renderPane();
      pickUp("Forest");
      tileUnderPointer = "0,0";
      moveTo(100, 100);

      fireEvent.keyDown(window, { key: "Escape" });
      expect(heldPiece().dataset.phase).toBe("returning");
      release(); // No longer listening: nothing is placed.

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(centreTile()).toBe("fresh_water_body");
      expect(isEmpty("Forest")).toBe(false);
    });
  });
});
