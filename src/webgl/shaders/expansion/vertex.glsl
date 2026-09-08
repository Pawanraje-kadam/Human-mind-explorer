// GPGPU expansion pass — particle positions/velocities live in float
// textures; this pass only samples them and sizes each point by speed.

attribute vec2 aTextureCoord;

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform float     uProgress;
uniform float     uPixelRatio;
uniform vec3      uSpectrumColors[4];

varying vec3  vColor;
varying float vAlpha;
varying float vVelocity;

void main() {
  vec4 pos = texture2D(uPositionTexture, aTextureCoord);
  vec4 vel = texture2D(uVelocityTexture, aTextureCoord);

  float mag  = length(vel.xyz);
  vVelocity  = clamp(mag / 0.08, 0.0, 1.0);

  // Stable per-particle spectrum banding, hashed from its UV slot
  float seed = fract(aTextureCoord.x * 17.13 + aTextureCoord.y * 31.7);
  if (seed < 0.25)      vColor = uSpectrumColors[0]; // rose
  else if (seed < 0.50) vColor = uSpectrumColors[1]; // violet
  else if (seed < 0.75) vColor = uSpectrumColors[2]; // teal
  else                  vColor = uSpectrumColors[3]; // lime

  // Burst open as the state arrives, never a hard cut
  vAlpha = clamp(uProgress * 4.0, 0.0, 1.0) * 0.9;

  vec4 mv = modelViewMatrix * vec4(pos.xyz, 1.0);

  // sizePx semantics: pixels at the reference distance z = 5
  float sizePx = mix(1.2, 3.2, vVelocity);
  gl_PointSize = min(sizePx * uPixelRatio * (5.0 / -mv.z), 28.0 * uPixelRatio);
  gl_Position  = projectionMatrix * mv;
}
