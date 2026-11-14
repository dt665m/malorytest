import * as THREE from 'three';

// Code-native silhouettes leave the original textured body and rings intact.
export function createAnimalForms() {
  const cat = new THREE.Group();
  const butterfly = new THREE.Group();
  const purple = new THREE.MeshStandardMaterial({ color: '#9333ea', roughness: 0.65 });
  const pink = new THREE.MeshStandardMaterial({ color: '#f5a3df' });
  const gold = new THREE.MeshStandardMaterial({ color: '#ffdf63' });
  const dark = new THREE.MeshStandardMaterial({ color: '#20102c' });
  const geometries = new Set<THREE.BufferGeometry>();
  const add = (parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material,
    x: number, y: number, z: number) => {
    geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  add(cat, new THREE.SphereGeometry(0.46, 24, 16), purple, 0, 0.65, 0.2);
  for (const side of [-1, 1]) {
    const ear = add(cat, new THREE.ConeGeometry(0.22, 0.48, 3), purple, side * 0.3, 1.06, 0.2);
    ear.rotation.z = -side * 0.2;
    add(cat, new THREE.ConeGeometry(0.12, 0.27, 3), pink, side * 0.3, 1.08, 0.31);
    const eye = add(cat, new THREE.SphereGeometry(0.1, 16, 12), gold, side * 0.18, 0.72, 0.6);
    eye.scale.set(1, 0.8, 0.4);
    const pupil = add(cat, new THREE.SphereGeometry(0.05, 12, 8), dark, side * 0.18, 0.72, 0.64);
    pupil.scale.set(0.35, 1, 0.4);
    for (const z of [-0.28, 0.35]) {
      const paw = add(cat, new THREE.SphereGeometry(0.19, 16, 12), purple, side * 0.34, -0.58, z);
      paw.scale.set(1, 0.75, 1.3);
    }
    for (const y of [0.48, 0.56]) {
      const whisker = add(cat, new THREE.BoxGeometry(0.34, 0.018, 0.018), gold, side * 0.4, y, 0.62);
      whisker.rotation.z = side * (y - 0.52);
    }
  }
  add(cat, new THREE.SphereGeometry(0.065, 12, 8), pink, 0, 0.53, 0.66);
  const tailPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.35, -0.25, -0.4),
    new THREE.Vector3(0.85, -0.1, -0.4),
    new THREE.Vector3(1.05, 0.45, -0.3),
    new THREE.Vector3(0.85, 0.65, -0.2),
  ]);
  add(cat, new THREE.TubeGeometry(tailPath, 24, 0.09, 8, false), purple, 0, 0, 0);

  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.x = side * 0.35;
    for (const y of [-0.38, 0.38]) {
      const lobe = add(wing, new THREE.SphereGeometry(0.65, 24, 16), y > 0 ? pink : gold,
        side * 0.55, y, 0);
      lobe.scale.set(1, 0.85, 0.12);
    }
    butterfly.add(wing);
  }
  return {
    cat, butterfly,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      [purple, pink, gold, dark].forEach((material) => material.dispose());
    },
  };
}
