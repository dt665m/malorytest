import * as THREE from 'three';

export type ShapeMode = 'sphere' | 'cube' | 'faceted' | 'butterfly' | 'cat' | 'rectangle' | 'animal-butterfly';

export function readShapeMode(search: string, fallback: 'sphere' | 'cube' = 'sphere'): ShapeMode {
  const shape = new URLSearchParams(search).get('shape');
  return shape === 'sphere' || shape === 'cube' || shape === 'faceted' || shape === 'butterfly'
    || shape === 'cat' || shape === 'rectangle' || shape === 'animal-butterfly'
    ? shape
    : fallback;
}

/** Both shapes retain six material groups and face-local UVs for the artwork. */
export function createShapeGeometry(shape: 'sphere' | 'cube') {
  if (shape === 'cube') return new THREE.BoxGeometry(1, 1, 1);

  // Project the subdivided cube onto a sphere without changing its UVs or groups.
  const geometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const direction = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    direction.fromBufferAttribute(positions, index).normalize();
    normals.setXYZ(index, direction.x, direction.y, direction.z);
    positions.setXYZ(index, direction.x * 0.75, direction.y * 0.75, direction.z * 0.75);
  }
  return geometry;
}
