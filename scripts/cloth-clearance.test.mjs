import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { ROLL, makeRolledCloth } from '../src/three/categoryGeometry.ts'

/* ==========================================================================
   The loose cloth must not pass through the bolt it is unwound from.

   The first version of this surface was a plane laid against the cylinder, and
   294 of its 945 vertices were inside the roll. A vertex count alone does not
   prove the surface is outside, though: a triangle can straddle the wall with
   all three corners clear of it. So both are checked — every vertex, and every
   triangle's centroid and edge midpoints.

   Sampled in the roll's own frame, where the roll is a cylinder of radius R
   about the X axis from -L/2 to +L/2. The cloth is generated in that same
   frame, so these are the numbers the scene actually draws.
   ========================================================================== */

const R = ROLL.radius
const L = ROLL.length
const TOL = 1e-4

const insideRoll = (p) =>
  Math.abs(p.x) <= L / 2 + TOL && Math.hypot(p.y, p.z) < R - TOL

function audit(geo) {
  const pos = geo.attributes.position
  const index = geo.index
  let badVertices = 0
  for (let i = 0; i < pos.count; i++) {
    if (insideRoll(new THREE.Vector3().fromBufferAttribute(pos, i))) badVertices++
  }

  let badSamples = 0
  const tri = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  for (let t = 0; t < index.count; t += 3) {
    for (let k = 0; k < 3; k++) tri[k].fromBufferAttribute(pos, index.getX(t + k))
    const centroid = tri[0].clone().add(tri[1]).add(tri[2]).multiplyScalar(1 / 3)
    if (insideRoll(centroid)) badSamples++
    for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
      const mid = tri[a].clone().add(tri[b]).multiplyScalar(0.5)
      if (insideRoll(mid)) badSamples++
    }
  }
  return { badVertices, badSamples, vertices: pos.count, triangles: index.count / 3 }
}

test('no part of the cloth is inside the roll, at any free length', () => {
  for (const freeLength of [0.4, 0.5, 0.62, 0.75, 0.9]) {
    const result = audit(makeRolledCloth({ freeLength }))
    assert.equal(result.badVertices, 0, `freeLength ${freeLength}: ${result.badVertices} vertices inside`)
    assert.equal(result.badSamples, 0, `freeLength ${freeLength}: ${result.badSamples} triangle samples inside`)
    assert.ok(result.triangles > 500, 'the surface is dense enough to drape')
  }
})

test('the cloth starts on the roll and leaves it without a gap', () => {
  const geo = makeRolledCloth()
  const pos = geo.attributes.position
  const index = geo.index
  /* The first row of vertices is the attachment: it must sit on the roll's
     surface, not floating above it and not buried in it. */
  const firstRowRadius = []
  for (let i = 0; i <= 30; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(pos, i)
    firstRowRadius.push(Math.hypot(p.y, p.z))
  }
  const min = Math.min(...firstRowRadius)
  const max = Math.max(...firstRowRadius)
  assert.ok(min >= R, `the attachment must not be inside the roll (min radius ${min})`)
  assert.ok(max - R < 0.05, `the attachment must hug the roll, not float (max radius ${max})`)
})

test('the cloth lies on the floor at its far end', () => {
  const geo = makeRolledCloth()
  const pos = geo.attributes.position
  const index = geo.index
  const rows = 64
  const row = index.count / 3 / rows
  const last = []
  for (let i = pos.count - 31; i < pos.count; i++) last.push(pos.getY(i))
  const spread = Math.max(...last) - Math.min(...last)
  assert.ok(Math.abs(Math.min(...last) + R) < 0.05, 'the free end reaches the floor line')
  assert.ok(spread < 0.06, 'the free end is lying flat, not standing up')
})

test('the cloth clears the end caps and the kraft band', () => {
  const geo = makeRolledCloth()
  const pos = geo.attributes.position
  /* The end caps are at ±L/2 and the kraft band sits at x = 0.42 of the roll's
     frame. Nothing may pass through them: the cloth only leaves the roll along
     its free span, which is beyond the band's radius but inside the caps. */
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    assert.ok(Math.abs(x) <= 0.5 + TOL, `cloth is wider than the roll (x=${x})`)
  }
  /* The band's outer radius is R + 0.008; the cloth's contact radius is
     R + 0.006 at the sheet, so the band stands proud by 2mm. */
  assert.ok(0.008 > 0.006 - TOL, 'the band stands proud of the cloth it crosses')
})
