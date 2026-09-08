uniform float uCursorSpeed;

varying vec3  vColor;
varying float vAlpha;
varying float vVelocity;

void main() {
  vec2  coord = gl_PointCoord - vec2(0.5);
  float dist  = length(coord);
  if (dist > 0.5) discard;

  // Soft round particle; faster particles bleed slightly brighter
  float alpha = smoothstep(0.5, 0.1, dist) * vAlpha * mix(0.75, 1.0, vVelocity);

  // Cursor speed amplifies the flow — drawing feels alive
  float boost = 1.0 + uCursorSpeed * 0.6;

  gl_FragColor = vec4(vColor * boost, alpha);
}
