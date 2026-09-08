// Ambient particle field — a thin veil of dust that persists through
// every state: the mind's background activity, always present.

attribute float aSize;
attribute vec3  aColor;
attribute float aAlpha;
attribute float aSeed;

uniform float uTime;
uniform float uPixelRatio;
uniform float uGlobalAlpha;

varying vec3  vColor;
varying float vAlpha;

void main() {
  vColor = aColor;

  // Slow orbital drift around each particle's anchor point
  vec3 pos = position + vec3(
    sin(uTime * 0.12 + aSeed * 6.2831),
    cos(uTime * 0.10 + aSeed * 9.4247),
    sin(uTime * 0.07 + aSeed * 3.1415)
  ) * 0.08;

  // Gentle twinkle — alive, never demanding
  float twinkle = 0.75 + 0.25 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
  vAlpha = aAlpha * uGlobalAlpha * twinkle;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = min(aSize * uPixelRatio * (5.0 / -mv.z), 12.0 * uPixelRatio);
  gl_Position  = projectionMatrix * mv;
}
