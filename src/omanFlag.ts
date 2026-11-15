import * as THREE from 'three';
import flagUrl from './assets/oman-flag.svg?url';

// Local artwork from https://flagcdn.com/om.svg (Oman's national flag).
// Keep the full artwork, including the white khanjar and crossed swords;
// stripes alone would be an inaccurate substitute.
export function createOmanFlag(onLoad: () => void) {
  const object = new THREE.Group();
  object.name = 'oman-flag';
  object.position.set(0.82, 0.1, 0.65);

  let disposed = false;
  const texture = new THREE.TextureLoader().load(flagUrl, () => {
    // A late image load must not render into an unmounted scene.
    if (!disposed) onLoad();
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  const clothMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  // Preserve the source artwork's 1050 × 600 aspect ratio without stretching
  // its national emblem. The hoist meets the pole along the entire left edge.
  const clothGeometry = new THREE.PlaneGeometry(0.91, 0.52);
  const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
  cloth.position.set(0.455, 1.54, 0);
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: '#cbd5e1', metalness: 0.65, roughness: 0.35,
  });
  const poleGeometry = new THREE.CylinderGeometry(0.018, 0.018, 1.85, 12);
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 0.925;
  object.add(pole, cloth);

  return {
    object,
    // The second planet shares these resources via Object3D.clone().
    dispose() {
      disposed = true;
      texture.dispose();
      clothGeometry.dispose();
      clothMaterial.dispose();
      poleGeometry.dispose();
      poleMaterial.dispose();
    },
  };
}
