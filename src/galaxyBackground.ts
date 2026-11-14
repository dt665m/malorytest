import * as THREE from 'three';

// A static, screen-space backdrop: no textures, extra lights, or animation loop.
export function createGalaxyBackground() {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: { aspect: { value: 1 } },
    depthTest: false,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform float aspect;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      vec3 blackHole(vec3 sky, vec2 p, float radius, vec3 tint) {
        // Flatten the accretion disk, but keep the event horizon circular.
        vec2 tilted = vec2(p.x + p.y * 0.35, p.y);
        float disk = length(tilted / vec2(1.0, 0.28));
        float ring = exp(-pow((disk - radius * 1.8) / (radius * 0.24), 2.0));
        float r = length(p);
        float halo = exp(-pow((r - radius * 1.06) / (radius * 0.12), 2.0));
        sky += tint * (ring * 1.5 + halo * 0.9);
        return sky * smoothstep(radius * 0.91, radius, r);
      }

      void main() {
        vec2 scale = vec2(aspect, 1.0);
        vec2 p = (vUv - 0.5) * scale;
        // Rotate and flatten a spiral galaxy behind the foreground cube.
        vec2 g = mat2(0.86, -0.5, 0.5, 0.86) * p;
        g.y *= 2.3;
        float r = length(g);
        float angle = atan(g.y, g.x);
        float arms = pow(0.5 + 0.5 * sin(angle * 3.0 - r * 13.0), 3.0);
        float cloud = exp(-r * 2.5) * (0.25 + arms * 0.75);
        vec3 color = vec3(0.008, 0.012, 0.035);
        color += cloud * mix(vec3(0.12, 0.15, 0.48), vec3(0.42, 0.12, 0.48), arms);
        color += vec3(0.55, 0.4, 0.28) * exp(-r * 12.0);

        vec2 grid = vUv * scale * 330.0;
        vec2 cell = floor(grid);
        vec2 point = vec2(hash(cell), hash(cell + 29.7));
        float star = 1.0 - smoothstep(0.015, 0.13, length(fract(grid) - point));
        star *= step(0.975, hash(cell + 71.3));
        color += star * mix(vec3(0.45, 0.65, 1.0), vec3(1.0, 0.85, 0.65), hash(cell + 9.0));

        color = blackHole(color, (vUv - vec2(0.21, 0.73)) * scale, 0.052, vec3(1.0, 0.46, 0.12));
        color = blackHole(color, (vUv - vec2(0.81, 0.26)) * scale, 0.037, vec3(0.35, 0.65, 1.0));
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}
