import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createCatTexture } from './catTexture';
import { addLaughingAnimals } from './laughingAnimals';
import { applyRubiksPanels } from './rubiksPanels';
import { createLegoFlowers } from './legoFlowers';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111318');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    // Round the cube into a sphere while retaining all six material groups and
    // their UVs, so each surface can still carry independently refreshed imagery.
    const geometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);
    const positions = geometry.getAttribute('position');
    const normals = geometry.getAttribute('normal');
    const direction = new THREE.Vector3();
    for (let index = 0; index < positions.count; index += 1) {
      direction.fromBufferAttribute(positions, index).normalize();
      normals.setXYZ(index, direction.x, direction.y, direction.z);
      positions.setXYZ(index, direction.x * 0.75, direction.y * 0.75, direction.z * 0.75);
    }
    const cats = Array.from({ length: 6 }, (_, face) => createCatTexture(face));
    const materials = cats.map(({ texture }) => new THREE.MeshStandardMaterial({ color: '#9333ea', map: texture }));
    materials.forEach(applyRubiksPanels);
    const disposeAnimals = addLaughingAnimals(materials);
    const cube = new THREE.Mesh(geometry, materials);
    cube.rotation.set(0.4, 0.5, 0);
    // Keep the orbit and jump independent of the geometry and local rotation.
    const orbitRadius = 0.65;
    const jumpHeight = 0.65;
    const orbit = new THREE.Group();
    const jumpRoot = new THREE.Group();
    orbit.position.x = orbitRadius;
    jumpRoot.add(cube);
    orbit.add(jumpRoot);
    scene.add(orbit, new THREE.HemisphereLight(0xffffff, 0x334155, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 5, 4);
    scene.add(light);

    const flowers = createLegoFlowers();
    scene.add(flowers.group);

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = canvas;
      camera.aspect = width / height;
      // Fit the jumping orbit and the stationary flower border in either orientation.
      const orbitExtent = orbitRadius + jumpHeight + Math.sqrt(3) / 2;
      const flowerBounds = new THREE.Box3().setFromObject(flowers.group);
      const flowerExtent = Math.max(
        Math.abs(flowerBounds.min.x), Math.abs(flowerBounds.max.x),
        Math.abs(flowerBounds.min.y), Math.abs(flowerBounds.max.y),
      );
      const sceneExtent = Math.max(orbitExtent, flowerExtent);
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      camera.position.z = Math.max(
        5,
        sceneExtent * 1.15 / (Math.sin(halfFov) * Math.min(camera.aspect, 1)),
      );
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };
    resize();
    window.addEventListener('resize', resize);

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    let catTurn = 0;
    const animate = (time: number) => {
      const elapsed = (time - start) / 1000;
      const orbitAngle = elapsed * 0.5;
      orbit.position.set(
        Math.cos(orbitAngle) * orbitRadius,
        Math.sin(orbitAngle) * orbitRadius,
        0,
      );
      cube.rotation.x = 0.4 + elapsed * 0.3;
      cube.rotation.y = 0.5 + elapsed * 0.5;
      // One turn is a full revolution around the primary (Y) rotation axis.
      // Derive it from the angle so skipped frames cannot miss a refresh.
      const turn = Math.floor((cube.rotation.y - 0.5) / (Math.PI * 2));
      if (turn !== catTurn) {
        catTurn = turn;
        cats.forEach((cat) => cat.refresh(turn));
      }
      // One-second parabolic hop, followed by a short pause at the orbit.
      const jumpProgress = Math.min(elapsed % 1.6, 1);
      jumpRoot.position.y = 4 * jumpHeight * jumpProgress * (1 - jumpProgress);

      renderer.render(scene, camera);
    };
    const updateMotion = () => {
      renderer.setAnimationLoop(motion.matches ? null : animate);
      if (motion.matches) {
        jumpRoot.position.y = 0;
        renderer.render(scene, camera);
      }
    };
    updateMotion();
    motion.addEventListener('change', updateMotion);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize);
      motion.removeEventListener('change', updateMotion);
      disposeAnimals();
      flowers.dispose();
      geometry.dispose();
      materials.forEach((material) => material.dispose());
      cats.forEach(({ texture }) => texture.dispose());
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} role="img" aria-label="A rotating, jumping purple sphere moving in a circle with six Rubik’s-style 3×3 panelled regions, each with a cat, laughing eagle and laughing turtle; the cats change every full turn; surrounded by colorful brick-built flowers" />;
}
