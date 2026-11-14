import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const time = timeFormatter.format(now);

  return (
    <time className="clock" dateTime={now.toISOString()} aria-label={`Current local time: ${time}`}>
      {time}
    </time>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLightBackground, setIsLightBackground] = useState(false);
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  const [isPaused, setIsPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const setRotationPausedRef = useRef<(paused: boolean) => void>(() => {});
  const [isWireframe, setIsWireframe] = useState(false);
  const setWireframeRef = useRef<(wireframe: boolean) => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current!;
    // Keep the canvas transparent so the page theme also updates while paused.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: '#246bff' });
    const cube = new THREE.Mesh(geometry, material);
    cube.rotation.set(0.4, 0.5, 0);
    scene.add(cube, new THREE.HemisphereLight(0xffffff, 0x334155, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 5, 4);
    scene.add(light);

    setWireframeRef.current = (wireframe) => {
      material.wireframe = wireframe;
      renderer.render(scene, camera);
    };

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = canvas;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };
    resize();
    window.addEventListener('resize', resize);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const changeColor = (event: MouseEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObject(cube).length === 0) return;

      // Choose any RGB color except the current one, so every hit changes it.
      const offset = 1 + Math.floor(Math.random() * 0xffffff);
      material.color.setHex((material.color.getHex() + offset) % 0x1000000);
      renderer.render(scene, camera);
    };
    canvas.addEventListener('click', changeColor);

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let previousTime: number | null = null;
    const animate = (time: number) => {
      const delta = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.1);
      previousTime = time;
      cube.rotation.x += delta * 0.3 * speedRef.current;
      cube.rotation.y += delta * 0.5 * speedRef.current;
      renderer.render(scene, camera);
    };
    setRotationPausedRef.current = (paused) => {
      previousTime = null;
      renderer.setAnimationLoop(paused ? null : animate);
    };
    const updateMotion = () => {
      if (motion.matches) setIsPaused(true);
    };
    motion.addEventListener('change', updateMotion);

    return () => {
      renderer.setAnimationLoop(null);
      setRotationPausedRef.current = () => {};
      setWireframeRef.current = () => {};
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', changeColor);
      motion.removeEventListener('change', updateMotion);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    setRotationPausedRef.current(isPaused);
  }, [isPaused]);

  useEffect(() => {
    setWireframeRef.current(isWireframe);
  }, [isWireframe]);

  return (
    <div className="page" data-theme={isLightBackground ? 'light' : 'dark'}>
      <canvas ref={canvasRef} role="img" aria-label="A rotating cube. Click the cube to change its color." />
      <Clock />
      <div className="speed-control">
        <div className="speed-heading">
          <label htmlFor="cube-speed">Spin speed</label>
          <output htmlFor="cube-speed">{speed === 0 ? 'Paused' : `${speed.toFixed(1)}×`}</output>
        </div>
        <input
          id="cube-speed"
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={speed}
          aria-valuetext={speed === 0 ? 'Paused' : `${speed.toFixed(1)} times normal speed`}
          aria-describedby="motion-note"
          onChange={(event) => {
            const nextSpeed = event.currentTarget.valueAsNumber;
            speedRef.current = nextSpeed;
            setSpeed(nextSpeed);
          }}
        />
        <small id="motion-note">Reduced-motion preferences pause rotation.</small>
        <button
          className="rotation-control"
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
        >
          {isPaused ? 'Resume rotation' : 'Pause rotation'}
        </button>
        <button
          className="rotation-control"
          type="button"
          aria-pressed={isLightBackground}
          onClick={() => setIsLightBackground((light) => !light)}
        >
          Light background
        </button>
        <button
          className="rotation-control"
          type="button"
          aria-pressed={isWireframe}
          onClick={() => setIsWireframe((wireframe) => !wireframe)}
        >
          Wireframe: {isWireframe ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}
