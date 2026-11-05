import * as THREE from 'three'

const inverse = new THREE.Matrix4()
const localRay = new THREE.Ray()
const surface = new THREE.Sphere(new THREE.Vector3(), 1.006)
const point = new THREE.Vector3()

/** Pick the globe once, without traversing its detailed decorative children. */
export function raycastGlobe(this: THREE.Object3D, raycaster: THREE.Raycaster, hits: THREE.Intersection[]) {
  inverse.copy(this.matrixWorld).invert()
  localRay.copy(raycaster.ray).applyMatrix4(inverse)
  if (localRay.intersectSphere(surface, point)) {
    point.applyMatrix4(this.matrixWorld)
    const distance = raycaster.ray.origin.distanceTo(point)
    if (distance >= raycaster.near && distance <= raycaster.far) {
      hits.push({ distance, point: point.clone(), object: this })
    }
  }
  // Three.js uses false to stop recursive picking, even when the sphere is missed.
  return false
}
