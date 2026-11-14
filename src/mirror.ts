import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

// Reflect the whole scene, so additional objects and appearances work unchanged.
export function createMirror() {
  const group = new THREE.Group();
  const surfaceGeometry = new THREE.PlaneGeometry(13, 20);
  const surface = new Reflector(surfaceGeometry, {
    color: 0xdde6ef,
    textureWidth: 512,
    textureHeight: 512,
    clipBias: 0.003,
  });
  surface.rotation.x = -Math.PI / 2;
  // Below the flower border and the full animated ring/jelly envelope.
  surface.position.y = -3.6;
  group.add(surface);

  const frameGeometry = new THREE.BoxGeometry(13.15, 0.08, 20.15);
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x66758a,
    metalness: 0.8,
    roughness: 0.25,
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.y = -3.65;
  group.add(frame);

  return {
    group,
    resize(width: number, height: number, pixelRatio: number) {
      // Bound the extra render pass on large/high-density displays.
      surface.getRenderTarget().setSize(
        Math.max(1, Math.min(2048, Math.round(width * pixelRatio))),
        Math.max(1, Math.min(2048, Math.round(height * pixelRatio))),
      );
    },
    dispose() {
      surface.dispose();
      surfaceGeometry.dispose();
      frameGeometry.dispose();
      frameMaterial.dispose();
    },
  };
}
