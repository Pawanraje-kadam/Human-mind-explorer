import { Scene, PerspectiveCamera, AmbientLight, Color } from 'three'

export function createScene(): Scene {
  const scene      = new Scene()
  scene.background = new Color(0x020408)

  const ambient = new AmbientLight(0x020408, 0.1)
  scene.add(ambient)

  return scene
}

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 5)
  return camera
}
