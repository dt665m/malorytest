import * as THREE from 'three';

/**
 * Add rounded 3×3 sticker panels without replacing the surface's color or map.
 * Uses face-local UVs, so it also follows a cube projected onto a sphere.
 * Apply before addLaughingAnimals so its transparent artwork stays above seams.
 */
export function applyRubiksPanels(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRubiksUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvRubiksUv = uv;');

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRubiksUv;')
      .replace(
        '#include <map_fragment>',
        `
        // Rounded sticker signed distance in each of the nine face cells.
        vec2 panelPoint = abs(fract(vRubiksUv * 3.0) - 0.5);
        vec2 panelCorner = panelPoint - vec2(0.405);
        float panelDistance = length(max(panelCorner, 0.0))
          + min(max(panelCorner.x, panelCorner.y), 0.0) - 0.045;
        float panelAA = max(fwidth(panelDistance), 0.001);
        float panelMask = 1.0 - smoothstep(-panelAA, panelAA, panelDistance);
        float panelBevel = smoothstep(-0.045, -0.008, panelDistance);
        vec3 stickerColor = diffuseColor.rgb * (1.0 + 0.16 * panelBevel);
        diffuseColor.rgb = mix(vec3(0.012, 0.014, 0.019), stickerColor, panelMask);
        #include <map_fragment>
        `,
      );
  };
  material.customProgramCacheKey = () => 'rubiks-panels-v1';
  material.needsUpdate = true;
}
