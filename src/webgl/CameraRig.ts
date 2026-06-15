import { PerspectiveCamera, Vector3, MathUtils } from 'three'
import type { CameraRigTarget } from '@/types/webgl'
import { lerp } from '@/lib/math'

interface Waypoint {
  progress: number
  x: number; y: number; z: number
}

const WAYPOINTS: Waypoint[] = [
  { progress: 0.00, x: 0,    y:  0.0, z: 5.0 },
  { progress: 0.06, x: 0,    y:  0.0, z: 4.8 },
  { progress: 0.12, x: 0.1,  y: -0.1, z: 4.6 },
  { progress: 0.18, x: 0,    y:  0.0, z: 4.4 },
  { progress: 0.28, x: 0,    y:  0.0, z: 4.2 },
  { progress: 0.42, x: 0,    y: -0.8, z: 4.0 },
  { progress: 0.50, x: 0,    y: -0.4, z: 4.2 },
  { progress: 0.62, x: 0,    y: -0.3, z: 4.4 },
  { progress: 0.72, x: 0,    y:  0.0, z: 5.5 },
  { progress: 0.86, x: 0,    y: -0.3, z: 4.8 },
  { progress: 1.00, x: 0,    y:  0.0, z: 5.0 },
]

export class CameraRig {
  private camera:  PerspectiveCamera
  public  target:  CameraRigTarget = { x: 0, y: 0, z: 5, roll: 0 }
  private current: CameraRigTarget = { x: 0, y: 0, z: 5, roll: 0 }
  private lookAt:  Vector3         = new Vector3(0, 0, 0)

  constructor(camera: PerspectiveCamera) {
    this.camera = camera
  }

  update(delta: number): void {
    const s = Math.min(0.05 * delta * 60, 1)

    this.current.x    = lerp(this.current.x,    this.target.x,    s)
    this.current.y    = lerp(this.current.y,    this.target.y,    s)
    this.current.z    = lerp(this.current.z,    this.target.z,    s)
    this.current.roll = lerp(this.current.roll, this.target.roll,  s)

    this.camera.position.set(this.current.x, this.current.y, this.current.z)
    this.camera.lookAt(this.lookAt)
    this.camera.rotation.z = MathUtils.degToRad(this.current.roll)
  }

  setCameraPositionFromProgress(mindProgress: number): void {
    // Find surrounding waypoints
    let a = WAYPOINTS[0]
    let b = WAYPOINTS[WAYPOINTS.length - 1]

    for (let i = 0; i < WAYPOINTS.length - 1; i++) {
      if (
        mindProgress >= WAYPOINTS[i].progress &&
        mindProgress <= WAYPOINTS[i + 1].progress
      ) {
        a = WAYPOINTS[i]
        b = WAYPOINTS[i + 1]
        break
      }
    }

    const span = b.progress - a.progress
    const t    = span > 0 ? (mindProgress - a.progress) / span : 0

    this.target.x = lerp(a.x, b.x, t)
    this.target.y = lerp(a.y, b.y, t)
    this.target.z = lerp(a.z, b.z, t)
  }

  setRoll(degrees: number): void {
    this.target.roll = degrees
  }

  resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
  }
}
