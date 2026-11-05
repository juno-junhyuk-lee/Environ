import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { BoardProvider } from "./BoardProvider.tsx";
import { useBoard, useBoardActions } from "./boardContext.ts";
import { WorldControls } from "./WorldControls.tsx";

function TileEditor() {
  const { tiles } = useBoard();
  const { placeElement } = useBoardActions();
  return (
    <>
      <output aria-label="Center element">
        {tiles.find((tile) => tile.id === "0,0")?.element}
      </output>
      <button
        type="button"
        onClick={() => {
          placeElement("0,0", "forest");
        }}
      >
        Edit center
      </button>
    </>
  );
}

it("resets the shared board after an edit and on repeated clicks", () => {
  render(
    <BoardProvider>
      <WorldControls />
      <TileEditor />
    </BoardProvider>,
  );
  expect(screen.getByText("Year 0")).toBeInTheDocument();
  expect(screen.getByLabelText("Center element")).toHaveTextContent(
    "fresh_water_body",
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit center" }));
  expect(screen.getByLabelText("Center element")).toHaveTextContent("forest");
  fireEvent.click(screen.getByRole("button", { name: "Reset world" }));
  expect(screen.getByLabelText("Center element")).toHaveTextContent(
    "fresh_water_body",
  );
  fireEvent.click(screen.getByRole("button", { name: "Reset world" }));
  expect(screen.getByLabelText("Center element")).toHaveTextContent(
    "fresh_water_body",
  );
});
