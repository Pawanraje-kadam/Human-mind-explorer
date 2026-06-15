uniform float uTime;
uniform float uProgress;
uniform float uActivation;
uniform vec3  uAmberColor;

varying vec2 vUv;

void main() {
  // Thread rendering — thin line along UV centre
  float lineDist  = abs(vUv.y - 0.5);
  float lineWidth = 0.03;
  float line      = smoothstep(lineWidth, 0.0, lineDist);

  // Activation pulse along thread length
  float pulse = sin(vUv.x * 12.0 - uTime * 4.0) * 0.5 + 0.5;
  pulse = mix(0.6, 1.0, pulse * uActivation);

  vec3 baseColor  = vec3(0.941, 0.937, 0.914);
  vec3 finalColor = mix(baseColor, uAmberColor, uActivation * 0.8);

  float alpha  = line * pulse * uProgress;
  gl_FragColor = vec4(finalColor, alpha);
}
