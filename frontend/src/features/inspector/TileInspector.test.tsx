import { act, fireEvent, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BoardProvider } from "../board/BoardProvider.tsx";
import { useBoardActions } from "../board/boardContext.ts";
import { useElementDragActions } from "../board/elementDrag.ts";
import { ElementDragProvider } from "../board/ElementDragProvider.tsx";
import { TileInspector } from "./TileInspector.tsx";

const YEAR_MS = 1000;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Stands in for the 3D board: the centre tile is left of x = 100. */
function FakeBoard() {
  const { registerTileHitTest } = useElementDragActions();
  useEffect(
    () => registerTileHitTest((x) => (x < 100 ? "0,0" : null)),
    [registerTileHitTest],
  );
  return null;
}

let actions: ReturnType<typeof useBoardActions> | undefined;
function CaptureActions() {
  const boardActions = useBoardActions();
  useEffect(() => {
    actions = boardActions;
  }, [boardActions]);
  return null;
}

function renderInspector() {
  const view = render(
    <BoardProvider timeStepInterval={YEAR_MS}>
      <ElementDragProvider>
        <FakeBoard />
        <CaptureActions />
        <TileInspector />
      </ElementDragProvider>
    </BoardProvider>,
  );
  const card = () => view.container.querySelector(".inspector");
  return { card };
}

function hover(x: number, init: Partial<PointerEventInit> = {}) {
  fireEvent.pointerMove(window, { clientX: x, clientY: 50, ...init });
}

it("opens over a tile and closes off the board", () => {
  const { card } = renderInspector();
  expect(card()).not.toHaveClass("is-open");

  hover(50);
  expect(card()).toHaveClass("is-open");
  expect(card()).toHaveAttribute("data-element", "human_settlement");
  expect(card()).toHaveTextContent("Human Settlement");
  expect(card()).toHaveTextContent("Population");
  expect(card()).toHaveTextContent("Air quality");
  expect(card()).not.toHaveTextContent("Next to");

  hover(200);
  expect(card()).not.toHaveClass("is-open");
});

it("stays hidden while a piece is carried, and for touch", () => {
  const { card } = renderInspector();

  hover(50, { buttons: 1 });
  expect(card()).not.toHaveClass("is-open");

  hover(50, { pointerType: "touch" });
  expect(card()).not.toHaveClass("is-open");
});

it("updates live and shows this year's change while running", () => {
  const { card } = renderInspector();
  hover(50);
  expect(card()).not.toHaveTextContent("this year");

  act(() => {
    actions?.play();
  });
  act(() => {
    vi.advanceTimersByTime(YEAR_MS);
  });
  expect(card()).toHaveTextContent(/([+−]\d+\.\d|no change) this year/);
});

it("follows the element when a piece is placed on the hovered tile", () => {
  const { card } = renderInspector();
  hover(50);

  act(() => {
    actions?.placeElement("0,0", "forest");
  });
  expect(card()).toHaveAttribute("data-element", "forest");
  expect(card()).toHaveTextContent("Forest health");
});
