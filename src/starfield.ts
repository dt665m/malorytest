import * as THREE from 'three';

// A separate, static sky layer: leave scene.background and foreground objects
// alone so space, galaxy, and scenery backgrounds can compose with these stars.
export function createStarfield() {
  const positions = new Float32Array(2400 * 3);
  let seed = 153;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let index = 0; index < positions.length; index += 3) {
    const y = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const ring = Math.sqrt(1 - y * y);
    positions[index] = 45 * ring * Math.cos(angle);
    positions[index + 1] = 45 * y;
    positions[index + 2] = 45 * ring * Math.sin(angle);
  }

  // Soft circular points without downloading an asset or adding animation.
  const size = 16;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const radius = Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1);
      pixels.set([255, 255, 255, Math.round(Math.max(0, 1 - radius) * 255)], offset);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: '#e4ecff',
    size: 2.5,
    sizeAttenuation: false,
    map: texture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    toneMapped: false,
  });
  const stars = new THREE.Points(geometry, material);
  stars.name = 'background-stars';

  return {
    stars,
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
