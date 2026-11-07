import test from 'node:test'
import assert from 'node:assert/strict'

test('a late intro subscriber is notified when the already-active intro clears', async () => {
  const oldDocument = globalThis.document
  const oldObserver = globalThis.MutationObserver
  let notify
  globalThis.document = { documentElement: { dataset: { introActive: 'true' } } }
  globalThis.MutationObserver = class {
    constructor(callback) { notify = callback }
    observe() {}
  }
  try {
    const { onIntroChange, introActive } = await import('../src/components/intro-state.ts')
    const changes = []
    const off = onIntroChange(active => changes.push(active))
    assert.equal(introActive(), true)
    delete document.documentElement.dataset.introActive
    notify()
    assert.deepEqual(changes, [false], 'clearing must unblock deferred scenes')
    document.documentElement.dataset.introActive = 'true'
    notify()
    delete document.documentElement.dataset.introActive
    notify()
    assert.deepEqual(changes, [false, true, false], 'logo replay has both edges')
    off()
    document.documentElement.dataset.introActive = 'true'
    notify()
    assert.equal(changes.length, 3)
  } finally {
    globalThis.document = oldDocument
    globalThis.MutationObserver = oldObserver
  }
})
