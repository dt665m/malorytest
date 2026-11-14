import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111318');

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
    const start = performance.now();
    const animate = (time: number) => {
      const elapsed = (time - start) / 1000;
      cube.rotation.x = 0.4 + elapsed * 0.3;
      cube.rotation.y = 0.5 + elapsed * 0.5;
      renderer.render(scene, camera);
    };
    const updateMotion = () => {
      renderer.setAnimationLoop(motion.matches ? null : animate);
    };
    updateMotion();
    motion.addEventListener('change', updateMotion);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', changeColor);
      motion.removeEventListener('change', updateMotion);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} role="img" aria-label="A rotating cube. Click the cube to change its color." />;
}
