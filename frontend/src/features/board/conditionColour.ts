import type { Material } from "three";

/**
 * At or above this condition a tile shows its full colour; below it, the
 * colour drains linearly to black and white at 0. Set below 100 so a fresh
 * tile (condition 50) still reads as mostly healthy.
 */
export const FULL_COLOUR_CONDITION = 60;

/** 1 = full colour, 0 = black and white. */
export function saturationFor(condition: number): number {
  if (Number.isNaN(condition)) return 0;
  return Math.min(1, Math.max(0, condition / FULL_COLOUR_CONDITION));
}

/** Shared by every material of one tile, so the whole tile fades together. */
export interface SaturationUniform {
  value: number;
}

/**
 * A copy of `material` whose colours are blended toward their own grey by
 * `saturation`. The texture is shared, not copied. Every copy compiles to the
 * same shader program; only the uniform differs per tile.
 */
export function desaturatable(
  material: Material,
  saturation: SaturationUniform,
): Material {
  const copy = material.clone();
  copy.onBeforeCompile = (shader) => {
    shader.uniforms.uSaturation = saturation;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uSaturation;",
      )
      // After the texture is applied, before lighting: lights and shadows
      // still shade the grey version naturally. Rec. 709 luma (linear RGB).
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
diffuseColor.rgb = mix(
  vec3(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722))),
  diffuseColor.rgb,
  uSaturation
);`,
      );
  };
  copy.customProgramCacheKey = () => "environ-desaturatable";
  return copy;
}
