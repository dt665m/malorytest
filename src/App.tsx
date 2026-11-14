import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createBlueCap } from './blueCap';
import { createOrigami } from './origami';
import { addRedBatman } from './redBatman';
import { addCornerApples } from './cornerApples';
import { addGigachadTheme } from './gigachadTheme';
import { createMathCube } from './mathCube';
import { createCatTexture } from './catTexture';
import { addCatEyes } from './catEyes';
import { addLaughingAnimals } from './laughingAnimals';
import { applyRubiksPanels } from './rubiksPanels';
import { createLegoFlowers } from './legoFlowers';
import { createShapeGeometry, readShapeMode } from './shapeGeometry';
import { createFacetedCubeGeometry } from './createFacetedCubeGeometry';
import { createSpaceBackground } from './spaceBackground';
import { createGalaxyBackground } from './galaxyBackground';

type BackgroundMode = 'galaxy' | 'space' | 'original';

const cubePalettes = {
  oman: ['#db161b', '#db161b', '#ffffff', '#ffffff', '#008000', '#008000'],
  blue: Array<string>(6).fill('#246bff'),
  purple: Array<string>(6).fill('#9333ea'),
  red: Array<string>(6).fill('#c41430'),
};
import { createMirror } from './mirror';
import { createStarfield } from './starfield';
import { createTimedCuboid, CUBOID_DELAY_MS, CUBOID_RADIUS } from './timedCuboid';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundMode = useRef<BackgroundMode>('galaxy');
  const changeBackground = useRef<(mode: BackgroundMode) => void>(() => {});
  // Preserve the spherical mode; opt into the additional faces with ?shape=faceted.
  const parameters = new URLSearchParams(window.location.search);
  const isRedBatman = parameters.get('theme') === 'red-batman';
  const requestedPalette = parameters.get('cubeColors');
  const palette = requestedPalette === 'blue' || requestedPalette === 'purple'
    ? requestedPalette
    : requestedPalette === 'oman' ? 'oman' : isRedBatman ? 'red' : 'oman';
  const colourDescription = palette === 'oman' ? 'Omani flag-coloured (red, white and green)' : palette;
  // Keep all existing themes intact by opting into the translucent math view.
  const gigachadMode = parameters.get('theme') === 'gigachad';
  const mathMode = parameters.get('theme') === 'math';
  const shape = readShapeMode(window.location.search, mathMode ? 'cube' : 'sphere');
  const initiallyButterfly = shape === 'butterfly';
  const faceted = shape === 'faceted';
  const isCube = shape === 'cube' || (initiallyButterfly && mathMode);
  const shapeDescription = faceted ? '26-face beveled cubes' : isCube ? 'cubes' : 'spheres';
  const sceneDescription = `Two rotating, jumping ${colourDescription} jelly ${shapeDescription} wearing blue baseball caps with an apple at each of eight corner directions and Saturn-like rings that bounce, squash and wobble moving in a circle with six Rubik’s-style 3×3 panelled regions, each with a golden slit-eyed cat, laughing eagle and laughing turtle; the cats change every full turn; surrounded by colorful brick-built flowers above a framed floor mirror reflecting the scene, against a star-filled space sky${gigachadMode ? '; with monochrome Gigachad portraits layered on each region' : ''}${isRedBatman ? '; wearing red Batman cowls with pointed ears, white eyes, bat emblems and capes' : ''}; an Omani desert eagle lands on the first object and pecks at it; with a five-second green tint every thirty seconds`;
  const [theme, setTheme] = useState<'oman-national-day' | 'original'>('oman-national-day');

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    const spaceBackground = createSpaceBackground();
    const galaxy = createGalaxyBackground();
    scene.add(galaxy);
    const starfield = createStarfield();
    scene.add(starfield.stars);
    const applyBackground = () => {
      // The galaxy already draws small stars and masks them at its event horizons.
      starfield.stars.visible = backgroundMode.current !== 'galaxy';
      galaxy.visible = backgroundMode.current === 'galaxy';
      scene.background = backgroundMode.current === 'space'
        ? spaceBackground
        : new THREE.Color('#111318');
    };
    applyBackground();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.5, 5);
    camera.lookAt(0, -0.35, 0);

    const mirror = createMirror();
    scene.add(mirror.group);

    // Keep shape selection independent of the shared artwork and accessories.
    // Explicit sphere mode also overrides the math theme's default cube shape.
    const geometry = faceted
      ? createFacetedCubeGeometry()
      : createShapeGeometry(isCube ? 'cube' : 'sphere');
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
    let butterflyMode = initiallyButterfly;
    let cuboidMode = false;
    let unfoldStart = performance.now();
    let angle = 45;
    const describeMath = () => {
      const sky = backgroundMode.current === 'galaxy'
        ? 'against a galaxy with two black holes'
        : backgroundMode.current === 'space' ? 'against a star-filled space sky' : 'against a dark sky';
      canvas.setAttribute('aria-label',
        sceneDescription.replace('against a star-filled space sky', sky)
        + (math ? '. ' + math.update(angle) : '')
        + (butterflyMode ? '. The surfaces unfold into gently flapping origami butterflies.' : '')
        + (cuboidMode && !butterflyMode ? '. Both objects are rectangular cuboids labelled 67.' : '')
        + ' After two minutes both become cuboids labelled 67. Press B for butterflies, S for the original shape, or R for the labelled cuboid.');
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

    const disposeCornerApples = addCornerApples(cube);
    // Add accessories without replacing any of the six layered materials or UVs.
    // The later clone shares costume resources, just like the rings and apples.
    const disposeCostume = isRedBatman ? addRedBatman(cube) : undefined;
    if (isRedBatman && faceted) {
      // Fit the smaller beveled cube; keep the eye/emblem planes above its face.
      const costume = cube.getObjectByName('red-batman-costume')!;
      costume.scale.setScalar(2 / 3);
      costume.position.z = 0.05;
    }
    const blueCap = createBlueCap();
    // Fit the smaller shapes, and keep the cowl's pointed ears exposed.
    const capScale = (faceted || isCube ? 0.8 : 1) * (isRedBatman ? 0.7 : 1);
    blueCap.object.scale.setScalar(capScale);
    blueCap.object.position.y = (faceted || isCube ? 0.5 : 0.49)
      - 0.49 * capScale + (isRedBatman ? 0.2 : 0);
    cube.add(blueCap.object);
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
    const cuboid = createTimedCuboid();
    const secondLabels = cuboid.labels.clone();
    cube.add(cuboid.labels);
    secondCube.add(secondLabels);
    const objectOffset = 2.1;
    // Deform each object independently without stretching their separation or orbit.
    const jellyRoots = [cube, secondCube].map((object, index) => {
      const root = new THREE.Group();
      root.position.x = index === 0 ? -objectOffset : objectOffset;
      root.add(object);
      return root;
    });
    // Both sheets and original shapes share the existing accessories and motion.
    // Hide only surface triangles, not the child rings, apples or theme objects.
    const butterflies = [cube, secondCube].map((object) => {
      const butterfly = createOrigami(materials);
      butterfly.group.scale.setScalar(.75);
      object.add(butterfly.group);
      return butterfly;
    });
    // Move, rather than scale, the apples so they stay on the wider corners
    // without stretching their shared artwork. Restore exact original positions.
    const applePositions = [cube, secondCube].flatMap((object) =>
      object.getObjectByName('corner-apples')!.children.map((apple) => ({
        apple, original: apple.position.clone(),
      })),
    );
    cuboid.geometry.computeBoundingBox();
    const cuboidCorner = cuboid.geometry.boundingBox!.max;
    const applyShape = () => {
      const activeGeometry = cuboidMode ? cuboid.geometry : geometry;
      cube.geometry = secondCube.geometry = activeGeometry;
      activeGeometry.setDrawRange(0, butterflyMode ? 0 : Infinity);
      cuboid.labels.visible = secondLabels.visible = cuboidMode && !butterflyMode;
      butterflies.forEach(({ group }) => { group.visible = butterflyMode; });
      applePositions.forEach(({ apple, original }) => {
        apple.position.copy(original);
        if (cuboidMode && !butterflyMode) {
          apple.position.set(
            Math.sign(original.x) * cuboidCorner.x,
            Math.sign(original.y) * cuboidCorner.y,
            Math.sign(original.z) * cuboidCorner.z,
          );
        }
      });
    };
    applyShape();
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
    // A stylized desert eagle: sandy brown plumage, dark flight feathers,
    // a hooked golden bill and gripping talons. It stays independent of the
    // rotating surface so future cube materials and scenery remain untouched.
    const eagle = new THREE.Group();
    const eagleGeometries: THREE.BufferGeometry[] = [];
    const eagleMaterials = [
      new THREE.MeshStandardMaterial({ color: '#805332', roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: '#382a23', roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: '#c3a477', roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: '#e7b746', roughness: 0.65 }),
      new THREE.MeshStandardMaterial({ color: '#14100d', roughness: 0.4 }),
    ];
    const ellipsoid = (
      parent: THREE.Object3D, color: number,
      position: [number, number, number], scale: [number, number, number],
    ) => {
      const shape = new THREE.SphereGeometry(1, 12, 8);
      eagleGeometries.push(shape);
      const mesh = new THREE.Mesh(shape, eagleMaterials[color]);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      parent.add(mesh);
      return mesh;
    };
    const torso = new THREE.Group();
    eagle.add(torso);
    ellipsoid(torso, 0, [0, 0.27, 0], [0.19, 0.29, 0.19]);
    ellipsoid(torso, 2, [0, 0.3, 0.12], [0.13, 0.21, 0.09]);
    ellipsoid(torso, 1, [0, 0.09, -0.23], [0.14, 0.07, 0.29]);
    const neck = new THREE.Group();
    neck.position.set(0, 0.44, 0.08);
    torso.add(neck);
    ellipsoid(neck, 2, [0, 0.09, 0.03], [0.14, 0.16, 0.14]);
    ellipsoid(neck, 3, [0, 0.055, 0.19], [0.065, 0.065, 0.12]);
    ellipsoid(neck, 4, [0, 0.015, 0.27], [0.035, 0.065, 0.035]);
    for (const side of [-1, 1]) {
      ellipsoid(neck, 4, [side * 0.117, 0.12, 0.105], [0.025, 0.029, 0.025]);
      // Brow gives the raptor its characteristic intent gaze.
      ellipsoid(neck, 0, [side * 0.105, 0.155, 0.105], [0.055, 0.018, 0.045]);
      ellipsoid(eagle, 3, [side * 0.105, 0.065, 0.06], [0.024, 0.09, 0.025]);
      for (let toe = -1; toe <= 1; toe += 1) {
        ellipsoid(eagle, 3, [side * 0.105 + toe * 0.025, 0, 0.12], [0.015, 0.018, 0.085]);
        ellipsoid(eagle, 4, [side * 0.105 + toe * 0.025, -0.012, 0.19], [0.012, 0.026, 0.026]);
      }
    }
    const wings = [-1, 1].map((side) => {
      const wing = new THREE.Group();
      wing.position.set(side * 0.13, 0.39, -0.025);
      torso.add(wing);
      ellipsoid(wing, 0, [side * 0.24, -0.02, 0], [0.32, 0.075, 0.16]);
      for (let feather = 0; feather < 6; feather += 1) {
        const flightFeather = ellipsoid(
          wing, 1, [side * (0.39 + feather * 0.065), -0.035, -0.07 + feather * 0.038],
          [0.26 - feather * 0.018, 0.035, 0.045],
        );
        flightFeather.rotation.y = side * (0.1 + feather * 0.12);
      }
      return wing;
    });
    scene.add(eagle);

    // Sample the surface and cap, but not rings, apples or other accessories.
    // The eagle remains upright while its perch follows every ancestor transform.
    const perch = new THREE.Vector3();
    const surfacePoint = new THREE.Vector3();
    const butterflyBounds = new THREE.Box3();
    const poseEagle = (elapsed: number, still = false) => {
      cube.updateWorldMatrix(true, true);
      if (butterflyMode) {
        butterflyBounds.setFromObject(butterflies[0].group);
        butterflyBounds.getCenter(perch);
        perch.y = butterflyBounds.max.y;
      } else {
        const surface = cube.geometry.getAttribute('position');
        perch.set(0, -Infinity, 0);
        for (let index = 0; index < surface.count; index += 1) {
          surfacePoint.fromBufferAttribute(surface, index).applyMatrix4(cube.matrixWorld);
          if (surfacePoint.y > perch.y) perch.copy(surfacePoint);
        }
      }
      // The cap is solid: land above it rather than inside it.
      blueCap.object.traverse((part) => {
        if (!(part instanceof THREE.Mesh)) return;
        const vertices = part.geometry.getAttribute('position');
        for (let index = 0; index < vertices.count; index += 1) {
          surfacePoint.fromBufferAttribute(vertices, index).applyMatrix4(part.matrixWorld);
          if (surfacePoint.y > perch.y) perch.copy(surfacePoint);
        }
      });
      const phase = elapsed % 14;
      const landing = still ? 1 : THREE.MathUtils.smoothstep(phase, 0, 3);
      const departing = still ? 0 : THREE.MathUtils.smoothstep(phase, 11, 14);
      const flight = 1 - landing + departing;
      eagle.position.copy(perch).add(surfacePoint.set(
        (1 - landing) * -2.6 + departing * 2.6, flight * 1.7, 0,
      ));
      eagle.rotation.y = -0.3;
      const peck = !still && phase > 4 && phase < 10
        ? Math.pow(Math.max(0, Math.sin((phase - 4) * Math.PI * 2)), 4)
        : still ? 0.55 : 0;
      torso.rotation.x = peck * 0.85;
      neck.rotation.x = peck * 0.9;
      wings.forEach((wing, index) => {
        const side = index === 0 ? -1 : 1;
        wing.rotation.z = side * (flight > 0.01
          ? Math.sin(elapsed * 13) * 0.65
          : -1.15);
      });
    };
    poseEagle(0, true);

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = canvas;
      camera.aspect = Math.max(width, 1) / Math.max(height, 1);
      galaxy.material.uniforms.aspect.value = camera.aspect;
      // Fit both jumping ring systems (including jelly stretch), their orbit, and the stationary flower border in either orientation.
      const orbitExtent = objectOffset + orbitRadius + jumpHeight + 0.45 + Math.max(2.0, CUBOID_RADIUS);
      const flowerBounds = new THREE.Box3().setFromObject(flowers.group);
      const flowerExtent = Math.max(
        Math.abs(flowerBounds.min.x), Math.abs(flowerBounds.max.x),
        Math.abs(flowerBounds.min.y), Math.abs(flowerBounds.max.y),
      );
      // Include the wider mirror and leave space for the reflected objects.
      const sceneExtent = Math.max(orbitExtent, flowerExtent, 7);
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      camera.position.z = Math.max(
        5,
        sceneExtent * 1.15 / (Math.sin(halfFov) * Math.min(camera.aspect, 1)),
      );
      // Keep a downward view at every viewport size so the floor reflection
      // remains visible rather than flattening as the camera moves back.
      camera.position.y = camera.position.z * 0.65;
      camera.lookAt(0, -1.8, 0);
      camera.updateProjectionMatrix();
      // Keep the sky centered as the camera backs away to fit the full scene.
      starfield.stars.position.copy(camera.position);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      mirror.resize(width, height, renderer.getPixelRatio());
      renderer.render(scene, camera);
    };
    resize();
    window.addEventListener('resize', resize);

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    let catTurn = 0;
    // Tint the rendered canvas, not its materials: selected themes and texture
    // maps remain intact and reappear unchanged after each five-second phase.
    const greenPeriod = 30_000;
    const greenDuration = 5_000;
    let greenTimer: ReturnType<typeof window.setTimeout>;
    const updateGreenPhase = () => {
      const elapsed = performance.now() - start;
      const phase = elapsed % greenPeriod;
      const isGreen = elapsed >= greenPeriod && phase < greenDuration;
      canvas.classList.toggle('green-phase', isGreen);
      const nextBoundary = isGreen ? greenDuration : greenPeriod;
      greenTimer = window.setTimeout(updateGreenPhase, nextBoundary - phase);
    };
    updateGreenPhase();
    const animate = (time: number) => {
      const elapsed = (time - start) / 1000;
      if (butterflyMode) {
        butterflies.forEach((butterfly) => butterfly.update(
          motion.matches ? 1 : Math.min(1, (time - unfoldStart) / 3200),
          elapsed, motion.matches,
        ));
      }
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
      poseEagle(elapsed);
      renderer.render(scene, camera);
    };
    const updateMotion = () => {
      renderer.setAnimationLoop(motion.matches ? null : animate);
      if (motion.matches) {
        butterflies.forEach((butterfly) => butterfly.update(1, 0, true));
        jumpRoot.position.y = 0;
        jellyRoots.forEach((root) => {
          root.position.y = 0;
          root.scale.set(1, 1, 1);
          root.rotation.set(0, 0, 0);
        });
        poseEagle(0, true);
        renderer.render(scene, camera);
      }
    };
    const selectMode = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      const key = event.key.toLowerCase();
      if (key !== 'b' && key !== 's' && key !== 'r') return;
      butterflyMode = key === 'b';
      if (key !== 'b') cuboidMode = key === 'r';
      unfoldStart = performance.now();
      applyShape();
      butterflies.forEach((butterfly) => butterfly.update(motion.matches ? 1 : 0, 0, motion.matches));
      describeMath();
      // Do not advance the orbit/jelly animation while reduced motion is active.
      if (motion.matches) poseEagle(0, true);
      renderer.render(scene, camera);
    };
    canvas.addEventListener('keydown', selectMode);
    updateMotion();
    motion.addEventListener('change', updateMotion);
    // A wall-clock deadline still fires when reduced motion stops animation.
    // Keep original/origami modes available afterwards via S and B.
    const cuboidTimer = window.setTimeout(() => {
      cuboidMode = true;
      butterflyMode = false;
      applyShape();
      describeMath();
      poseEagle((performance.now() - start) / 1000, motion.matches);
      renderer.render(scene, camera);
    }, Math.max(0, CUBOID_DELAY_MS - (performance.now() - start)));

    return () => {
      window.clearTimeout(cuboidTimer);
      cuboid.dispose();
      window.clearTimeout(greenTimer);
      canvas.classList.remove('green-phase');
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize);
      motion.removeEventListener('change', updateMotion);
      canvas.removeEventListener('keydown', selectMode);
      butterflies.forEach((butterfly) => butterfly.dispose());
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('keydown', onKeyDown);
      // The cloned object's diagram shares these resources; dispose only once.
      blueCap.dispose();
      disposeCostume?.();
      disposeCornerApples();
      math?.dispose();
      disposeGigachadTheme?.();
      disposeCatEyes();
      disposeAnimals();
      flowers.dispose();
      for (const ring of rings) {
        ring.geometry.dispose();
        ring.material.dispose();
      }
      mirror.dispose();
      starfield.dispose();
      geometry.dispose();
      materials.forEach((material) => material.dispose());
      cats.forEach(({ texture }) => texture.dispose());
      spaceBackground.dispose();
      galaxy.geometry.dispose();
      galaxy.material.dispose();
      changeBackground.current = () => {};
      eagleGeometries.forEach((shape) => shape.dispose());
      eagleMaterials.forEach((plumage) => plumage.dispose());
      renderer.dispose();
    };
  }, [initiallyButterfly, faceted, isCube, mathMode, gigachadMode, isRedBatman, palette, sceneDescription]);

  // Celebration is a separate layer: switching it never rebuilds the scene,
  // changes its materials/accessories, or takes ownership of the background.
  return (
    <main className="experience" data-theme={theme}>
      <canvas ref={canvasRef} tabIndex={0} title="B: unfold butterflies · S: restore selected shape · R: labelled cuboid" role="img" aria-label={sceneDescription} />
      {theme === 'oman-national-day' && (
        <section className="national-day" aria-label="Oman National Day celebration">
          <div className="national-day__ribbons" aria-hidden="true" />
          <header className="national-day__greeting">
            <p className="national-day__eyebrow">Celebrating Oman</p>
            <h1>Oman National Day</h1>
            <p className="national-day__arabic" lang="ar" dir="rtl">العيد الوطني العُماني</p>
            <p className="national-day__message">Together in celebration</p>
          </header>
          <div className="national-day__trim" aria-hidden="true" />
        </section>
      )}
      <div className="scene-controls">
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
      <label className="theme-picker">
        Celebration
        <select
          value={theme}
          onChange={(event) => setTheme(event.target.value === 'oman-national-day' ? 'oman-national-day' : 'original')}
        >
          <option value="oman-national-day">Oman National Day</option>
          <option value="original">None (original)</option>
        </select>
      </label>
      </div>
    </main>
  );
}
