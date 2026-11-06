import assert from 'node:assert/strict'
import test from 'node:test'
import { selectNearbyTarget } from '../src/components/cursor-state.ts'

test('nearby menu choices stay stable but direct hits take precedence', () => {
  const items = [
    { id: 'a', rect: { left: 0, top: 0, right: 100, bottom: 40 } },
    { id: 'b', rect: { left: 110, top: 0, right: 210, bottom: 40 } },
  ]
  assert.equal(selectNearbyTarget(items, 103, 20, null), 'a')
  assert.equal(selectNearbyTarget(items, 106, 20, 'a'), 'a')
  assert.equal(selectNearbyTarget(items, 109, 20, 'a'), 'b')
  assert.equal(selectNearbyTarget(items, 110, 20, 'a'), 'b')
  assert.equal(selectNearbyTarget(items, 241, 20, 'b'), 'b')
  assert.equal(selectNearbyTarget(items, 241, 20, null), null)
  assert.equal(selectNearbyTarget(items, 245, 20, 'b'), null)
})
