import { useThree } from "@react-three/fiber";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { type Camera, PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import { CameraFit } from "./Board3D.tsx";
import { centringOffset, fitDistance } from "./camera.ts";

async function fitCamera(width: number, height: number) {
  let camera: Camera | undefined;
  function CaptureCamera() {
    camera = useThree((state) => state.camera);
    return null;
  }
  await ReactThreeTestRenderer.create(
    <>
      <CameraFit />
      <CaptureCamera />
    </>,
    { width, height },
  );
  if (!(camera instanceof PerspectiveCamera)) {
    throw new Error("expected a perspective camera");
  }
  return camera;
}

describe("CameraFit", () => {
  it.each([
    [1200, 600],
    [800, 755],
    [500, 900],
  ])(
    "keeps the camera's aspect at the canvas's (%i x %i), so nothing is stretched",
    async (width, height) => {
      const camera = await fitCamera(width, height);

      expect(camera.aspect).toBeCloseTo(width / height);
    },
  );

  it("shifts the view up to centre the sea vertically", async () => {
    const camera = await fitCamera(800, 755);
    const distance = fitDistance(800 / 755);

    expect(camera.view?.enabled).toBe(true);
    expect(camera.view?.offsetX).toBe(0);
    expect(camera.view?.offsetY).toBeCloseTo(centringOffset(distance) * 755);
    expect(camera.position.length()).toBeCloseTo(distance);
  });
});
