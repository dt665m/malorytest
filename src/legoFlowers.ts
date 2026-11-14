import * as THREE from 'three';

// A stationary border, independent of the central object's shape and motion.
export function createLegoFlowers() {
  const group = new THREE.Group();
  const brick = new THREE.BoxGeometry(1, 1, 1);
  const stud = new THREE.CylinderGeometry(0.055, 0.055, 0.055, 16);
  // Studs project toward the viewer rather than up the stems.
  stud.rotateX(Math.PI / 2);
  const colors = ['#fa679e', '#ffab38', '#ad8aff', '#54cfea'];
  const petals = colors.map(color => new THREE.MeshStandardMaterial({
    color, roughness: 0.32,
  }));
  const green = new THREE.MeshStandardMaterial({ color: '#33994b', roughness: 0.4 });
  const yellow = new THREE.MeshStandardMaterial({ color: '#ffdb49', roughness: 0.32 });

  function addBrick(
    parent: THREE.Group, material: THREE.Material,
    x: number, y: number, width: number, height: number,
  ) {
    const block = new THREE.Mesh(brick, material);
    block.position.set(x, y, 0);
    block.scale.set(width, height, 0.12);
    parent.add(block);
    const knob = new THREE.Mesh(stud, material);
    knob.position.set(x, y, 0.085);
    parent.add(knob);
  }

  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const flower = new THREE.Group();
    flower.position.set(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, -0.25);
    flower.rotation.z = Math.sin(angle * 3) * 0.15;
    group.add(flower);

    addBrick(flower, green, 0, -0.4, 0.1, 0.7);
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group();
      leaf.position.set(side * 0.12, -0.46, 0);
      leaf.rotation.z = -side * Math.PI / 4;
      addBrick(leaf, green, 0, 0, 0.14, 0.32);
      flower.add(leaf);
    }

    for (let petal = 0; petal < 6; petal++) {
      const tile = new THREE.Group();
      tile.rotation.z = (petal / 6) * Math.PI * 2;
      addBrick(tile, petals[i % petals.length], 0, 0.22, 0.19, 0.28);
      flower.add(tile);
    }
    const center = new THREE.Group();
    center.position.z = 0.09;
    addBrick(center, yellow, 0, 0, 0.21, 0.21);
    flower.add(center);
  }

  return {
    group,
    dispose() {
      brick.dispose();
      stud.dispose();
      for (const material of [...petals, green, yellow]) material.dispose();
    },
  };
}
