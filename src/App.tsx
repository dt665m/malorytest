import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [completedRotations, setCompletedRotations] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111318');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    const geometry = new THREE.BoxGeometry();
    // BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z.
    const materials = ['#246bff', '#ef4444', '#22c55e', '#facc15', '#a855f7', '#f97316'].map(
      (color) => new THREE.MeshStandardMaterial({ color }),
    );
    const cube = new THREE.Mesh(geometry, materials);
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
    const start = performance.now();
    let lastCompletedRotations = 0;
    setCompletedRotations(0);
    const animate = (time: number) => {
      const elapsed = (time - start) / 1000;
      cube.rotation.x = 0.4 + elapsed * 0.3;
      const yRotation = elapsed * 0.5;
      cube.rotation.y = 0.5 + yRotation;
      // Count whole Y-axis turns traveled, excluding the initial orientation.
      const fullRotations = Math.floor(yRotation / (2 * Math.PI));
      if (fullRotations !== lastCompletedRotations) {
        lastCompletedRotations = fullRotations;
        setCompletedRotations(fullRotations);
      }
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
      motion.removeEventListener('change', updateMotion);
      geometry.dispose();
      materials.forEach((material) => material.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} role="img" aria-label="A rotating cube with six differently colored faces" />
      <output className="rotation-counter">
        <strong>{completedRotations}</strong> full Y-axis rotations
      </output>
    </>
  );
}
