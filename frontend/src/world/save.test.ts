import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultWorld } from "./world.ts";
import {
  boardFromSave,
  exportWorldToFile,
  importWorldFromFile,
  serializeWorld,
  validateWorldSave,
  worldSaveToJson,
} from "./save.ts";
import { worldReducer } from "../features/board/boardState.ts";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function savedWorld() {
  const world = createDefaultWorld();
  world.year = 37;
  const tile = world.tiles[0];
  if (!tile) throw new Error("missing tile");
  tile.element = "human_settlement";
  tile.conditionValue = 83;
  return serializeWorld(world.year, world);
}

describe("world saves", () => {
  it("round trips the year, positions, elements, and conditions through JSON", async () => {
    const save = savedWorld();
    const file = new File([], "world.json");
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(worldSaveToJson(save)),
    });
    const result = await importWorldFromFile(file);
    expect(result).toEqual({ ok: true, save });
    if (!result.ok) throw new Error(result.error);
    const world = worldReducer(createDefaultWorld(), {
      type: "loadWorld",
      save: result.save,
    });
    expect(world).toEqual({ ...boardFromSave(save), year: 37 });
    expect(world.tiles).not.toBe(result.save.tiles);
    expect(world.tiles[0]).not.toBe(result.save.tiles[0]);
    expect(worldReducer(world, { type: "resetWorld" })).toEqual(
      createDefaultWorld(),
    );
  });

  it("copies tiles when serializing and validating", () => {
    const world = createDefaultWorld();
    const save = serializeWorld(world.year, world);
    expect(save.tiles[0]).not.toBe(world.tiles[0]);
    const result = validateWorldSave(save);
    if (!result.ok) throw new Error(result.error);
    expect(result.save.tiles[0]).not.toBe(save.tiles[0]);
  });

  it.each([
    ["null", null],
    ["unknown format", { ...savedWorld(), format: "other" }],
    ["unsupported version", { ...savedWorld(), version: 2 }],
    ["negative year", { ...savedWorld(), year: -1 }],
    ["fractional year", { ...savedWorld(), year: 1.5 }],
    ["nonfinite year", { ...savedWorld(), year: Infinity }],
    ["unsafe year", { ...savedWorld(), year: Number.MAX_SAFE_INTEGER + 1 }],
    ["missing tiles", { ...savedWorld(), tiles: null }],
    [
      "wrong tile count",
      { ...savedWorld(), tiles: savedWorld().tiles.slice(1) },
    ],
  ])("rejects %s", (_name, value) => {
    expect(validateWorldSave(value).ok).toBe(false);
  });

  it.each([
    ["duplicate position", { id: "0,0", q: 0, r: 0 }],
    ["mismatched id", { id: "wrong" }],
    ["fractional coordinate", { q: 0.5 }],
    ["position outside board", { id: "9,9", q: 9, r: 9 }],
    ["unknown element", { element: "lava" }],
    ["negative condition", { conditionValue: -1 }],
    ["condition over 100", { conditionValue: 101 }],
    ["nonfinite condition", { conditionValue: NaN }],
  ])("rejects tiles with %s", (_name, change) => {
    const save = savedWorld();
    save.tiles = save.tiles.map((tile, index) =>
      index === 0 ? { ...tile, ...change } : tile,
    ) as typeof save.tiles;
    expect(validateWorldSave(save).ok).toBe(false);
  });

  it("reports malformed JSON and unreadable files", async () => {
    const file = new File([], "broken.json");
    const text = vi.fn().mockResolvedValue("{");
    Object.defineProperty(file, "text", { value: text });
    expect(await importWorldFromFile(file)).toEqual({
      ok: false,
      error: "The file must contain valid JSON.",
    });
    text.mockRejectedValue(new Error("read failed"));
    expect(await importWorldFromFile(file)).toEqual({
      ok: false,
      error: "The file could not be read.",
    });
  });

  it("downloads JSON and releases the download resources", async () => {
    const createObjectURL = vi.fn(() => "blob:world");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    let anchor: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      anchor =
        document.querySelector<HTMLAnchorElement>(
          'a[download="environ-world.json"]',
        ) ?? undefined;
      expect(anchor?.isConnected).toBe(true);
    });
    exportWorldToFile(37, createDefaultWorld());
    expect(anchor?.download).toBe("environ-world.json");
    expect(anchor?.href).toBe("blob:world");
    expect(anchor?.isConnected).toBe(false);
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    await vi.waitFor(() => {
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:world");
    });
  });
});
