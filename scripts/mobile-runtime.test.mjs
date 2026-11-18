import test from 'node:test'
import assert from 'node:assert/strict'
import { drawingDpr, motionOwner, horizontalIntent, mobileMotionDone, productYaw } from '../src/three/render-policy.ts'

test('phone resolution respects the complete allocation, device and quality ceiling', () => {
  const dpr = drawingDpr(3, 390, 1100, 1_500_000, true)
  assert.ok(390 * 1100 * dpr * dpr <= 1_500_000)
  assert.ok(dpr <= 2)
  assert.equal(drawingDpr(1.25, 390, 280, 1_500_000, true), 1.25)
  assert.equal(drawingDpr(3, 390, 280, 1_500_000, true), 2)
  assert.ok(Number.isFinite(drawingDpr(2, 0, 0, 1_500_000, true)))
})

test('one visible animated scene owns the phone budget and exits release it', () => {
  assert.equal(motionOwner([{id:'globe',score:.9},{id:'cards',score:.4}]), 'globe')
  assert.equal(motionOwner([{id:'globe',score:0},{id:'cards',score:.4}]), 'cards')
  assert.equal(motionOwner([{id:'globe',score:0},{id:'cards',score:0}]), null)
})

test('phone automatic motion ends once; revisiting does not restart its window', () => {
  assert.equal(mobileMotionDone(1000, 1000), false)
  assert.equal(mobileMotionDone(1000, 5499), false)
  assert.equal(mobileMotionDone(1000, 5500), true)
  assert.equal(mobileMotionDone(1000, 90000), true)
})

test('touch rotation waits for horizontal intent and leaves vertical scroll to the browser', () => {
  assert.equal(horizontalIntent(3, 2), 'pending')
  assert.equal(horizontalIntent(4, 30), 'scroll')
  assert.equal(horizontalIntent(-20, 3), 'rotate')
  assert.equal(horizontalIntent(20, -25), 'scroll')
})

test('product rotation keeps its direction and speed through a full turn', () => {
  assert.equal(productYaw(0, .5), .7)
  for (const time of [1, 5, 10, 15, 20]) {
    assert.ok(Math.abs(productYaw(time + 1, .5) - productYaw(time, .5) - .5) < .00001)
  }
  assert.ok(productYaw(20, .5) - productYaw(0, .5) > Math.PI * 2)
})
