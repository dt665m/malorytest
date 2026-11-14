import * as THREE from 'three';

/** Attach eight shared-resource apples in the cube's local coordinate space. */
export function addCornerApples(cube: THREE.Mesh) {
  cube.geometry.computeBoundingBox();
  const bounds = cube.geometry.boundingBox!;
  const center = bounds.getCenter(new THREE.Vector3());
  // Raycast in local space so rounded/beveled shapes keep apples on their surface.
  // Reuse the geometry/material array without modifying its UVs or shader layers.
  const surface = new THREE.Mesh(cube.geometry, cube.material);
  const raycaster = new THREE.Raycaster();
  const body = new THREE.LatheGeometry([
    new THREE.Vector2(0, -0.075),
    new THREE.Vector2(0.035, -0.09),
    new THREE.Vector2(0.075, -0.065),
    new THREE.Vector2(0.105, -0.015),
    new THREE.Vector2(0.11, 0.035),
    new THREE.Vector2(0.09, 0.075),
    new THREE.Vector2(0.05, 0.085),
    new THREE.Vector2(0.02, 0.065),
    new THREE.Vector2(0, 0.065),
  ], 32);
  const stem = new THREE.CylinderGeometry(0.009, 0.012, 0.07, 8);
  const leaf = new THREE.SphereGeometry(1, 12, 8);
  const skin = new THREE.MeshStandardMaterial({ color: '#e63235', roughness: 0.3 });
  const wood = new THREE.MeshStandardMaterial({ color: '#654024' });
  const green = new THREE.MeshStandardMaterial({ color: '#4baf36', roughness: 0.6 });
  const apples = new THREE.Group();
  apples.name = 'corner-apples';

  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const apple = new THREE.Group();
        const corner = new THREE.Vector3(x, y, z);
        const outward = corner.clone().sub(center);
        raycaster.set(center.clone().addScaledVector(outward, 2), outward.clone().normalize().negate());
        const hit = raycaster.intersectObject(surface, false)[0];
        apple.position.copy(hit?.point ?? corner);
        const stalk = new THREE.Mesh(stem, wood);
        stalk.position.set(0, 0.105, 0);
        stalk.rotation.z = -0.2;
        const foliage = new THREE.Mesh(leaf, green);
        foliage.scale.set(0.045, 0.012, 0.021);
        foliage.position.set(0.037, 0.125, 0);
        foliage.rotation.z = 0.4;
        apple.add(new THREE.Mesh(body, skin), stalk, foliage);
        apples.add(apple);
      }
    }
  }
  cube.add(apples);

  return () => {
    cube.remove(apples);
    for (const geometry of [body, stem, leaf]) geometry.dispose();
    for (const material of [skin, wood, green]) material.dispose();
  };
}
