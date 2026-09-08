uniform float uTime;
uniform float uProgress;
uniform float uFocusDist;
uniform vec3  uNeuralWhite;

varying vec2 vUv;
varying vec3 vBarycentric;

void main() {
  // Wireframe via interpolated barycentric coordinates: near a
  // triangle edge, one component approaches 0.
  float minB = min(vBarycentric.x, min(vBarycentric.y, vBarycentric.z));
  float wire = 1.0 - smoothstep(0.0, 0.05, minB);

  if (wire < 0.01) discard;

  float brightness = mix(0.6, 1.4, 1.0 - clamp(uFocusDist, 0.0, 1.0));
  vec3  color      = uNeuralWhite * brightness;
  float alpha      = wire * uProgress;

  gl_FragColor = vec4(color, alpha);
}
