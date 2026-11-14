import * as THREE from 'three';

// A transparent UV layer, not a replacement for the material's map (e.g. cats).
// Keep the centre free so other face artwork remains visible.
export function addLaughingAnimals(
  materials: THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[],
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const oval = (x: number, y: number, rx: number, ry: number, fill: string) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = '#232038';
    ctx.stroke();
  };
  const line = (points: number[][], color = '#232038') => {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  const eyes = (x: number, y: number) => {
    line([[x - 27, y + 4], [x - 17, y - 4], [x - 7, y + 4]]);
    line([[x + 7, y + 4], [x + 17, y - 4], [x + 27, y + 4]]);
  };
  const laugh = (x: number, y: number) => {
    oval(x, y, 20, 22, '#332039');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, 17, 19, 0, 0, Math.PI * 2);
    ctx.clip();
    oval(x, y + 17, 17, 10, '#ff829c');
    ctx.restore();
  };

  // Bald eagle: spread brown wings, white feathered head and hooked gold beak.
  oval(91, 407, 27, 57, '#93542d');
  oval(205, 407, 27, 57, '#93542d');
  oval(148, 417, 49, 52, '#78442e');
  oval(148, 365, 55, 48, '#fff9e9');
  ctx.beginPath();
  ctx.moveTo(113, 389);
  ctx.lineTo(123, 418);
  ctx.lineTo(138, 406);
  ctx.lineTo(149, 423);
  ctx.lineTo(162, 406);
  ctx.lineTo(177, 416);
  ctx.lineTo(185, 389);
  ctx.fillStyle = '#fff9e9';
  ctx.fill();
  ctx.strokeStyle = '#232038';
  ctx.stroke();
  eyes(148, 356);
  ctx.beginPath();
  ctx.moveTo(143, 369);
  ctx.quadraticCurveTo(187, 364, 178, 390);
  ctx.lineTo(163, 384);
  ctx.lineTo(142, 384);
  ctx.closePath();
  ctx.fillStyle = '#ffcb48';
  ctx.fill();
  ctx.stroke();
  laugh(150, 396);
  oval(124, 465, 15, 7, '#ffcb48');
  oval(171, 465, 15, 7, '#ffcb48');

  // Turtle: flippers, patterned domed shell, long neck and laughing green head.
  oval(321, 452, 23, 13, '#a4dc79');
  oval(403, 452, 23, 13, '#a4dc79');
  oval(365, 420, 67, 43, '#53894d');
  ctx.beginPath();
  ctx.moveTo(352, 389);
  ctx.lineTo(377, 389);
  ctx.lineTo(391, 415);
  ctx.lineTo(377, 438);
  ctx.lineTo(351, 438);
  ctx.lineTo(337, 415);
  ctx.closePath();
  ctx.fillStyle = '#a2c765';
  ctx.fill();
  ctx.stroke();
  line([[337, 415], [302, 412]]);
  line([[352, 389], [340, 380]]);
  line([[351, 438], [336, 455]]);
  line([[377, 438], [393, 455]]);
  oval(421, 416, 22, 31, '#a4dc79');
  oval(419, 365, 47, 43, '#b8e88a');
  eyes(419, 351);
  laugh(419, 379);

  // Static laughter remains readable when reduced motion is enabled.
  ctx.font = '900 29px sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#232038';
  ctx.lineWidth = 7;
  ctx.fillStyle = '#fff5b8';
  for (const [x, y] of [[115, 306], [405, 306]]) {
    ctx.strokeText('HA!', x, y);
    ctx.fillText('HA!', x, y);
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
      shader.uniforms.laughingAnimals = { value: texture };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vAnimalUv;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvAnimalUv = uv;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D laughingAnimals;\nvarying vec2 vAnimalUv;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec4 animals = texture2D(laughingAnimals, vAnimalUv);
          diffuseColor.rgb = mix(diffuseColor.rgb, animals.rgb, animals.a);`);
    };
    material.customProgramCacheKey = () => cacheKey + ':laughing-animals-v1';
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
