uniform float uTime;
uniform float uBreath;

attribute vec3 aBarycentric;

varying vec2  vUv;
varying vec3  vWorldPos;
varying float vBary;

void main() {
  vUv = uv;

  // Minimum of the three barycentric components.
  // At triangle edges, one component approaches 0 — this drives
  // the wireframe line in the fragment shader.
  vBary = min(aBarycentric.x, min(aBarycentric.y, aBarycentric.z));

  // Subtle breathing scale — the form is alive, barely
  vec3 breathedPosition = position * uBreath;

  vec4 worldPos = modelMatrix * vec4(breathedPosition, 1.0);
  vWorldPos = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
