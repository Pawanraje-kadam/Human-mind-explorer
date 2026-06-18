export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

export const map = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  const t = (value - inMin) / (inMax - inMin)
  return lerp(outMin, outMax, clamp(t, 0, 1))
}

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export const stateProgress = (
  mindProgress: number,
  start: number,
  end: number
): number => clamp((mindProgress - start) / (end - start), 0, 1)
