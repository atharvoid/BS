import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { raycastGlobe } from '../src/three/globe-raycast.ts'

test('globe picking returns one hit without visiting decorative geometry', () => {
  const globe = new THREE.Group()
  globe.raycast = raycastGlobe
  globe.position.set(2, 0, 0)
  globe.scale.setScalar(2)
  globe.rotation.y = 0.7
  const decoration = new THREE.Object3D()
  decoration.raycast = () => assert.fail('decorative coastlines must not be picked')
  globe.add(decoration)
  globe.updateMatrixWorld(true)

  const ray = new THREE.Raycaster(new THREE.Vector3(2, 0, 8), new THREE.Vector3(0, 0, -1))
  const hits = ray.intersectObject(globe, true)
  assert.equal(hits.length, 1)
  assert.equal(hits[0].object, globe)
  assert.ok(Math.abs(hits[0].point.z - 2.012) < 1e-6)
  assert.ok(Math.abs(hits[0].distance - 5.988) < 1e-6)

  ray.ray.origin.x = -3
  assert.equal(ray.intersectObject(globe, true).length, 0, 'outside the globe stays inert')
  ray.ray.origin.x = 2
  ray.far = 5
  assert.equal(ray.intersectObject(globe, true).length, 0, 'far clipping is respected')
  ray.far = Infinity
  ray.near = 7
  assert.equal(ray.intersectObject(globe, true).length, 0, 'near clipping is respected')
})
