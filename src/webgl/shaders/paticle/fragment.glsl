varying vec3  vColor;
varying float vAlpha;

void main() {
  vec2  coord = gl_PointCoord - vec2(0.5);
  float dist  = length(coord);
  if (dist > 0.5) discard;

  float alpha  = smoothstep(0.5, 0.2, dist) * vAlpha;
  gl_FragColor = vec4(vColor, alpha);
}
