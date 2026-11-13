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
  let effect;
  let cleanup;
  let loop;
  let cube;
  const counts = [];
  const listeners = new Map();
  const canvas = { clientWidth: 800, clientHeight: 600 };
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
    render(scene) { this.scene = scene; }
  }
  const renderer = new Renderer();
  const camera = { fov: 45, position: {}, updateProjectionMatrix() {} };
  const three = {
    ...THREE,
    WebGLRenderer: function () { return renderer; },
    Scene: class {
      children = [];
      add(...objects) { this.children.push(...objects); }
    },
    Color: class {},
    PerspectiveCamera: function () { return camera; },
    BoxGeometry: Resource,
    MeshStandardMaterial: Resource,
    Mesh: class {
      constructor(geometry, materials) {
        this.geometry = geometry;
        this.material = materials;
        cube = this;
        this.rotation = { set(x, y, z) { Object.assign(this, { x, y, z }); } };
      }
    },
    HemisphereLight: class {},
    DirectionalLight: class { position = { set() {} }; },
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
        useRef: () => ({ current: canvas }),
        useState: (initial) => [initial, (value) => counts.push(value)],
        useEffect: (callback) => { effect = callback; },
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
  const tree = module.exports.default();
  cleanup = effect();
  return {
    counts, cube, tree, renderer, camera, resources, listeners,
    frame(seconds) { loop?.(1000 + seconds * 1000); },
    motion(matches) {
      motion.matches = matches;
      listeners.get('motion:change')();
    },
    resize(width, height) {
      Object.assign(canvas, { clientWidth: width, clientHeight: height });
      listeners.get('resize')();
    },
    unmount() { cleanup(); },
    get running() { return typeof loop === 'function'; },
  };
}

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
