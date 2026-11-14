import * as THREE from 'three';

type Point = [number, number, number];

// Six square sheets begin as the faces of a cube. Four become wings;
// the other two fold into the narrow, faceted body.
export function createOrigami(materials: THREE.MeshStandardMaterial[]) {
  const group = new THREE.Group();
  const faces: Point[][] = [
    [[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]],
    [[.5, -.5, -.5], [-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5]],
    [[.5, -.5, .5], [.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5]],
    [[-.5, -.5, -.5], [-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5]],
    [[-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5], [-.5, .5, -.5]],
    [[-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5], [-.5, -.5, .5]],
  ];
  const wings: Point[][] = [];
  for (const side of [-1, 1]) {
    wings.push(
      [[side * .06, .28, 0], [side * 1.45, 1.02, .02], [side * 1.18, -.08, .06], [side * .08, -.2, 0]],
      [[side * .08, -.05, 0], [side * 1.1, -.25, .06], [side * .7, -.95, -.08], [side * .04, -.5, 0]],
    );
  }
  wings.push(
    [[0, .5, .09], [.095, .03, .06], [0, -.65, .07], [-.095, .03, .06]],
    [[0, .5, -.06], [-.095, .03, .06], [0, -.65, -.05], [.095, .03, .06]],
  );
  const sheets = faces.map((corners, index) => {
    const center = (points: Point[], ridge = 0): Point => [
      points.reduce((sum, p) => sum + p[0], 0) / 4,
      points.reduce((sum, p) => sum + p[1], 0) / 4,
      points.reduce((sum, p) => sum + p[2], 0) / 4 + ridge,
    ];
    const source = [...corners, center(corners)];
    const target = [...wings[index], center(wings[index], index < 4 ? .18 : .035)];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(source.flat(), 3));
    // Face-local UVs stay attached to the paper throughout the unfolding.
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([
      0, 0, 1, 0, 1, 1, 0, 1, .5, .5,
    ], 2));
    geometry.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
    geometry.computeVertexNormals();
    // Clone the paper's render properties, sharing maps but not ownership.
    // Three's clone does not copy shader hooks: retain every composited layer.
    const sourceMaterial = materials[index];
    const material = sourceMaterial.clone();
    material.onBeforeCompile = sourceMaterial.onBeforeCompile;
    material.customProgramCacheKey = sourceMaterial.customProgramCacheKey;
    material.side = THREE.DoubleSide;
    material.roughness = .88;
    material.flatShading = true;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false; // The sheets move beyond their initial cube bounds.
    group.add(mesh);
    return { geometry, material, source, target };
  });
  const antennaMaterial = new THREE.LineBasicMaterial({ color: '#fff0cc' });
  const antennae = new THREE.Group();
  const antennaGeometries = [-1, 1].map(side => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, .4, .08), new THREE.Vector3(side * .12, .67, .08),
      new THREE.Vector3(side * .24, .75, .06),
    ]);
    antennae.add(new THREE.Line(geometry, antennaMaterial));
    return geometry;
  });
  group.add(antennae);

  return {
    group,
    update(progress: number, time: number, reducedMotion: boolean) {
      const unfold = progress * progress * (3 - 2 * progress);
      const flap = reducedMotion ? .24 : .24 + Math.sin(time * 2.1) * .22;
      sheets.forEach(({ geometry, source, target }, face) => {
        const position = geometry.getAttribute('position');
        target.forEach(([x, y, z], vertex) => {
          // Mirrored wing hinges lift both tips, retaining the mountain folds.
          const wingX = face < 4 ? x * Math.cos(flap) : x;
          const wingZ = face < 4 ? z + Math.abs(x) * Math.sin(flap) : z;
          position.setXYZ(vertex,
            THREE.MathUtils.lerp(source[vertex][0], wingX, unfold),
            THREE.MathUtils.lerp(source[vertex][1], y, unfold),
            THREE.MathUtils.lerp(source[vertex][2], wingZ, unfold));
        });
        position.needsUpdate = true;
        geometry.computeVertexNormals();
      });
      antennae.scale.setScalar(unfold);
      group.rotation.set(-.14, reducedMotion ? -.15 : Math.sin(time * .35) * .2, .06);
      group.position.y = reducedMotion ? 0 : Math.sin(time * 1.1) * .06 * unfold;
    },
    dispose() {
      sheets.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); });
      antennaGeometries.forEach(geometry => geometry.dispose());
      antennaMaterial.dispose();
    },
  };
}
