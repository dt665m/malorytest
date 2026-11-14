import * as THREE from 'three';

// Six square faces, twelve beveled edges, and eight triangular corners.
// Keep the six BoxGeometry material groups so face textures can be reused.
export function createFacetedCubeGeometry() {
  const half = 0.5;
  const inset = 0.36;
  const positions: number[] = [];
  const uvs: number[] = [];
  const geometry = new THREE.BufferGeometry();

  const addFace = (points: THREE.Vector3[]) => {
    const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector3())
      .divideScalar(points.length);
    const normal = new THREE.Vector3().subVectors(points[1], points[0])
      .cross(new THREE.Vector3().subVectors(points[2], points[0]));
    if (normal.dot(center) < 0) points.reverse();

    // Assign bevels to their nearest principal face (ties are deterministic).
    const magnitudes = center.toArray().map(Math.abs);
    const axis = magnitudes.indexOf(Math.max(...magnitudes));
    const positive = center.getComponent(axis) > 0;
    const materialIndex = axis * 2 + (positive ? 0 : 1);
    const start = positions.length / 3;
    const addVertex = (point: THREE.Vector3) => {
      positions.push(point.x, point.y, point.z);
      // Match BoxGeometry's UV orientation on each of its six main faces.
      const u = axis === 0 ? (positive ? -point.z : point.z)
        : axis === 1 ? point.x : (positive ? point.x : -point.x);
      const v = axis === 1 ? (positive ? -point.z : point.z) : point.y;
      // The entire artwork fits on each square; bevels extend its edge pixels.
      uvs.push(
        THREE.MathUtils.clamp(u / (2 * inset) + 0.5, 0, 1),
        THREE.MathUtils.clamp(v / (2 * inset) + 0.5, 0, 1),
      );
    };
    for (let i = 1; i < points.length - 1; i++) {
      [points[0], points[i], points[i + 1]].forEach(addVertex);
    }
    geometry.addGroup(start, positions.length / 3 - start, materialIndex);
  };

  // Original cube faces, inset to leave room for the bevels.
  for (let axis = 0; axis < 3; axis++) {
    for (const sign of [-1, 1]) {
      addFace([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
        const point = new THREE.Vector3();
        point.setComponent(axis, sign * half);
        point.setComponent((axis + 1) % 3, a * inset);
        point.setComponent((axis + 2) % 3, b * inset);
        return point;
      }));
    }
  }

  // Each edge joins two adjacent inset square faces.
  for (let axis = 0; axis < 3; axis++) {
    for (const a of [-1, 1]) {
      for (const b of [-1, 1]) {
        addFace([[half, inset, -inset], [inset, half, -inset],
          [inset, half, inset], [half, inset, inset]].map(([x, y, z]) => {
          const point = new THREE.Vector3();
          point.setComponent(axis, z);
          point.setComponent((axis + 1) % 3, a * x);
          point.setComponent((axis + 2) % 3, b * y);
          return point;
        }));
      }
    }
  }

  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        addFace([
          new THREE.Vector3(x * half, y * inset, z * inset),
          new THREE.Vector3(x * inset, y * half, z * inset),
          new THREE.Vector3(x * inset, y * inset, z * half),
        ]);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
