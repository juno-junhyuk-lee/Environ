import ReactThreeTestRenderer from "@react-three/test-renderer";
import { useEffect } from "react";
import type { BufferGeometry, Mesh, MeshBasicMaterial } from "three";
import { describe, expect, it, vi } from "vitest";
import {
  type Board,
  createBoardState,
  createDefaultWorld,
  serializeWorld,
} from "../../world/index.ts";
import { axialToWorld } from "./geometry.ts";
import { type BoardActions, useBoardActions } from "./boardContext.ts";
import { BoardProvider } from "./BoardProvider.tsx";
import { BoardScene } from "./BoardScene.tsx";
import { useElementDragActions } from "./elementDrag.ts";
import { ElementDragProvider } from "./ElementDragProvider.tsx";
import { boardReducer } from "./boardState.ts";
import { ELEMENT_MODELS } from "./models.ts";

// No server to fetch .glb files from, and no WebGL for drei's Line: fake both.
// Each fake scene is tagged with its URL so tests can tell which model loaded.
vi.mock("@react-three/drei", async () => {
  const { BoxGeometry, Group, Mesh } = await import("three");
  const { createElement } = await import("react");
  const scenes = new Map<string, InstanceType<typeof Group>>();
  const useGLTF = Object.assign(
    (url: string) => {
      let scene = scenes.get(url);
      if (scene === undefined) {
        scene = new Group();
        scene.add(new Mesh(new BoxGeometry()));
        scene.userData = { url };
        scenes.set(url, scene);
      }
      return { scene };
    },
    { preload: () => undefined },
  );
  const Line = ({ name, points }: { name?: string; points: unknown }) =>
    createElement("group", { name, userData: { points } });
  return { useGLTF, Line };
});

function renderBoard(initialBoard?: Board) {
  return ReactThreeTestRenderer.create(
    <BoardProvider initialBoard={initialBoard}>
      <ElementDragProvider>
        <BoardScene />
      </ElementDragProvider>
    </BoardProvider>,
  );
}

type Renderer = Awaited<ReturnType<typeof renderBoard>>;

function tilePart(renderer: Renderer, tileId: string, part: string) {
  return renderer.scene
    .findByProps({ name: `tile-${tileId}` })
    .findByProps({ name: part }).instance;
}

function modelUrl(renderer: Renderer, tileId: string): unknown {
  return tilePart(renderer, tileId, "tile-model").userData.url;
}

describe("BoardScene", () => {
  it("renders 19 tiles at their axial positions", async () => {
    const renderer = await renderBoard();
    const tiles = renderer.scene.findByProps({ name: "tiles" }).children;

    expect(tiles).toHaveLength(19);

    const centre = renderer.scene.findByProps({ name: "tile-0,0" });
    expect(centre.instance.position.toArray()).toEqual(axialToWorld(0, 0));

    const corner = renderer.scene.findByProps({ name: "tile-2,-2" });
    expect(corner.instance.position.toArray()).toEqual(axialToWorld(2, -2));
    expect(modelUrl(renderer, "-1,0")).toBe(ELEMENT_MODELS.forest.url);
    expect(modelUrl(renderer, "0,0")).toBe(ELEMENT_MODELS.fresh_water_body.url);
    expect(modelUrl(renderer, "1,0")).toBe(ELEMENT_MODELS.human_settlement.url);
  });

  it("gives every tile its own copy of the model", async () => {
    const renderer = await renderBoard();
    const models = renderer.scene.findAllByProps({ name: "tile-model" });
    const objects = new Set(models.map((model) => model.instance));

    expect(models).toHaveLength(19);
    expect(objects.size).toBe(19);
  });

  it("draws a border on every tile", async () => {
    const renderer = await renderBoard();
    const outlines = renderer.scene.findAllByProps({ name: "tile-outline" });

    expect(outlines).toHaveLength(19);
  });

  it("shows each tile's element as its 3D model", async () => {
    const state = boardReducer(createBoardState(), {
      type: "placeElement",
      tileId: "0,0",
      element: "human_settlement",
    });
    const renderer = await renderBoard(state);

    expect(modelUrl(renderer, "0,0")).toBe(ELEMENT_MODELS.human_settlement.url);
    expect(modelUrl(renderer, "1,0")).toBe(ELEMENT_MODELS.forest.url);
  });

  it("swaps a tile's model when the board state changes", async () => {
    let actions: BoardActions | undefined;
    function CaptureActions({
      onReady,
    }: {
      onReady: (a: BoardActions) => void;
    }) {
      const boardActions = useBoardActions();
      useEffect(() => {
        onReady(boardActions);
      }, [boardActions, onReady]);
      return null;
    }

    const renderer = await ReactThreeTestRenderer.create(
      <BoardProvider>
        <ElementDragProvider>
          <BoardScene />
        </ElementDragProvider>
        <CaptureActions onReady={(a) => (actions = a)} />
      </BoardProvider>,
    );
    expect(modelUrl(renderer, "1,-1")).toBe(
      ELEMENT_MODELS.human_settlement.url,
    );

    await ReactThreeTestRenderer.act(async () => {
      actions?.placeElement("1,-1", "forest");
      await Promise.resolve();
    });
    expect(modelUrl(renderer, "1,-1")).toBe(ELEMENT_MODELS.forest.url);

    await ReactThreeTestRenderer.act(async () => {
      actions?.placeElement("1,-1", "fresh_water_body");
      await Promise.resolve();
    });
    expect(modelUrl(renderer, "1,-1")).toBe(
      ELEMENT_MODELS.fresh_water_body.url,
    );

    await ReactThreeTestRenderer.act(async () => {
      actions?.resetWorld();
      await Promise.resolve();
    });
    expect(modelUrl(renderer, "1,-1")).toBe(
      ELEMENT_MODELS.human_settlement.url,
    );

    const save = serializeWorld(37, createDefaultWorld());
    save.tiles = save.tiles.map((tile) => ({ ...tile, element: "forest" }));
    await ReactThreeTestRenderer.act(async () => {
      actions?.loadWorld(save);
      await Promise.resolve();
    });
    expect(modelUrl(renderer, "0,0")).toBe(ELEMENT_MODELS.forest.url);
    expect(modelUrl(renderer, "1,-1")).toBe(ELEMENT_MODELS.forest.url);
  });

  it("pops the drop target up from its neighbours, then settles it back", async () => {
    let setDropTarget: ((tileId: string | null) => void) | undefined;
    function CaptureDrag() {
      setDropTarget = useElementDragActions().setDropTarget;
      return null;
    }
    const renderer = await ReactThreeTestRenderer.create(
      <BoardProvider>
        <ElementDragProvider>
          <BoardScene />
          <CaptureDrag />
        </ElementDragProvider>
      </BoardProvider>,
    );
    const popHeight = (tileId: string) =>
      tilePart(renderer, tileId, "tile-pop").position.y;

    await ReactThreeTestRenderer.act(async () => {
      setDropTarget?.("0,0");
      await Promise.resolve();
    });
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(30, 0.1);
    });
    expect(popHeight("0,0")).toBeGreaterThan(0.05);
    expect(popHeight("1,0")).toBe(0);

    await ReactThreeTestRenderer.act(async () => {
      setDropTarget?.(null);
      await Promise.resolve();
    });
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(30, 0.1);
    });
    expect(popHeight("0,0")).toBe(0);
  });

  it("draws the border at the ground height of the tile's model", async () => {
    const state = boardReducer(createBoardState(), {
      type: "placeElement",
      tileId: "0,0",
      element: "fresh_water_body",
    });
    const renderer = await renderBoard(state);
    const borderHeight = (tileId: string) => {
      const points = tilePart(renderer, tileId, "tile-outline").userData
        .points as [number, number, number][];
      return points[0]?.[1];
    };

    expect(borderHeight("0,0")).toBeCloseTo(
      ELEMENT_MODELS.fresh_water_body.surfaceHeight,
      2,
    );
    expect(borderHeight("1,0")).toBeCloseTo(
      ELEMENT_MODELS.forest.surfaceHeight,
      2,
    );
  });

  describe("lakes (fresh water)", () => {
    const withLake = boardReducer(createBoardState(), {
      type: "placeElement",
      tileId: "0,0",
      element: "fresh_water_body",
    });

    it("get cartoon ripples on the water; other tiles don't", async () => {
      const renderer = await renderBoard(withLake);
      const ripples = renderer.scene.findAllByProps({ name: "water-ripples" });

      expect(ripples).toHaveLength(1);
      expect(
        tilePart(renderer, "0,0", "water-ripples").position.y,
      ).toBeGreaterThan(ELEMENT_MODELS.fresh_water_body.surfaceHeight);
    });

    it("are raised well above the sea, just below the land", async () => {
      const renderer = await renderBoard(withLake);
      const lake = tilePart(renderer, "0,0", "tile-model");
      const lakeTop = 0.1 * lake.scale.y; // water.glb is 0.1 tall

      expect(lakeTop).toBeCloseTo(
        ELEMENT_MODELS.fresh_water_body.surfaceHeight,
      );
      expect(lakeTop).toBeLessThan(ELEMENT_MODELS.forest.surfaceHeight);
      expect(tilePart(renderer, "1,0", "tile-model").scale.y).toBe(1);
    });

    it("animate their ripples over time", async () => {
      const renderer = await renderBoard(withLake);
      const ring = renderer.scene.findAllByProps({ name: "water-ripple" })[0]
        ?.instance as Mesh<BufferGeometry, MeshBasicMaterial> | undefined;
      const snapshot = () => [ring?.scale.x, ring?.material.opacity];

      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(1, 0.1);
      });
      const before = snapshot();
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(3, 0.2);
      });

      expect(ring).toBeDefined();
      expect(snapshot()).not.toEqual(before);
    });
  });
});
