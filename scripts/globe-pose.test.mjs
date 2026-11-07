import test from 'node:test'
import assert from 'node:assert/strict'
import { globeYaw, globeUserYaw } from '../src/three/globe-pose.ts'
import { createGlobeGate } from '../src/three/globe-gate.ts'

test('sideways dragging changes yaw in both directions while automatic drift is paused', () => {
  const gate = createGlobeGate(-1.2)
  gate.advance(0.1, false, false)
  const displayed = globeYaw(gate.start, gate.drift())
  const user = globeUserYaw(displayed, gate.drift())
  gate.advance(0.1, false, true)
  assert.equal(globeYaw(user, gate.drift()), displayed, 'pointer-down must not snap')
  assert.ok(globeYaw(user + 0.8, gate.drift()) > displayed)
  assert.ok(globeYaw(user - 0.8, gate.drift()) < displayed)
  const released = globeYaw(user + 0.8, gate.drift())
  gate.advance(0.1, false, false)
  assert.ok(Math.abs(globeYaw(user + 0.8, gate.drift()) - released) < 0.01, 'release adds only normal drift, not a reset')
})

test('grabbing during eased motion rebases from the displayed angle, not the old target', () => {
  const displayed = 2.3, drift = 0.4
  assert.ok(Math.abs(globeYaw(globeUserYaw(displayed, drift), drift) - displayed) < 1e-10)
})
