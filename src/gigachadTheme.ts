import * as THREE from 'three';

// A transparent, code-drawn insignia leaves the cube's base theme visible.
export function addGigachadTheme(materials: THREE.MeshStandardMaterial[]) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d')!;

  const shape = (points: number[][], fill: string) => {
    context.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.fillStyle = fill;
    context.fill();
  };

  // Broad shoulders, swept hair, heavy brow and a deliberately heroic jaw.
  shape([[80, 420], [108, 365], [205, 333], [307, 333], [404, 365], [432, 420]], '#111318');
  shape([[214, 288], [298, 288], [309, 347], [256, 386], [203, 347]], '#aab0b8');
  shape([[156, 163], [180, 113], [288, 94], [351, 143], [344, 260], [315, 310], [275, 338], [237, 338], [191, 308], [163, 260]], '#e4e7ec');
  shape([[155, 188], [145, 135], [167, 95], [208, 69], [299, 62], [282, 82], [334, 84], [365, 125], [348, 191], [324, 145], [281, 126], [212, 142], [178, 135]], '#111318');
  shape([[173, 190], [224, 184], [243, 201], [186, 206]], '#17191d');
  shape([[269, 201], [289, 184], [338, 190], [325, 206]], '#17191d');
  shape([[192, 214], [232, 215], [217, 222], [196, 220]], '#444a54');
  shape([[280, 215], [320, 214], [316, 220], [294, 222]], '#444a54');
  shape([[256, 205], [244, 257], [266, 261], [277, 252]], '#858d99');
  shape([[166, 249], [199, 276], [228, 279], [256, 270], [284, 279], [314, 276], [343, 249], [329, 299], [280, 340], [232, 340], [184, 299]], '#262a30');
  shape([[220, 290], [244, 283], [269, 283], [294, 290], [272, 297], [241, 297]], '#c5cad2');
  shape([[211, 310], [238, 322], [275, 322], [302, 310], [277, 335], [235, 335]], '#747d8b');
  context.fillStyle = '#ffffff';
  context.font = '900 35px sans-serif';
  context.textAlign = 'center';
  context.lineWidth = 8;
  context.strokeStyle = '#111318';
  context.strokeText('GIGACHAD', 256, 413);
  context.fillText('GIGACHAD', 256, 413);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Use the existing face UVs on spheres, faceted shapes and both clones.
  // This opt-in theme leaves the base maps and all other shader layers intact.
  const restores = materials.map((material) => {
    const previousCompile = material.onBeforeCompile;
    const previousCacheKey = material.customProgramCacheKey;
    const cacheKey = previousCacheKey.call(material);
    material.onBeforeCompile = function (shader, renderer) {
      previousCompile.call(this, shader, renderer);
      shader.uniforms.gigachad = { value: texture };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vGigachadUv;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvGigachadUv = uv;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D gigachad;\nvarying vec2 vGigachadUv;')
        .replace('#include <alphamap_fragment>', `
          vec4 portrait = texture2D(gigachad, vGigachadUv);
          diffuseColor.rgb = mix(diffuseColor.rgb, portrait.rgb, portrait.a);
          #include <alphamap_fragment>`);
    };
    material.customProgramCacheKey = () => cacheKey + ':gigachad-v1';
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
