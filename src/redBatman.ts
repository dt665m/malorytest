import * as THREE from 'three';

// Local-space accessories follow the existing object's shape and animation.
export function addRedBatman(parent: THREE.Object3D) {
  const costume = new THREE.Group();
  costume.name = 'red-batman-costume';
  parent.add(costume);

  const red = new THREE.MeshStandardMaterial({ color: '#c41430', roughness: 0.65 });
  const darkRed = new THREE.MeshStandardMaterial({
    color: '#650c20',
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  const black = new THREE.MeshStandardMaterial({ color: '#170c13', side: THREE.DoubleSide });
  const white = new THREE.MeshStandardMaterial({
    color: '#fff4e7',
    emissive: '#fff4e7',
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const polygon = (
    points: [number, number][],
    material: THREE.Material,
    z: number,
  ) => {
    const shape = new THREE.Shape();
    shape.moveTo(...points[0]);
    points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
    mesh.position.z = z;
    costume.add(mesh);
    return mesh;
  };

  // Tall, pointed cowl ears make the silhouette recognizable from every angle.
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.62, 4), red);
    ear.position.set(side * 0.43, 0.77, 0);
    ear.rotation.z = -side * 0.12;
    costume.add(ear);
  }

  // A broad, scalloped cape sits behind the rounded body.
  polygon([
    [-0.42, 0.46], [-0.79, 0.07], [-1.04, -0.88],
    [-0.7, -0.68], [-0.47, -0.94], [-0.23, -0.76],
    [0, -1.01], [0.23, -0.76], [0.47, -0.94],
    [0.7, -0.68], [1.04, -0.88], [0.79, 0.07], [0.42, 0.46],
  ], darkRed, -0.38);

  // Angular white eye slits on the front of the red cowl.
  polygon([[-0.45, 0.34], [-0.1, 0.25], [-0.16, 0.16], [-0.37, 0.2]], white, 0.7);
  polygon([[0.45, 0.34], [0.1, 0.25], [0.16, 0.16], [0.37, 0.2]], white, 0.7);

  // Bat chest emblem: pointed ears, outstretched wings and a tapered tail.
  polygon([
    [-0.06, -0.13], [-0.055, -0.035], [0, -0.085], [0.055, -0.035],
    [0.06, -0.13], [0.18, -0.18], [0.42, -0.09], [0.34, -0.3],
    [0.24, -0.26], [0.18, -0.36], [0.1, -0.31], [0, -0.46],
    [-0.1, -0.31], [-0.18, -0.36], [-0.24, -0.26], [-0.34, -0.3],
    [-0.42, -0.09], [-0.18, -0.18],
  ], black, 0.74);

  return () => {
    parent.remove(costume);
    costume.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    red.dispose();
    darkRed.dispose();
    black.dispose();
    white.dispose();
  };
}
