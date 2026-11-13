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
      starGeometry.dispose();
      starMaterial.dispose();
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
