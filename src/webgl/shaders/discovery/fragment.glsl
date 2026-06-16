uniform float uTime;
uniform float uProgress;
uniform float uRevealRadius;
uniform vec2  uRevealCenter;
uniform vec3  uGoldColor;
uniform vec3  uGoldPale;

varying vec2 vUv;

void main() {
  vec2  center  = vec2(0.5);
  float pattern = 0.0;
  float radius  = 0.18;

  // Centre circle
  float d0 = length(vUv - center);
  pattern += smoothstep(radius + 0.005, radius - 0.005, d0)
           - smoothstep(radius - 0.010, radius - 0.015, d0);

  // 6 surrounding circles (Flower of Life)
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * 3.14159265 / 3.0;
    vec2  pos   = center + vec2(cos(angle), sin(angle)) * radius;
    float d     = length(vUv - pos);
    pattern += smoothstep(radius + 0.005, radius - 0.005, d)
             - smoothstep(radius - 0.010, radius - 0.015, d);
  }

  pattern = clamp(pattern, 0.0, 1.0);

  // Click reveal — expanding ring
  float revealDist = length(vUv - uRevealCenter);
  float revealed   = 1.0 - smoothstep(
    uRevealRadius - 0.05, uRevealRadius + 0.05, revealDist
  );

  vec3  baseColor = mix(uGoldColor, uGoldPale, revealed * 0.5);
  float alpha     = pattern * uProgress * mix(0.4, 1.0, revealed);

  gl_FragColor = vec4(baseColor, alpha);
}
