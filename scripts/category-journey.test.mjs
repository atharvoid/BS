import test from 'node:test'
import assert from 'node:assert/strict'
import { journeyPose, CATEGORY_COUNT } from '../src/components/category-journey.ts'

test('all six objects enter, lose detail, then settle into their own evenly spaced dock', () => {
  for (let i = 0; i < CATEGORY_COUNT; i++) {
    const before = journeyPose(i, i - .01, 1440, 900, 160)
    const reading = journeyPose(i, i + .3, 1440, 900, 160)
    const titleOnly = journeyPose(i, i + .57, 1440, 900, 160)
    const dock = journeyPose(i, 6, 1440, 900, 160)
    assert.equal(before.visible, false)
    assert.equal(reading.detail, 1)
    assert.equal(titleOnly.detail, 0)
    assert.equal(titleOnly.title, 1)
    assert.equal(dock.docked, 1)
    assert.equal(dock.x, 240 * (i + .5))
    assert.equal(dock.y, 900 - 160 + 160 * .38)
    assert.equal(dock.title, 0)
  }
})
test('docking is continuous and reversible, including exact chapter boundaries', () => {
  for (let i = 0; i < 6; i++) {
    for (const phase of [0, .22, .38, .58, .76, .9, 1]) {
      const a = journeyPose(i, i + phase - 1e-6, 390, 844, 102)
      const b = journeyPose(i, i + phase + 1e-6, 390, 844, 102)
      for (const key of ['x', 'y', 'height', 'detail', 'title']) assert.ok(Math.abs(a[key] - b[key]) < .02, `${i} ${phase} ${key}`)
    }
  }
})
test('phone dock fits all six objects with finite coordinates, including short landscapes', () => {
  for (const [w, h] of [[320, 568], [390, 844], [844, 390], [1440, 900]]) {
    for (let i = 0; i < 6; i++) {
      const p = journeyPose(i, 6, w, h, 102)
      assert.ok(p.x > 0 && p.x < w)
      assert.ok(p.y > 0 && p.y < h)
      assert.ok(Number.isFinite(p.height) && p.height > 0)
    }
  }
})
