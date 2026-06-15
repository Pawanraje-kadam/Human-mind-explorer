uniform float uTime;
uniform float uProgress;
uniform float uPulse;
uniform vec2  uCursor;
uniform float uInteracting;

varying vec2 vUv;

void main() {
  vec2  center = vec2(0.5);
  float dist   = length(vUv - center);

  // Soft glow falloff
  float glow = pow(max(0.0, 1.0 - dist * 8.0), 3.0);
  glow *= mix(0.6, 1.0, uPulse);

  // Cursor attraction brightening
  float attractBrightness = uInteracting * 0.4;
  glow += attractBrightness * max(0.0, 1.0 - dist * 4.0);

  vec3  color = vec3(0.941, 0.937, 0.914); // neural-white
  float alpha = glow * max(0.01, uProgress);

  gl_FragColor = vec4(color * (1.0 + glow * 0.5), alpha);
}
