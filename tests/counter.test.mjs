import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import * as THREE from 'three';
import { transformWithEsbuild } from 'vite';

// Exercise App's actual animation callbacks without a browser or WebGL context.
const { code: source } = await transformWithEsbuild(
  readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  'App.tsx',
  { format: 'cjs', jsx: 'automatic' },
);

function mount(reducedMotion = false) {
  const effects = [];
  const refs = [];
  const states = [];
  let hookIndex = 0;
  let tree;
  let loop;
  let cube;
  const counts = [];
  const listeners = new Map();
  const canvas = {
    clientWidth: 800, clientHeight: 600,
    getBoundingClientRect() {
      return { left: 20, top: 30, width: this.clientWidth, height: this.clientHeight };
    },
    addEventListener: (name, callback) => listeners.set('canvas:' + name, callback),
    removeEventListener: (name) => listeners.delete('canvas:' + name),
  };
  const motion = {
    matches: reducedMotion,
    addEventListener: (name, callback) => listeners.set('motion:' + name, callback),
    removeEventListener: (name) => listeners.delete('motion:' + name),
  };
  const resources = [];
  class Resource {
    disposed = false;
    dispose() { this.disposed = true; }
    constructor(options) { this.options = options; resources.push(this); }
  }
  class Renderer extends Resource {
    setAnimationLoop(callback) { loop = callback; }
    setPixelRatio() {}
    setSize(width, height) { this.size = [width, height]; }
    render(scene) { this.scene = scene; scene.updateMatrixWorld(); }
  }
  const renderer = new Renderer();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const three = {
    ...THREE,
    WebGLRenderer: function () { return renderer; },
    PerspectiveCamera: function () { return camera; },
    BoxGeometry: class extends THREE.BoxGeometry {
      disposed = false;
      constructor() { super(); resources.push(this); }
      dispose() { this.disposed = true; super.dispose(); }
    },
    MeshStandardMaterial: class extends THREE.MeshStandardMaterial {
      disposed = false;
      constructor(options) { super(options); this.options = options; resources.push(this); }
      dispose() { this.disposed = true; super.dispose(); }
    },
    Mesh: class extends THREE.Mesh {
      constructor(geometry, materials) {
        super(geometry, materials);
        cube = this;
      }
    },
  };
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require(name) {
      if (name === 'three') return three;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
      if (name === 'react') return {
        useRef: (initial) => {
          const index = hookIndex++;
          return refs[index] ??= { current: index === 0 ? canvas : initial };
        },
        useState: (initial) => {
          const index = hookIndex++;
          states[index] ??= initial;
          return [states[index], (value) => {
            states[index] = typeof value === 'function' ? value(states[index]) : value;
            if (index === 1) counts.push(states[index]);
          }];
        },
        useEffect: (callback, deps) => {
          const index = hookIndex++;
          const previous = effects[index];
          if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
            effects[index] = { callback, deps, cleanup: previous?.cleanup, pending: true };
          }
        },
      };
      throw new Error('Unexpected import: ' + name);
    },
    performance: { now: () => 1000 },
    window: {
      devicePixelRatio: 1,
      matchMedia: () => motion,
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
  });
  const render = () => {
    hookIndex = 0;
    tree = module.exports.default();
    effects.forEach((effect) => {
      if (!effect.pending) return;
      effect.cleanup?.();
      effect.pending = false;
      effect.cleanup = effect.callback();
    });
  };
  render();
  return {
    counts, cube, renderer, camera, resources, listeners,
    get tree() { return tree; },
    toggleTheme() { tree.props.children[2].props.onClick(); render(); },
    pointer(x, y, pointerType = 'mouse') {
      listeners.get('canvas:pointermove')({ clientX: x, clientY: y, pointerType });
    },
    leave() { listeners.get('canvas:pointerleave')(); },
    frame(seconds) { loop?.(1000 + seconds * 1000); },
    motion(matches) {
      motion.matches = matches;
      listeners.get('motion:change')();
    },
    resize(width, height) {
      Object.assign(canvas, { clientWidth: width, clientHeight: height });
      listeners.get('resize')();
    },
    unmount() { effects.forEach((effect) => effect.cleanup?.()); },
    get running() { return typeof loop === 'function'; },
  };
}

test('theme toggle updates colors without resetting the scene or animation, including reduced motion', () => {
  for (const reducedMotion of [false, true]) {
    const app = mount(reducedMotion);
    const scene = app.renderer.scene;
    const stars = scene.children.find((child) => child.isPoints);
    const button = () => app.tree.props.children[2];
    assert.equal(button().type, 'button');
    assert.equal(button().props['aria-label'], 'Light theme');
    assert.equal(button().props['aria-pressed'], false);
    assert.equal(scene.background.getHexString(), '111318');
    app.frame(4 * Math.PI);
    const rotation = app.cube.rotation.y;
    const height = app.cube.position.y;
    const counts = [...app.counts];
    app.pointer(420, 330);
    assert.equal(app.cube.parent.scale.x, 1.08);
    const worldPosition = app.cube.getWorldPosition(new THREE.Vector3());
    app.toggleTheme();
    assert.equal(button().props['aria-pressed'], true);
    assert.equal(app.tree.props.className, 'app theme-light');
    assert.equal(scene.background.getHexString(), 'eef2f7');
    assert.equal(stars.material.color.getHexString(), '64748b');
    assert.equal(app.renderer.scene, scene, 'same scene is redrawn immediately');
    assert.equal(app.cube.rotation.y, rotation);
    assert.equal(app.cube.position.y, height, 'theme changes preserve bounce position');
    assert.deepEqual(app.counts, counts);
    assert.equal(app.running, !reducedMotion);
    assert.equal(app.cube.parent.scale.x, 1.08, 'light theme redraw preserves hover');
    assert.ok(app.cube.getWorldPosition(new THREE.Vector3()).distanceTo(worldPosition) < 1e-10,
      'theme redraw preserves the hovered cube center');
    app.toggleTheme();
    assert.equal(app.cube.parent.scale.x, 1.08, 'dark theme redraw preserves hover');
    assert.equal(button().props['aria-pressed'], false);
    assert.equal(scene.background.getHexString(), '111318');
    assert.equal(stars.material.color.getHexString(), 'ffffff');
    app.frame(13);
    assert.equal(app.cube.position.y, reducedMotion ? height : Math.sin(13 * Math.PI / 2) * 0.15);
    assert.equal(app.cube.rotation.y, reducedMotion ? rotation : 0.5 + 13 * 0.5);
    assert.deepEqual(app.counts, counts, 'theme changes preserve rotation counting');
    app.unmount();
    assert.equal(app.listeners.size, 0);
  }
});

test('mouse hover grows only the cube and composes with its animation transforms', () => {
  const app = mount();
  const hoverGroup = app.cube.parent;
  const stars = app.renderer.scene.children.find((child) => child.isPoints);
  const starScale = stars.scale.clone();
  assert.equal(hoverGroup.scale.x, 1);
  app.pointer(20, 30);
  assert.equal(hoverGroup.scale.x, 1, 'canvas background is not the cube');
  app.pointer(420, 330, 'touch');
  assert.equal(hoverGroup.scale.x, 1, 'touch does not leave a sticky hover');
  app.cube.scale.setScalar(1.1);
  app.pointer(420, 330);
  assert.deepEqual(hoverGroup.scale.toArray(), [1.08, 1.08, 1.08]);
  app.frame(4 * Math.PI);
  assert.equal(hoverGroup.scale.x, 1.08);
  assert.equal(app.cube.scale.x, 1.1, 'local scale is preserved');
  assert.equal(app.cube.rotation.y, 0.5 + 2 * Math.PI);
  assert.deepEqual(app.counts, [0, 1], 'hover does not interrupt rotation counting');
  assert.ok(stars.scale.equals(starScale), 'background does not grow');
  app.frame(4 * Math.PI + 1);
  assert.equal(hoverGroup.scale.x, 1.08);
  assert.equal(app.cube.position.y, Math.sin((4 * Math.PI + 1) * Math.PI / 2) * 0.15);
  assert.ok(app.cube.getWorldPosition(new THREE.Vector3()).distanceTo(app.cube.position) < 1e-10,
    'hover scales about the cube center without amplifying the world-space bounce');
  app.motion(true);
  const pausedPosition = app.cube.getWorldPosition(new THREE.Vector3());
  app.leave();
  assert.ok(app.cube.getWorldPosition(new THREE.Vector3()).distanceTo(pausedPosition) < 1e-10,
    'leaving hover under reduced motion does not move the paused cube');
  assert.equal(hoverGroup.scale.x, 1);
  app.pointer(420, 330);
  app.listeners.get('blur')();
  assert.equal(hoverGroup.scale.x, 1);
  app.pointer(420, 330);
  app.listeners.get('canvas:pointercancel')();
  assert.equal(hoverGroup.scale.x, 1);
  app.unmount();
  assert.equal(app.listeners.size, 0);
});

test('hover responds without animation under reduced motion and rechecks after resizing', () => {
  const app = mount(true);
  const hoverGroup = app.cube.parent;
  app.pointer(420, 330);
  assert.equal(hoverGroup.scale.x, 1.08);
  assert.equal(app.running, false);
  app.resize(400, 800);
  assert.equal(hoverGroup.scale.x, 1, 'stationary pointer no longer covers the cube');
  app.pointer(220, 430);
  assert.equal(hoverGroup.scale.x, 1.08, 'uses the new canvas rectangle');
  app.pointer(20, 30);
  assert.equal(hoverGroup.scale.x, 1);
  assert.equal(app.cube.rotation.y, 0.5, 'hover does not introduce rotation');
  app.unmount();
});

test('stationary mouse is rechecked as the cube rotates beneath it', () => {
  const app = mount();
  app.pointer(520, 330);
  const scales = new Set();
  for (let seconds = 0; seconds <= 20; seconds += 0.25) {
    app.frame(seconds);
    scales.add(app.cube.parent.scale.x);
  }
  assert.deepEqual([...scales].sort(), [1, 1.08]);
  app.unmount();
});

test('starfield stays behind the cube, fills resized views, and releases resources', () => {
  const app = mount(true);
  const stars = app.renderer.scene.children.find((child) => child.isPoints);
  assert.ok(stars, 'starfield is present even with reduced motion');
  assert.ok(stars.position.z < -Math.sqrt(3) / 2, 'behind the cube at every rotation');
  assert.equal(stars.material.color.getHex(), 0xffffff);
  assert.ok(stars.material.size > 0 && stars.material.size <= 2);
  assert.equal(stars.material.sizeAttenuation, false, 'small screen-space dots');
  const positions = stars.geometry.getAttribute('position');
  assert.ok(positions.count >= 100);
  for (let i = 0; i < positions.count; i++) {
    assert.ok(Math.abs(positions.getX(i)) <= 1);
    assert.ok(Math.abs(positions.getY(i)) <= 1);
    assert.equal(positions.getZ(i), 0);
  }
  const originalPositions = Array.from(positions.array);
  const checkCoverage = (width, height) => {
    app.resize(width, height);
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(app.camera.fov / 2))
      * (app.camera.position.z - stars.position.z);
    assert.equal(stars.scale.x, halfHeight * width / height);
    assert.equal(stars.scale.y, halfHeight);
  };
  checkCoverage(400, 800);
  checkCoverage(1600, 600);
  app.motion(false);
  app.frame(20);
  assert.deepEqual(Array.from(positions.array), originalPositions, 'no star motion');
  assert.equal(stars.rotation.x, 0);
  assert.equal(stars.rotation.y, 0);
  const disposed = [];
  stars.geometry.addEventListener('dispose', () => disposed.push('geometry'));
  stars.material.addEventListener('dispose', () => disposed.push('material'));
  app.unmount();
  assert.deepEqual(disposed, ['geometry', 'material']);
});

test('cube bobs gently in world space without changing its spin or depending on frame rate', () => {
  const app = mount();
  const sparse = mount();
  const heights = [];
  for (let seconds = 0; seconds <= 4; seconds += 0.25) {
    app.frame(seconds);
    heights.push(app.cube.position.y);
    assert.equal(app.cube.position.x, 0);
    assert.equal(app.cube.position.z, 0);
    assert.ok(Math.abs(app.cube.position.y) <= 0.15);
    assert.equal(app.cube.rotation.x, 0.4 + seconds * 0.3);
    assert.equal(app.cube.rotation.y, 0.5 + seconds * 0.5);
  }
  assert.ok(Math.max(...heights) > 0.14, 'moves above center');
  assert.ok(Math.min(...heights) < -0.14, 'moves below center');
  assert.ok(Math.abs(app.cube.position.y) < 1e-10, 'returns to center after a cycle');
  app.frame(5.25);
  sparse.frame(5.25);
  assert.equal(app.cube.position.y, sparse.cube.position.y, 'same time, same height');
  const pausedHeight = app.cube.position.y;
  app.motion(true);
  app.frame(7);
  assert.equal(app.cube.position.y, pausedHeight, 'reduced motion stops the bob');
  app.unmount();
  sparse.unmount();

  const reduced = mount(true);
  reduced.frame(1);
  assert.equal(reduced.cube.position.y, 0, 'starts centered with reduced motion');
  reduced.unmount();
});

test('counts complete Y turns, not initial tilt, partial turns, or frames', () => {
  const app = mount();
  const turn = 4 * Math.PI; // 2π radians at the existing 0.5 radians/second.
  assert.deepEqual(app.counts, [0]);
  assert.equal(app.tree.props.children[1].type, 'output');
  assert.equal(app.tree.props.children[1].props.children[0].props.children, 0);
  app.frame(0);
  app.frame(turn - 0.001);
  assert.deepEqual(app.counts, [0]);
  app.frame(turn);
  assert.deepEqual(app.counts, [0, 1]);
  app.frame(turn + 0.001);
  assert.deepEqual(app.counts, [0, 1], 'no state update on every frame');
  app.frame(3 * turn + 0.1);
  assert.deepEqual(app.counts, [0, 1, 3], 'sparse frames count skipped turns');
  assert.equal(app.cube.rotation.x, 0.4 + (3 * turn + 0.1) * 0.3);
  assert.equal(app.cube.rotation.y, 0.5 + (3 * turn + 0.1) * 0.5);
  app.unmount();
});

test('reduced motion, resizing, and cleanup retain the existing lifecycle', () => {
  const app = mount(true);
  assert.equal(app.running, false);
  assert.equal(app.tree.props.children[0].props['aria-label'],
    'A rotating cube with six differently colored faces');
  assert.equal(app.cube.material.length, 6);
  assert.equal(new Set(app.cube.material.map((material) => material.options.color)).size, 6);
  app.frame(100);
  assert.deepEqual(app.counts, [0]);
  assert.equal(app.cube.rotation.y, 0.5);
  app.motion(false);
  app.frame(4 * Math.PI);
  assert.deepEqual(app.counts, [0, 1]);
  app.motion(true);
  app.frame(100);
  assert.deepEqual(app.counts, [0, 1], 'paused cube does not update the counter');
  app.resize(400, 800);
  assert.deepEqual(app.renderer.size, [400, 800]);
  assert.equal(app.camera.aspect, 0.5);
  app.motion(false);
  app.frame(12 * Math.PI);
  assert.deepEqual(app.counts, [0, 1, 3], 'resume matches existing elapsed-time rotation');
  app.unmount();
  assert.equal(app.running, false);
  assert.equal(app.listeners.size, 0);
  assert.ok(app.resources.every((resource) => resource.disposed));
  const remount = mount();
  assert.deepEqual(remount.counts, [0]);
  remount.unmount();
});
