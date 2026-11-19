import test from 'node:test'
import assert from 'node:assert/strict'
import { introActive, isGlobeHeld, onIntroChange, setIntroPhase } from '../src/components/intro-state.ts'

test('the logo lift releases the globe while the opening is still active', () => {
  const oldDocument = globalThis.document
  globalThis.document = { documentElement: { dataset: {} } }
  try {
    setIntroPhase('drawing')
    assert.equal(isGlobeHeld(), true, 'a scene mounted late still starts facing India')
    const changes = []
    const unsubscribe = onIntroChange(() => changes.push([introActive(), isGlobeHeld()]))
    setIntroPhase('settling')
    assert.equal(document.documentElement.dataset.introActive, 'true', 'the header logo stays hidden during the lift')
    setIntroPhase('idle')
    assert.equal(document.documentElement.dataset.introActive, undefined)
    setIntroPhase('drawing')
    setIntroPhase('idle')
    unsubscribe()
    assert.deepEqual(changes, [[true, false], [false, false], [true, true], [false, false]])
  } finally {
    setIntroPhase('idle')
    globalThis.document = oldDocument
  }
})
