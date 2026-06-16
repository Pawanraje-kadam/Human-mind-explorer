uniform float uBlend1; // Neural threads
uniform float uBlend2; // Memory planes
uniform float uBlend3; // Sacred geometry
uniform float uBlend4; // Fluid particles
uniform float uConverge;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec3 threadColor = vec3(0.910, 0.502, 0.227) * uBlend1; // amber-fire
  vec3 planeColor  = vec3(0.290, 0.227, 0.659) * uBlend2; // indigo-light
  vec3 geoColor    = vec3(0.831, 0.659, 0.251) * uBlend3; // gold-pure
  vec3 fluidColor  = vec3(0.439, 0.251, 0.784) * uBlend4; // spectrum-violet

  vec3  combined    = threadColor + planeColor + geoColor + fluidColor;
  float totalWeight = uBlend1 + uBlend2 + uBlend3 + uBlend4;

  if (totalWeight > 0.001) combined /= totalWeight;

  // Convergence shifts toward neural-white
  combined = mix(combined, vec3(0.941, 0.937, 0.914), uConverge);

  float alpha  = clamp(totalWeight * 0.8, 0.0, 1.0);
  gl_FragColor = vec4(combined, alpha);
}
