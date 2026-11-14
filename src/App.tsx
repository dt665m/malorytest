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
      motion.removeEventListener('change', updateMotion);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} role="img" aria-label="A rotating blue sphere" />;
}
