uniform float uTime;
uniform float uLayerIndex;
uniform float uLayerDepth;
uniform float uScrollSpeed;
uniform vec3  uIndigoLight;
uniform vec3  uIndigoMid;
uniform vec3  uIndigoDeep;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  // Edge fade
  float edgeFade = smoothstep(0.0, 0.2, vUv.x)
                 * smoothstep(1.0, 0.8, vUv.x)
                 * smoothstep(0.0, 0.1, vUv.y)
                 * smoothstep(1.0, 0.9, vUv.y);

  // Memory forms via noise
  float n    = noise(vUv * 4.0 + uTime * 0.02);
  float form = smoothstep(0.4, 0.6, n) * 0.4;

  // Color by depth
  vec3 color = mix(uIndigoLight, uIndigoMid,  uLayerDepth);
  color      = mix(color,        uIndigoDeep, uLayerDepth * uLayerDepth);

  // Scroll-speed blur
  float blurAmount = smoothstep(0.3, 1.0, uScrollSpeed);
  float alpha      = (0.15 + form) * edgeFade * (1.0 - blurAmount * 0.7);

  gl_FragColor = vec4(color, alpha);
}
