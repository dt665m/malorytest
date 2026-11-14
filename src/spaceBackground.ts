import * as THREE from 'three';

/** A self-contained, static sky: no downloads or additional animation loop. */
export function createSpaceBackground() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const context = canvas.getContext('2d')!;
  const size = canvas.width;

  // Seeded randomness keeps the sky stable across remounts and hot reloads.
  let seed = 135;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  context.fillStyle = '#030610';
  context.fillRect(0, 0, size, size);

  // Broad, translucent clouds leave the center dark so the subject stands out.
  for (let index = 0; index < 32; index += 1) {
    const x = random() * size;
    const y = size * (0.15 + x / size * 0.6) + (random() - 0.5) * 500;
    const radius = 150 + random() * 340;
    const cloud = context.createRadialGradient(x, y, 0, x, y, radius);
    const color = index % 2 === 0 ? '69, 41, 119' : '23, 72, 113';
    cloud.addColorStop(0, `rgba(${color}, 0.12)`);
    cloud.addColorStop(1, `rgba(${color}, 0)`);
    context.fillStyle = cloud;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const starColors = ['#e0ebff', '#ffffff', '#a9c9ff', '#ffe4c2'];
  for (let index = 0; index < 1800; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 0.45 + random() ** 4 * 1.8;
    if (radius > 1.7) {
      const glow = context.createRadialGradient(x, y, 0, x, y, radius * 5);
      glow.addColorStop(0, 'rgba(160, 196, 255, 0.35)');
      glow.addColorStop(1, 'rgba(160, 196, 255, 0)');
      context.fillStyle = glow;
      context.fillRect(x - radius * 5, y - radius * 5, radius * 10, radius * 10);
    }
    context.globalAlpha = 0.35 + random() * 0.65;
    context.fillStyle = starColors[Math.floor(random() * starColors.length)];
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
