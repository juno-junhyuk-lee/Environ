import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  createDefaultWorld,
  serializeWorld,
  worldSaveToJson,
} from "../../world/index.ts";
import { BoardProvider } from "./BoardProvider.tsx";
import { useBoard, useBoardActions } from "./boardContext.ts";
import { WorldControls } from "./WorldControls.tsx";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function TileEditor() {
  const { tiles, year } = useBoard();
  const { placeElement } = useBoardActions();
  return (
    <>
      <span aria-label="Year">{year}</span>
      <span aria-label="Center element">
        {tiles.find((tile) => tile.id === "0,0")?.element}
      </span>
      <span aria-label="Center condition">
        {tiles.find((tile) => tile.id === "0,0")?.conditionValue}
      </span>
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
  expect(screen.getByLabelText("Year")).toHaveTextContent(/^0$/);
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

function renderControls() {
  render(
    <BoardProvider>
      <WorldControls />
      <TileEditor />
    </BoardProvider>,
  );
}

function upload(text: () => Promise<string>) {
  const file = new File([], "world.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: text });
  fireEvent.change(screen.getByLabelText("World save file"), {
    target: { files: [file] },
  });
}

it("loads all world fields, allows repeated file selection, and resets to defaults", async () => {
  renderControls();
  const world = createDefaultWorld();
  const save = serializeWorld(37, world);
  const center = save.tiles.find((tile) => tile.id === "0,0");
  if (!center) throw new Error("missing center");
  center.element = "forest";
  center.conditionValue = 83;
  const read = () => Promise.resolve(worldSaveToJson(save));
  upload(read);
  expect(await screen.findByRole("status")).toHaveTextContent("World loaded.");
  expect(screen.getByLabelText("Year")).toHaveTextContent(/^37$/);
  expect(screen.getByLabelText("Center element")).toHaveTextContent("forest");
  expect(screen.getByLabelText("Center condition")).toHaveTextContent("83");
  fireEvent.click(screen.getByRole("button", { name: "Reset world" }));
  expect(screen.getByLabelText("Year")).toHaveTextContent(/^0$/);
  expect(screen.getByLabelText("Center element")).toHaveTextContent(
    "fresh_water_body",
  );
  expect(screen.getByLabelText("Center condition")).toHaveTextContent("50");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  upload(read);
  expect(await screen.findByRole("status")).toHaveTextContent("World loaded.");
  expect(screen.getByLabelText("Year")).toHaveTextContent(/^37$/);
});

it("keeps the edited world unchanged when loading fails", async () => {
  renderControls();
  fireEvent.click(screen.getByRole("button", { name: "Edit center" }));
  upload(() => Promise.resolve("{"));
  expect(await screen.findByRole("alert")).toHaveTextContent("valid JSON");
  expect(screen.getByLabelText("Year")).toHaveTextContent(/^0$/);
  expect(screen.getByLabelText("Center element")).toHaveTextContent("forest");
  upload(() => Promise.resolve(JSON.stringify({ format: "wrong" })));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unrecognized save format",
  );
  expect(screen.getByLabelText("Center element")).toHaveTextContent("forest");
});

it("disables world controls until a pending load completes", async () => {
  renderControls();
  let finish: ((text: string) => void) | undefined;
  upload(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Reset world" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Save world" })).toBeDisabled();
  finish?.("{");
  await screen.findByRole("alert");
  expect(screen.getByRole("button", { name: "Upload world" })).toBeEnabled();
});

it("opens the file picker and handles cancellation", () => {
  renderControls();
  const input = screen.getByLabelText("World save file");
  const click = vi.spyOn(input, "click");
  fireEvent.click(screen.getByRole("button", { name: "Upload world" }));
  expect(click).toHaveBeenCalledOnce();
  fireEvent.change(input, { target: { files: [] } });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Year")).toHaveTextContent(/^0$/);
});

it("shows reset, save and upload as icons, each with its speech bubble", () => {
  renderControls();
  for (const name of ["Reset world", "Save world", "Upload world"]) {
    const button = screen.getByRole("button", { name });
    const bubble = button.querySelector(".speech-bubble");
    expect(button.querySelector("img")).toHaveAttribute("alt", "");
    expect(bubble).toHaveTextContent(name);
    expect(bubble).toHaveAttribute("aria-hidden", "true");
  }
});

it("fades a success message out, but keeps an error until the next action", async () => {
  vi.useFakeTimers();
  try {
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:world",
      revokeObjectURL: () => undefined,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    renderControls();

    fireEvent.click(screen.getByRole("button", { name: "Save world" }));
    expect(screen.getByRole("status")).toHaveTextContent("World exported.");
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    upload(() => Promise.resolve("{"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByRole("alert")).toHaveTextContent("valid JSON");
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

it("exports the current edited world and reports download failures", async () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:world");
  const revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
    () => undefined,
  );
  renderControls();
  fireEvent.click(screen.getByRole("button", { name: "Edit center" }));
  fireEvent.click(screen.getByRole("button", { name: "Save world" }));
  expect(screen.getByRole("status")).toHaveTextContent("World exported.");
  const blob = createObjectURL.mock.calls[0]?.[0];
  if (!blob) throw new Error("missing download");
  const reader = new FileReader();
  const text = new Promise<string>((resolve) => {
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
    };
  });
  reader.readAsText(blob);
  const expected = createDefaultWorld();
  const center = expected.tiles.find((tile) => tile.id === "0,0");
  if (!center) throw new Error("missing center");
  center.element = "forest";
  expect(JSON.parse(await text)).toEqual(serializeWorld(0, expected));
  await waitFor(() => {
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:world");
  });
  createObjectURL.mockImplementation(() => {
    throw new Error("download failed");
  });
  fireEvent.click(screen.getByRole("button", { name: "Save world" }));
  expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
});
