uniform float uTime;
uniform float uProgress;
uniform float uFocusDist;
uniform vec3  uNeuralWhite;

varying vec2  vUv;
varying vec3  vWorldPos;
varying float vBary;

void main() {
  // Wireframe via barycentric coordinate (vBary = min barycentric component)
  float edge = smoothstep(0.0, 0.015, vBary);
  float wire = 1.0 - edge;

  if (wire < 0.01) discard;

  float brightness = mix(0.6, 1.4, 1.0 - clamp(uFocusDist, 0.0, 1.0));
  vec3  color      = uNeuralWhite * brightness;
  float alpha      = wire * uProgress;

  gl_FragColor = vec4(color, alpha);
}
