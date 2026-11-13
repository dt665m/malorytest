import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playbackRef = useRef<((paused: boolean) => void) | null>(null);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111318');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: '#ff7a00' });
    const cube = new THREE.Mesh(geometry, material);
    cube.rotation.set(0.4, 0.5, 0);
    scene.add(cube, new THREE.HemisphereLight(0xffffff, 0x334155, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 5, 4);
    scene.add(light);

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

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rotationPaused = false;
    let previousTime: number | null = null;
    const animate = (time: number) => {
      const delta = previousTime === null ? 0 : (time - previousTime) / 1000;
      previousTime = time;
      cube.rotation.x += delta * 0.3;
      cube.rotation.y += delta * 0.5;
      renderer.render(scene, camera);
    };
    const updateMotion = () => {
      previousTime = null;
      renderer.setAnimationLoop(motion.matches || rotationPaused ? null : animate);
    };
    playbackRef.current = (nextPaused) => {
      rotationPaused = nextPaused;
      updateMotion();
    };
    updateMotion();
    motion.addEventListener('change', updateMotion);

    return () => {
      playbackRef.current = null;
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize);
      motion.removeEventListener('change', updateMotion);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    playbackRef.current?.(paused);
  }, [paused]);

  return (
    <main className="demo">
      <canvas ref={canvasRef} role="img" aria-label="A bright orange cube" />
      <header className="demo-header">
        <h1>Welcome to the Malory demo</h1>
        <time className="clock" dateTime={now.toISOString()} aria-label="Current local time">
          {now.toLocaleTimeString()}
        </time>
      </header>
      <button
        className="rotation-toggle"
        type="button"
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? 'Resume rotation' : 'Pause rotation'}
      </button>
    </main>
  );
}
