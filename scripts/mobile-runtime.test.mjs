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

test('phone product motion keeps the material face readable, including its final pose', () => {
  for (let seconds = 0; seconds < 60; seconds += .1) {
    const yaw = productYaw(seconds, .5, true)
    assert.ok(yaw >= .44 && yaw <= .96)
  }
  assert.equal(productYaw(0, .5, true), .7)
  assert.equal(productYaw(10, .5, false), 5.7)
})
