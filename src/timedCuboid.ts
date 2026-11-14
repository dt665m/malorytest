import * as THREE from 'three';

export const CUBOID_DELAY_MS = 120_000;
const WIDTH = 1.8;
const HEIGHT = 1;
const DEPTH = 1;
export const CUBOID_RADIUS = Math.hypot(WIDTH, HEIGHT, DEPTH) / 2;

/** A separate geometry and text layer leave existing materials and artwork intact. */
export function createTimedCuboid() {
  const geometry = new THREE.BoxGeometry(WIDTH, HEIGHT, DEPTH);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.font = '900 104px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.lineWidth = 12;
  context.strokeStyle = '#111318';
  context.fillStyle = '#ffffff';
  context.strokeText('67', 128, 68);
  context.fillText('67', 128, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const labelGeometry = new THREE.PlaneGeometry(0.65, 0.27);
  const labels = new THREE.Group();
  labels.visible = false;
  // Every face carries upright, high-contrast text so rotation cannot hide it.
  // Place it above the central cats and the animals along the lower edge.
  for (const [x, y, z, distance] of [
    [1, 0, 0, WIDTH / 2], [-1, 0, 0, WIDTH / 2],
    [0, 1, 0, HEIGHT / 2], [0, -1, 0, HEIGHT / 2],
    [0, 0, 1, DEPTH / 2], [0, 0, -1, DEPTH / 2],
  ]) {
    const normal = new THREE.Vector3(x, y, z);
    const face = new THREE.Group();
    face.position.copy(normal).multiplyScalar(distance + 0.004);
    face.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    const label = new THREE.Mesh(labelGeometry, material);
    label.position.y = 0.32;
    face.add(label);
    labels.add(face);
  }
  return {
    geometry,
    labels,
    dispose() {
      geometry.dispose();
      labelGeometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
