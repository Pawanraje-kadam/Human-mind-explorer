uniform float uTime;
uniform float uChaos;
uniform float uProgress;

varying vec2 vUv;

void main() {
  // Fractured plane fragment — edge highlight
  vec2  center   = vec2(0.5);
  float edgeDist = min(
    min(vUv.x, 1.0 - vUv.x),
    min(vUv.y, 1.0 - vUv.y)
  );
  float edge = 1.0 - smoothstep(0.0, 0.04, edgeDist);

  vec3  faceColor = vec3(0.027, 0.051, 0.078); // void-deep
  vec3  edgeColor = vec3(0.941, 0.937, 0.914); // neural-white
  vec3  color     = mix(faceColor, edgeColor, edge);

  float alpha = mix(0.4, 0.9, edge) * uProgress;
  gl_FragColor  = vec4(color, alpha);
}
