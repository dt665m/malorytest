import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { addGigachadTheme } from './gigachadTheme';
import { createMathCube } from './mathCube';
import { createCatTexture } from './catTexture';
import { addCatEyes } from './catEyes';
import { addLaughingAnimals } from './laughingAnimals';
import { applyRubiksPanels } from './rubiksPanels';
import { createLegoFlowers } from './legoFlowers';
import { createFacetedCubeGeometry } from './createFacetedCubeGeometry';
import { createSpaceBackground } from './spaceBackground';
import { createGalaxyBackground } from './galaxyBackground';

type BackgroundMode = 'galaxy' | 'space' | 'original';

const cubePalettes = {
  oman: ['#db161b', '#db161b', '#ffffff', '#ffffff', '#008000', '#008000'],
  blue: Array<string>(6).fill('#246bff'),
  purple: Array<string>(6).fill('#9333ea'),
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundMode = useRef<BackgroundMode>('galaxy');
  const changeBackground = useRef<(mode: BackgroundMode) => void>(() => {});
  // Preserve the spherical mode; opt into the additional faces with ?shape=faceted.
  const parameters = new URLSearchParams(window.location.search);
  const requestedPalette = parameters.get('cubeColors');
  const palette = requestedPalette === 'blue' || requestedPalette === 'purple'
    ? requestedPalette
    : 'oman';
  const colourDescription = palette === 'oman' ? 'Omani flag-coloured (red, white and green)' : palette;
  const faceted = parameters.get('shape') === 'faceted';
  // Keep all existing themes intact by opting into the translucent math view.
  const gigachadMode = parameters.get('theme') === 'gigachad';
  const mathMode = parameters.get('theme') === 'math';
  const shapeDescription = faceted ? '26-face beveled cubes' : mathMode ? 'cubes' : 'spheres';
  const sceneDescription = `Two rotating, jumping ${colourDescription} jelly ${shapeDescription} with Saturn-like rings that bounce, squash and wobble moving in a circle with six Rubik’s-style 3×3 panelled regions, each with a golden slit-eyed cat, laughing eagle and laughing turtle; the cats change every full turn; surrounded by colorful brick-built flowers against a star-filled space sky${gigachadMode ? '; with monochrome Gigachad portraits layered on each region' : ''}`;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    const spaceBackground = createSpaceBackground();
    const galaxy = createGalaxyBackground();
    scene.add(galaxy);
    const applyBackground = () => {
      galaxy.visible = backgroundMode.current === 'galaxy';
      scene.background = backgroundMode.current === 'space'
        ? spaceBackground
        : new THREE.Color('#111318');
    };
    applyBackground();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    // Round the cube into a sphere while retaining all six material groups and
    // their UVs, so each surface can still carry independently refreshed imagery.
    const geometry = faceted
      ? createFacetedCubeGeometry()
      : new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);
    if (!faceted && !mathMode) {
      const positions = geometry.getAttribute('position');
      const normals = geometry.getAttribute('normal');
      const direction = new THREE.Vector3();
      for (let index = 0; index < positions.count; index += 1) {
        direction.fromBufferAttribute(positions, index).normalize();
        normals.setXYZ(index, direction.x, direction.y, direction.z);
        positions.setXYZ(index, direction.x * 0.75, direction.y * 0.75, direction.z * 0.75);
      }
    }
    const cats = Array.from({ length: 6 }, (_, face) => createCatTexture(face));
    // Preserve the six geometry groups, UV maps and every layered animal effect.
    const materials = cats.map(({ texture }, face) => new THREE.MeshStandardMaterial({
      color: cubePalettes[palette][face],
      map: texture,
    }));
    materials.forEach(applyRubiksPanels);
    const disposeAnimals = addLaughingAnimals(materials);
    const disposeCatEyes = addCatEyes(materials);
    const disposeGigachadTheme = gigachadMode ? addGigachadTheme(materials) : null;
    const cube = new THREE.Mesh(geometry, materials);
    // Retain the six materials, their maps, and all layered shader effects.
    const math = mathMode ? createMathCube() : null;
    if (math) {
      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = 0.18;
        material.depthWrite = false;
      });
      cube.add(math.group);
    }
    let angle = 45;
    const describeMath = () => {
      const sky = backgroundMode.current === 'galaxy'
        ? 'against a galaxy with two black holes'
        : backgroundMode.current === 'space' ? 'against a star-filled space sky' : 'against a dark sky';
      canvas.setAttribute('aria-label',
        sceneDescription.replace('against a star-filled space sky', sky)
        + (math ? '. ' + math.update(angle) : ''));
    };
    describeMath();
    changeBackground.current = (mode) => {
      backgroundMode.current = mode;
      applyBackground();
      describeMath();
      // Also update immediately when reduced motion has stopped the loop.
      renderer.render(scene, camera);
    };
    const changeAngle = (step: number) => {
      angle = (angle + step + 360) % 360;
      describeMath();
      renderer.render(scene, camera);
    };
    const onClick = () => changeAngle(15);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        changeAngle(event.key === 'ArrowLeft' ? -15 : 15);
      }
    };
    if (math) {
      canvas.addEventListener('click', onClick);
      canvas.addEventListener('keydown', onKeyDown);
    }

    cube.rotation.set(0.4, 0.5, 0);
    // Keep the rings attached to the cube so they share its motion.
    // Separate annuli leave visible gaps like Saturn's ring divisions.
    const ringBands = [
      { inner: 0.95, outer: 1.22, color: '#d6bd89' },
      { inner: 1.25, outer: 1.38, color: '#a68b65' },
      { inner: 1.42, outer: 1.6, color: '#ead8b1' },
    ];
    const rings = ringBands.map(({ inner, outer, color }) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 128),
        new THREE.MeshStandardMaterial({
          color,
          side: THREE.DoubleSide,
          roughness: 1,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      cube.add(ring);
      return ring;
    });
    // Cloning also shares ring geometry/materials; dispose those only once.
    // Share the six layered materials so both objects receive every cat refresh.
    const secondCube = cube.clone();
    const objectOffset = 2.1;
    // Deform each object independently without stretching their separation or orbit.
    const jellyRoots = [cube, secondCube].map((object, index) => {
      const root = new THREE.Group();
      root.position.x = index === 0 ? -objectOffset : objectOffset;
      root.add(object);
      return root;
    });
    // Keep the orbit and jump independent of the geometry and local rotation.
    const orbitRadius = 0.65;
    const jumpHeight = 0.65;
    const orbit = new THREE.Group();
    const jumpRoot = new THREE.Group();
    orbit.position.x = orbitRadius;
    jumpRoot.add(...jellyRoots);
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
      galaxy.material.uniforms.aspect.value = camera.aspect;
      // Fit both jumping ring systems (including jelly stretch), their orbit, and the stationary flower border in either orientation.
      const orbitExtent = objectOffset + orbitRadius + jumpHeight + 0.45 + 2.0;
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
      secondCube.rotation.copy(cube.rotation);
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

      const phase = (elapsed % 1.8) / 1.8;
      const lift = Math.sin(Math.PI * phase) ** 2;
      // Periodic curves keep the jelly bounce seamless and frame-rate independent.
      const impact = Math.exp(-lift * 18);
      const wobble = Math.sin(phase * Math.PI * 8) * Math.exp(-lift * 5);
      const height = 1 + 0.14 * lift - 0.28 * impact + 0.06 * wobble;
      const width = 1 / Math.sqrt(height);
      jellyRoots.forEach((root) => {
        root.scale.set(width, height, width);
        root.position.y = -0.45 + lift * 0.9;
        root.rotation.z = wobble * 0.06;
      });
      renderer.render(scene, camera);
    };
    const updateMotion = () => {
      renderer.setAnimationLoop(motion.matches ? null : animate);
      if (motion.matches) {
        jumpRoot.position.y = 0;
        jellyRoots.forEach((root) => {
          root.position.y = 0;
          root.scale.set(1, 1, 1);
          root.rotation.set(0, 0, 0);
        });
        renderer.render(scene, camera);
      }
    };
    updateMotion();
    motion.addEventListener('change', updateMotion);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize);
      motion.removeEventListener('change', updateMotion);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('keydown', onKeyDown);
      // The cloned object's diagram shares these resources; dispose only once.
      math?.dispose();
      disposeGigachadTheme?.();
      disposeCatEyes();
      disposeAnimals();
      flowers.dispose();
      for (const ring of rings) {
        ring.geometry.dispose();
        ring.material.dispose();
      }
      geometry.dispose();
      materials.forEach((material) => material.dispose());
      cats.forEach(({ texture }) => texture.dispose());
      spaceBackground.dispose();
      galaxy.geometry.dispose();
      galaxy.material.dispose();
      changeBackground.current = () => {};
      renderer.dispose();
    };
  }, [faceted, mathMode, gigachadMode, palette, sceneDescription]);

  return <>
    <canvas ref={canvasRef} tabIndex={mathMode ? 0 : undefined} role="img" aria-label={sceneDescription} />
    <label className="background-selector">
      Background
      <select defaultValue={backgroundMode.current} onChange={(event) => {
        const mode = event.target.value;
        if (mode === 'galaxy' || mode === 'space' || mode === 'original') {
          changeBackground.current(mode);
        }
      }}>
        <option value="galaxy">Galaxy & black holes</option>
        <option value="space">Star-filled space</option>
        <option value="original">Original dark</option>
      </select>
    </label>
  </>;
}
