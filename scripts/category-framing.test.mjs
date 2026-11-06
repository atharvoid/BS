import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { FIT_HEIGHT, FIT_SWEEP, FIT_WIDTH, frameModel } from '../src/three/framing.ts'
import {
  CRATE,
  ROLL,
  copperTurns,
  makeClothTail,
  makeSackBody,
  makeVaseBody,
} from '../src/three/categoryGeometry.ts'

/* One box per model, built from the real geometry the tiles mount. */
function boxOf(object) {
  object.updateMatrixWorld(true)
  return new THREE.Box3().setFromObject(object)
}

function rollBox() {
  const g = new THREE.Group()
  const { radius, length } = ROLL
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 32))
  bolt.rotation.z = Math.PI / 2
  bolt.position.set(-0.14, radius, 0)
  g.add(bolt)
  const tail = new THREE.Mesh(makeClothTail())
  tail.position.set(0.2, 0.02, 0.4)
  tail.rotation.set(-1.38, 0.1, 0.04)
  g.add(tail)
  return boxOf(g)
}

function vaseBox() {
  return boxOf(new THREE.Mesh(makeVaseBody(32)))
}

function sackBox() {
  return boxOf(new THREE.Mesh(makeSackBody(32)))
}

function coilBox() {
  const g = new THREE.Group()
  for (const turn of copperTurns()) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(turn.r, 0.036, 8, 24))
    mesh.rotation.x = Math.PI / 2
    mesh.position.set(turn.x, turn.y, 0)
    g.add(mesh)
  }
  return boxOf(g)
}

function crateBox() {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.BoxGeometry(CRATE.width, CRATE.height, CRATE.depth)))
  return boxOf(g)
}

const MODELS = {
  textiles: rollBox,
  handicrafts: vaseBox,
  agriculture: sackBox,
  industrial: coilBox,
  general: crateBox,
}

test('every category model fits its tile, at every angle it turns through', () => {
  for (const [name, build] of Object.entries(MODELS)) {
    const size = build().getSize(new THREE.Vector3())
    const framing = frameModel(build())
    assert.ok(framing, `${name} must be measurable`)
    const s = framing.scale
    const height = size.y * s
    const widest = Math.max(size.x, size.z) * s
    const sweep = Math.hypot(size.x, size.z) * s
    assert.ok(height <= FIT_HEIGHT + 1e-9, `${name} is too tall: ${height}`)
    assert.ok(widest <= FIT_WIDTH + 1e-9, `${name} is too wide: ${widest}`)
    assert.ok(sweep <= FIT_SWEEP + 1e-9, `${name} clips while turning: ${sweep}`)
    /* and it actually uses the frame — nothing is left floating in a corner */
    assert.ok(height > FIT_HEIGHT * 0.45, `${name} is lost in its tile: ${height}`)
  }
})

test('framing centres each model on the spin axis', () => {
  for (const [name, build] of Object.entries(MODELS)) {
    const box = build()
    const framing = frameModel(box)
    const centre = box.getCenter(new THREE.Vector3())
    const s = framing.scale
    /* after the offset, the sphere centre sits at the origin */
    assert.ok(Math.abs(centre.x * s + framing.position[0]) < 1e-9, `${name} x`)
    assert.ok(Math.abs(centre.y * s + framing.position[1]) < 1e-9, `${name} y`)
    assert.ok(Math.abs(centre.z * s + framing.position[2]) < 1e-9, `${name} z`)
  }
})

test('the base and footprint describe a shadow under the model', () => {
  for (const [name, build] of Object.entries(MODELS)) {
    const framing = frameModel(build())
    assert.ok(framing.base < 0, `${name} base should be below the spin centre`)
    assert.ok(framing.base >= -(FIT_HEIGHT / 2) - 1e-9, `${name} base should be inside the model`)
    assert.ok(framing.footprint > 0, `${name} footprint should be positive`)
  }
})

test('a model with nothing in it is not framed', () => {
  assert.equal(frameModel(new THREE.Box3()), null)
  assert.equal(frameModel(new THREE.Box3(new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1))), null)
})

test('the roll and the crate are the two extremes the row has to reconcile', () => {
  const roll = frameModel(rollBox())
  const crate = frameModel(crateBox())
  /* A long thin bolt needs a much smaller scale than a cube of the same size;
     if these were ever equal the framing would have collapsed to a constant. */
  assert.ok(roll.scale < crate.scale, 'the long bolt must be scaled down more than the crate')
})
