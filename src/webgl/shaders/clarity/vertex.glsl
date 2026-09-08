uniform float uTime;
uniform float uBreath;

attribute vec3 aBarycentric;

varying vec2 vUv;
varying vec3 vBarycentric;

void main() {
  vUv = uv;

  // Pass the barycentric VECTOR through — per-vertex min() would be 0
  // at every corner and the wireframe could never appear. Edge
  // distance must be measured after interpolation, in the fragment.
  vBarycentric = aBarycentric;

  // Subtle breathing scale — the form is alive, barely
  vec3 breathedPosition = position * uBreath;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(breathedPosition, 1.0);
}
