uniform float uTime;
uniform float uProgress;
uniform float uCursorSpeed;
uniform vec3  uSpectrumColors[4];

varying vec3  vColor;
varying float vAlpha;
varying float vVelocity;

void main() {
  vec2  coord = gl_PointCoord - vec2(0.5);
  float dist  = length(coord);
  if (dist > 0.5) discard;

  // Speed-based size bleed
  float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;

  // Boost near cursor
  float boost = 1.0 + uCursorSpeed * 0.5;
  alpha *= boost;

  gl_FragColor = vec4(vColor * boost, alpha);
}
