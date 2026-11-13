import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const cubeSizes = { Small: 0.65, Medium: 1, Large: 1.4 };
type CubeSize = keyof typeof cubeSizes;

const rotationLabel = (radians: number) =>
  `Y rotation: ${Math.round(THREE.MathUtils.euclideanModulo(THREE.MathUtils.radToDeg(radians), 360)) % 360}°`;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [completedRotations, setCompletedRotations] = useState(0);
  const [isLight, setIsLight] = useState(false);
  const updateThemeRef = useRef<((light: boolean) => void) | null>(null);
  const [isSphere, setIsSphere] = useState(false);
  const toggleShapeRef = useRef<(() => boolean) | null>(null);
  const [cubeSize, setCubeSize] = useState<CubeSize>('Medium');
  const updateSizeRef = useRef<((size: CubeSize) => void) | null>(null);
  const [fps, setFps] = useState(0);
  const rotationAngleRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111318');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    const geometry = new THREE.BoxGeometry();
    const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 24);
    // BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z.
    const materials = ['#246bff', '#ef4444', '#22c55e', '#facc15', '#a855f7', '#f97316'].map(
      (color) => new THREE.MeshStandardMaterial({ color }),
    );
    const cube: THREE.Mesh = new THREE.Mesh(geometry, materials);
    cube.rotation.set(0.4, 0.5, 0);
    // Keep hover scaling independent of the cube's own animation transforms.
    const hoverGroup = new THREE.Group();
    hoverGroup.add(cube);
    scene.add(hoverGroup, new THREE.HemisphereLight(0xffffff, 0x334155, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 5, 4);
    scene.add(light);

    // A soft pool of light implies a floor without obscuring the starfield.
    // Keep it below the largest cube's full rotation/bob/hover envelope and world-anchored.
    const shadowSize = 64;
    const shadowPixels = new Uint8Array(shadowSize * shadowSize * 4);
    for (let y = 0; y < shadowSize; y++) {
      for (let x = 0; x < shadowSize; x++) {
        const radius = Math.hypot((x + 0.5) / shadowSize * 2 - 1, (y + 0.5) / shadowSize * 2 - 1);
        const offset = (y * shadowSize + x) * 4;
        shadowPixels.set([255, 255, 255, Math.round(255 * Math.max(0, 1 - radius * radius) ** 3)], offset);
      }
    }
    const shadowTexture = new THREE.DataTexture(shadowPixels, shadowSize, shadowSize);
    shadowTexture.magFilter = THREE.LinearFilter;
    shadowTexture.minFilter = THREE.LinearFilter;
    shadowTexture.needsUpdate = true;
    const shadowGeometry = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      color: '#568cff',
      opacity: 0.5,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const floorShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.y = -1.6;
    scene.add(floorShadow);

    // A single static draw call, placed entirely behind the rotating cube.
    const starPositions = new Float32Array(300 * 3);
    for (let i = 0; i < starPositions.length; i += 3) {
      starPositions[i] = Math.random() * 2 - 1;
      starPositions[i + 1] = Math.random() * 2 - 1;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: false,
      toneMapped: false,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.position.z = -5;
    scene.add(stars);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let mouse: { x: number; y: number } | null = null;
    let drag: { pointerId: number; x: number; y: number } | null = null;
    // Manual offsets compose with the elapsed-time animation and survive release.
    const manualRotation = { x: 0, y: 0 };
    const hitCube = (x: number, y: number) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.set(
        ((x - bounds.left) / bounds.width) * 2 - 1,
        -((y - bounds.top) / bounds.height) * 2 + 1,
      );
      camera.updateMatrixWorld();
      cube.updateWorldMatrix(true, false);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(cube, false).length > 0;
    };
    const render = () => {
      // Hit-test the normal-size cube so growth cannot change its hover boundary.
      hoverGroup.scale.setScalar(1);
      hoverGroup.position.set(0, 0, 0);
      const hovered = mouse !== null && hitCube(mouse.x, mouse.y);
      if (hovered || drag) {
        hoverGroup.scale.setScalar(1.08);
        // Scale about the cube's center, not the origin, preserving its world-space bob.
        hoverGroup.position.copy(cube.position).multiplyScalar(1 - 1.08);
      }
      canvas.style.cursor = drag ? 'grabbing' : hovered ? 'grab' : '';
      // Read the actual orientation, including initial tilt and manual dragging.
      // Update only this text node, without rerendering React on animation frames.
      const angleOutput = rotationAngleRef.current;
      const label = rotationLabel(cube.rotation.y);
      if (angleOutput && angleOutput.textContent !== label) angleOutput.textContent = label;
      renderer.render(scene, camera);
    };
    const movePointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      mouse = { x: event.clientX, y: event.clientY };
      if (drag && event.pointerId === drag.pointerId) {
        if ((event.buttons & 1) === 0) {
          endDrag();
          return;
        }
        const dx = (event.clientX - drag.x) * 0.01;
        const dy = (event.clientY - drag.y) * 0.01;
        manualRotation.x += dy;
        manualRotation.y += dx;
        cube.rotation.x += dy;
        cube.rotation.y += dx;
        drag.x = event.clientX;
        drag.y = event.clientY;
      }
      render();
    };
    const startDrag = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || drag) return;
      mouse = { x: event.clientX, y: event.clientY };
      // Match hover's normal-size hit-test boundary, not its enlarged appearance.
      hoverGroup.scale.setScalar(1);
      hoverGroup.position.set(0, 0, 0);
      if (hitCube(event.clientX, event.clientY)) {
        canvas.setPointerCapture(event.pointerId);
        drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
        event.preventDefault();
      }
      render();
    };
    const endDrag = (event?: PointerEvent) => {
      if (!drag || (event && event.pointerId !== drag.pointerId)) return;
      const pointerId = drag.pointerId;
      drag = null;
      if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
      render();
    };
    const cancelPointer = (event?: PointerEvent) => {
      endDrag(event);
      clearPointer();
    };
    const clearPointer = () => {
      mouse = null;
      render();
    };
    const setWireframe = (wireframe: boolean) => {
      if (materials[0].wireframe === wireframe) return;
      materials.forEach((material) => { material.wireframe = wireframe; });
      // Redraw immediately even when reduced motion disables the animation loop.
      render();
    };
    const pressWireframe = (event: KeyboardEvent) => {
      if (event.key === 'w' || event.key === 'W') setWireframe(true);
    };
    const releaseWireframe = (event: KeyboardEvent) => {
      if (event.key === 'w' || event.key === 'W') setWireframe(false);
    };
    window.addEventListener('keydown', pressWireframe);
    window.addEventListener('keyup', releaseWireframe);
    canvas.addEventListener('pointermove', movePointer);
    canvas.addEventListener('pointerleave', clearPointer);
    canvas.addEventListener('pointerdown', startDrag);
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', cancelPointer);
    canvas.addEventListener('lostpointercapture', cancelPointer);
    const blurPointer = () => {
      setWireframe(false);
      cancelPointer();
    };
    window.addEventListener('blur', blurPointer);
    // Update the existing scene, without resetting animation or the counter.
    updateThemeRef.current = (light) => {
      scene.background = new THREE.Color(light ? '#eef2f7' : '#111318');
      starMaterial.color.set(light ? '#64748b' : '#ffffff');
      shadowMaterial.color.set(light ? '#4263b8' : '#568cff');
      render();
    };
    setCubeSize('Medium');
    updateSizeRef.current = (size) => {
      cube.scale.setScalar(cubeSizes[size]);
      // Redraw and recheck hover even when reduced motion stops animation.
      render();
    };

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = canvas;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      // Fill the camera's view at the star plane, including portrait viewports.
      const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        * (camera.position.z - stars.position.z);
      stars.scale.set(halfHeight * camera.aspect, halfHeight, 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      render();
    };
    resize();
    window.addEventListener('resize', resize);

    // Keep the label in sync if Fast Refresh recreates the scene.
    setIsSphere(false);
    // Swap only geometry/material, preserving all animation transforms and timing.
    toggleShapeRef.current = () => {
      const nextIsSphere = cube.geometry === geometry;
      cube.geometry = nextIsSphere ? sphereGeometry : geometry;
      cube.material = nextIsSphere ? materials[0] : materials;
      // Recheck hover against the new geometry, even with a stationary pointer.
      render();
      return nextIsSphere;
    };

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    let lastCompletedRotations = 0;
    setCompletedRotations(0);
    // Average animation frames over half a second, not event-driven redraws.
    let fpsStart: number | null = null;
    let fpsFrames = 0;
    const resetFps = () => {
      fpsStart = null;
      fpsFrames = 0;
      setFps(0);
    };
    const animate = (time: number) => {
      if (document.hidden) return;
      if (fpsStart === null) {
        fpsStart = time;
      } else {
        fpsFrames++;
        const duration = time - fpsStart;
        if (duration >= 500) {
          setFps(Math.round(fpsFrames * 1000 / duration));
          fpsStart = time;
          fpsFrames = 0;
        }
      }
      const elapsed = (time - start) / 1000;
      // A small four-second bob in world space, independent of the cube's spin.
      cube.position.y = Math.sin(elapsed * Math.PI / 2) * 0.15;
      cube.rotation.x = 0.4 + elapsed * 0.3 + manualRotation.x;
      const yRotation = elapsed * 0.5;
      cube.rotation.y = 0.5 + yRotation + manualRotation.y;
      // Count automatic Y-axis turns, excluding initial tilt and manual adjustments.
      const fullRotations = Math.floor(yRotation / (2 * Math.PI));
      if (fullRotations !== lastCompletedRotations) {
        lastCompletedRotations = fullRotations;
        setCompletedRotations(fullRotations);
      }
      render();
    };
    const updateVisibility = () => {
      resetFps();
      // A release outside this tab may never reach its keyup listener.
      if (document.hidden) setWireframe(false);
    };
    document.addEventListener('visibilitychange', updateVisibility);
    const updateMotion = () => {
      resetFps();
      renderer.setAnimationLoop(motion.matches ? null : animate);
    };
    updateMotion();
    motion.addEventListener('change', updateMotion);

    return () => {
      updateThemeRef.current = null;
      toggleShapeRef.current = null;
      updateSizeRef.current = null;
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', movePointer);
      canvas.removeEventListener('pointerleave', clearPointer);
      canvas.removeEventListener('pointerdown', startDrag);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', cancelPointer);
      canvas.removeEventListener('lostpointercapture', cancelPointer);
      window.removeEventListener('blur', blurPointer);
      window.removeEventListener('keydown', pressWireframe);
      window.removeEventListener('keyup', releaseWireframe);
      endDrag();
      canvas.style.cursor = '';
      motion.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
      starGeometry.dispose();
      starMaterial.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      geometry.dispose();
      sphereGeometry.dispose();
      materials.forEach((material) => material.dispose());
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    updateThemeRef.current?.(isLight);
  }, [isLight]);

  useEffect(() => {
    updateSizeRef.current?.(cubeSize);
  }, [cubeSize]);

  return (
    <div className={`app ${isLight ? 'theme-light' : 'theme-dark'}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={isSphere ? 'A rotating blue sphere' : 'A rotating cube with six differently colored faces'}
      />
      <output className="rotation-counter">
        <strong>{completedRotations}</strong> full Y-axis rotations
      </output>
      <button
        type="button"
        className="theme-toggle"
        aria-label="Light theme"
        aria-pressed={isLight}
        onClick={() => setIsLight((light) => !light)}
      >
        {isLight ? 'Theme: Light' : 'Theme: Dark'}
      </button>
      <button
        className="shape-toggle"
        type="button"
        onClick={() => {
          const nextIsSphere = toggleShapeRef.current?.();
          if (nextIsSphere !== undefined) setIsSphere(nextIsSphere);
        }}
      >
        {isSphere ? 'Change to cube' : 'Change to sphere'}
      </button>
      <div className="size-controls" role="group" aria-label="Cube size">
        {(Object.keys(cubeSizes) as CubeSize[]).map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={cubeSize === size}
            onClick={() => setCubeSize(size)}
          >
            {size}
          </button>
        ))}
      </div>
      <output className="fps-counter" aria-label="Frames per second" aria-live="off">
        {fps} FPS
      </output>
      <output className="rotation-angle" ref={rotationAngleRef} aria-live="off">
        {rotationLabel(0.5)}
      </output>
    </div>
  );
}
