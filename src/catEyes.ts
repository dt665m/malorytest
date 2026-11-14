import * as THREE from 'three';

// UV artwork follows both spherical and faceted surfaces and both shared objects.
// Keep it separate from the refreshable cats and existing animal/panel layers.
export function addCatEyes(
  materials: THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[],
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const oval = (x: number, y: number, rx: number, ry: number, color: string) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Align with the cats' eyes without covering their ears, noses or companions.
  for (const x of [190, 322]) {
    oval(x, 265, 36, 41, '#111318');
    ctx.beginPath();
    ctx.moveTo(x - 43, 265);
    ctx.quadraticCurveTo(x, 185, x + 43, 265);
    ctx.quadraticCurveTo(x, 345, x - 43, 265);
    ctx.fillStyle = '#f6c453';
    ctx.fill();
    oval(x, 265, 24, 35, '#8da936');
    oval(x, 265, 6, 33, '#111318');
    oval(x - 9, 253, 6, 8, '#ffffff');
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const targets = Array.isArray(materials) ? materials : [materials];
  const restores = targets.map((material) => {
    const previousCompile = material.onBeforeCompile;
    const previousCacheKey = material.customProgramCacheKey;
    const cacheKey = previousCacheKey.call(material);
    material.onBeforeCompile = function (shader, renderer) {
      previousCompile.call(this, shader, renderer);
      shader.uniforms.catEyes = { value: texture };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vCatEyesUv;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvCatEyesUv = uv;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D catEyes;\nvarying vec2 vCatEyesUv;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec4 eyes = texture2D(catEyes, vCatEyesUv);
          diffuseColor.rgb = mix(diffuseColor.rgb, eyes.rgb, eyes.a);`);
    };
    material.customProgramCacheKey = () => cacheKey + ':cat-eyes-v1';
    material.needsUpdate = true;
    return () => {
      material.onBeforeCompile = previousCompile;
      material.customProgramCacheKey = previousCacheKey;
      material.needsUpdate = true;
    };
  });

  return () => {
    restores.forEach((restore) => restore());
    texture.dispose();
  };
}
