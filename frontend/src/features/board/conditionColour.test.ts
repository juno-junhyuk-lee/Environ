import { MeshStandardMaterial } from "three";
import { describe, expect, it } from "vitest";
import {
  desaturatable,
  FULL_COLOUR_CONDITION,
  saturationFor,
} from "./conditionColour.ts";

describe("saturationFor", () => {
  it("is full colour at and above the threshold", () => {
    expect(saturationFor(FULL_COLOUR_CONDITION)).toBe(1);
    expect(saturationFor(100)).toBe(1);
  });

  it("drains linearly to black and white at 0", () => {
    expect(saturationFor(0)).toBe(0);
    expect(saturationFor(FULL_COLOUR_CONDITION / 2)).toBeCloseTo(0.5);
  });

  it("keeps a fresh tile (condition 50) mostly in colour", () => {
    expect(saturationFor(50)).toBeGreaterThan(0.8);
  });

  it("clamps out-of-range and NaN conditions", () => {
    expect(saturationFor(-10)).toBe(0);
    expect(saturationFor(150)).toBe(1);
    expect(saturationFor(Number.NaN)).toBe(0);
  });
});

describe("desaturatable", () => {
  function compile(saturation: { value: number }) {
    const material = desaturatable(new MeshStandardMaterial(), saturation);
    const shader = {
      uniforms: {} as Record<string, unknown>,
      fragmentShader:
        "#include <common>\nvoid main() {\n#include <map_fragment>\n}",
      vertexShader: "",
    };
    material.onBeforeCompile(
      shader as unknown as Parameters<typeof material.onBeforeCompile>[0],
      undefined as unknown as Parameters<typeof material.onBeforeCompile>[1],
    );
    return { material, shader };
  }

  it("copies the material, leaving the shared original alone", () => {
    const original = new MeshStandardMaterial();
    const copy = desaturatable(original, { value: 1 });
    expect(copy).not.toBe(original);
    // The patch is an own property of the copy; the original keeps the
    // prototype's no-op, so other users of the shared material are unaffected.
    expect(Object.hasOwn(copy, "onBeforeCompile")).toBe(true);
    expect(Object.hasOwn(original, "onBeforeCompile")).toBe(false);
  });

  it("wires the tile's own uniform into the shader after the texture", () => {
    const saturation = { value: 0.3 };
    const { shader } = compile(saturation);

    expect(shader.uniforms.uSaturation).toBe(saturation);
    expect(shader.fragmentShader).toContain("uniform float uSaturation;");
    expect(shader.fragmentShader.indexOf("uSaturation\n);")).toBeGreaterThan(
      shader.fragmentShader.indexOf("#include <map_fragment>"),
    );
  });

  it("shares one shader program across tiles", () => {
    const a = desaturatable(new MeshStandardMaterial(), { value: 1 });
    const b = desaturatable(new MeshStandardMaterial(), { value: 0 });
    expect(a.customProgramCacheKey()).toBe(b.customProgramCacheKey());
  });
});
