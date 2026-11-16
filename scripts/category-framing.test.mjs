import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { FIT_HEIGHT, FIT_SWEEP, FIT_WIDTH, frameModel } from '../src/three/framing.ts'
import {
  CRATE,
  makeCopperCoil,
  makeVaseBody,
} from '../src/three/categoryGeometry.ts'

import { makeFabricSamples, makeCommoditySamples } from '../src/three/sourcingGeometry.ts'
import { makeWheatHead } from '../src/three/wheatGeometry.ts'
import { makeTextileSample } from '../src/three/textileGeometry.ts'

/* One box per model, built from the real geometry the tiles mount. */
function boxOf(object) {
  object.updateMatrixWorld(true)
  return new THREE.Box3().setFromObject(object)
}

function textileBox() {
  const model=makeTextileSample(),box=boxOf(model)
  model.traverse(mesh=>{if(mesh.isMesh){mesh.geometry.dispose();mesh.material.dispose()}})
  return box
}
function agricultureBox() { const g=makeWheatHead(); const box=boxOf(new THREE.Mesh(g)); g.dispose(); return box }

function vaseBox() {
  return boxOf(new THREE.Mesh(makeVaseBody(32)))
}

function coilBox() {
  return boxOf(new THREE.Mesh(makeCopperCoil()))
}

function crateBox() {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.BoxGeometry(CRATE.width, CRATE.height, CRATE.depth)))
  return boxOf(g)
}

const MODELS = {
  textiles: textileBox,
  handicrafts: vaseBox,
  agriculture: agricultureBox,
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

test('replacement framing is derived from the actual folded-length and stepped-holder factories', () => {
  const fabric = makeFabricSamples(), holder = makeCommoditySamples()
  assert.equal(fabric.children.filter(child => child.name.startsWith('folded-length-')).length, 3)
  assert.ok(holder.getObjectByName('sample-holder-stepped'))
  assert.equal(holder.children.filter(child => child.isInstancedMesh).length, 3)
  assert.notEqual(frameModel(boxOf(fabric)).scale, frameModel(crateBox()).scale)
})
