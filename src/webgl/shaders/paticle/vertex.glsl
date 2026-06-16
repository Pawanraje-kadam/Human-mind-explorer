attribute float aSize;
attribute vec3  aColor;
attribute float aAlpha;

uniform float uTime;
uniform float uPixelRatio;

varying vec3  vColor;
varying float vAlpha;

void main() {
  vColor = aColor;
  vAlpha = aAlpha;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
  gl_Position  = projectionMatrix * mvPosition;
}
