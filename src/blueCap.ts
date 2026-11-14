import * as THREE from 'three';

// A local-space accessory: parenting it to the object preserves its motion
// and lets other surface treatments and scene decorations coexist with it.
export function createBlueCap() {
  const object = new THREE.Group();
  object.name = 'blue-baseball-cap';

  const crownMaterial = new THREE.MeshStandardMaterial({
    color: '#1455e8',
    roughness: 0.85,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: '#082d91',
    roughness: 0.9,
  });
  const seamMaterial = new THREE.MeshStandardMaterial({
    color: '#6399ff',
    roughness: 0.9,
  });

  const crownGeometry = new THREE.SphereGeometry(
    0.66, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2,
  );
  const crown = new THREE.Mesh(crownGeometry, crownMaterial);
  crown.position.y = 0.49;

  const bandGeometry = new THREE.CylinderGeometry(0.66, 0.66, 0.08, 32);
  const band = new THREE.Mesh(bandGeometry, trimMaterial);
  band.position.y = 0.49;

  // The flattened, forward-projecting bill makes the silhouette a baseball cap.
  const billGeometry = new THREE.SphereGeometry(0.72, 32, 12);
  const bill = new THREE.Mesh(billGeometry, crownMaterial);
  bill.scale.set(1, 0.055, 0.8);
  bill.position.set(0, 0.47, 0.48);

  const seamPoints = Array.from({ length: 33 }, (_, index) => {
    const angle = -Math.PI / 2 + (index / 32) * Math.PI;
    return new THREE.Vector3(
      0, 0.49 + Math.cos(angle) * 0.664, Math.sin(angle) * 0.664,
    );
  });
  const seamGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(seamPoints), 32, 0.007, 6, false,
  );
  const seam = new THREE.Mesh(seamGeometry, seamMaterial);

  const buttonGeometry = new THREE.SphereGeometry(0.055, 16, 8);
  const button = new THREE.Mesh(buttonGeometry, trimMaterial);
  button.scale.y = 0.5;
  button.position.y = 1.15;

  object.add(crown, band, bill, seam, button);

  return {
    object,
    dispose() {
      for (const geometry of [
        crownGeometry, bandGeometry, billGeometry, seamGeometry, buttonGeometry,
      ]) geometry.dispose();
      for (const material of [crownMaterial, trimMaterial, seamMaterial]) {
        material.dispose();
      }
    },
  };
}
