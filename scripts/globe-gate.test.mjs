import assert from 'node:assert/strict'
import test from 'node:test'
import { SPIN_RATE, createGlobeGate } from '../src/three/globe-gate.ts'

const START = -1.2

test('the globe does not move while the opening is on screen', () => {
  const gate = createGlobeGate(START)
  gate.intro(true)
  for (let i = 0; i < 200; i++) gate.advance(1 / 60, false, false)
  assert.equal(gate.angle(), START, 'the held angle is exactly the start angle')
  assert.equal(gate.drift(), 0)
})

test('drift begins only when the opening clears, from the India angle', () => {
  const gate = createGlobeGate(START)
  gate.intro(true)
  gate.advance(0.5, false, false)
  gate.intro(false)
  assert.equal(gate.angle(), START, 'clearing the opening rewinds')

  /* One second of drift, in realistic frames. */
  for (let i = 0; i < 60; i++) gate.advance(1 / 60, false, false)
  assert.ok(Math.abs(gate.angle() - (START + SPIN_RATE)) < 1e-6, 'one second of drift')
})

test('replaying the opening rewinds to the same angle', () => {
  const gate = createGlobeGate(START)
  gate.intro(false)
  for (let i = 0; i < 180; i++) gate.advance(1 / 60, false, false)
  const drifted = gate.angle()
  assert.ok(drifted > START)

  gate.intro(true)
  assert.equal(gate.angle(), START, 'the replay starts from India again')
  for (let i = 0; i < 30; i++) gate.advance(1 / 60, false, false)
  assert.equal(gate.angle(), START, 'and holds while it is on screen')
  gate.intro(false)
  assert.equal(gate.angle(), START)
})

test('a still frame freezes without rewinding', () => {
  const gate = createGlobeGate(START)
  gate.intro(false)
  for (let i = 0; i < 120; i++) gate.advance(1 / 60, false, false)
  const at = gate.angle()
  for (let i = 0; i < 60; i++) gate.advance(1 / 60, true, false)
  assert.equal(gate.angle(), at, 'a still device keeps the view it had')
})

test('a drag takes over from the displayed angle without advancing it', () => {
  const gate = createGlobeGate(START)
  gate.intro(false)
  for (let i = 0; i < 120; i++) gate.advance(1 / 60, false, false)
  const at = gate.angle()
  for (let i = 0; i < 60; i++) gate.advance(1 / 60, false, true)
  assert.equal(gate.angle(), at, 'the visitor holds the angle while dragging')
  for (let i = 0; i < 60; i++) gate.advance(1 / 60, false, false)
  assert.ok(Math.abs(gate.angle() - (at + SPIN_RATE)) < 1e-6, 'and it resumes from there')
})

test('returning from a background tab resumes, it does not jump', () => {
  const gate = createGlobeGate(START)
  gate.intro(false)
  for (let i = 0; i < 120; i++) gate.advance(1 / 60, false, false)
  const at = gate.angle()
  /* A tab restored after minutes presents one enormous delta. */
  gate.advance(240, false, false)
  assert.equal(gate.angle(), at, 'the background time is dropped, not caught up')
  /* The next real frame resumes from where it was. */
  gate.advance(1 / 60, false, false)
  assert.ok(Math.abs(gate.angle() - (at + SPIN_RATE / 60)) < 1e-9)
})

test('nonsense deltas are ignored', () => {
  const gate = createGlobeGate(START)
  gate.intro(false)
  gate.advance(Number.NaN, false, false)
  gate.advance(-5, false, false)
  gate.advance(0, false, false)
  assert.equal(gate.angle(), START)
})
