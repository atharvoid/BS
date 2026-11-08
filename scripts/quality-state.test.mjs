import test from 'node:test'
import assert from 'node:assert/strict'

/* The adaptive tiers, exercised as a state machine.
 *
 * Every rule here is one that cannot be checked by looking at a screen: that a
 * hidden tab is not counted, that a single bad window changes nothing, that a
 * slow device loses clarity before it loses animation, and that a reduced-motion
 * visitor stays still however fast their device is. The module is driven through
 * its own public API with a stubbed clock, so the test is the same code the
 * browser runs.
 */

/* --- environment --------------------------------------------------------- */

let now = 0
let rafCallback = null
const mediaListeners = []
let reducedMotion = false

const stub = (name, value) =>
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })

stub('document', {
  hidden: false,
  addEventListener() {},
  documentElement: { dataset: {}, style: { setProperty() {} } },
})
stub('navigator', { hardwareConcurrency: 8, deviceMemory: 8 })
stub('window', {
  matchMedia: () => ({
    matches: reducedMotion,
    addEventListener: (_t, f) => mediaListeners.push(f),
    removeEventListener() {},
  }),
  devicePixelRatio: 2,
  addEventListener() {},
})
stub('performance', { now: () => now })
stub('requestAnimationFrame', (fn) => {
  rafCallback = fn
  return 1
})
stub('cancelAnimationFrame', () => {
  rafCallback = null
})

const perf = await import('../src/three/performance.ts')

/** Advance the clock and fire the sampler's own frame, as a browser would. */
function tick(ms) {
  now += ms
  if (rafCallback) rafCallback(now)
}

/**
 * Drive the sampler for a number of windows, reporting `fps` frames per second
 * from the scene. This is the only way quality changes: the scene says what it
 * managed, and the sampler decides.
 *
 * Time advances *inside* the frame, before the sampler's callback runs, exactly
 * as a real frame does — the callback is handed the timestamp of the frame that
 * just finished. Getting this backwards (advancing after the callback) makes
 * every window look instantaneous, which is a test that always passes.
 */
function run(seconds, fps) {
  const windows = Math.round((seconds * 1000) / 1200)
  const frameMs = 1000 / fps
  for (let w = 0; w < windows; w += 1) {
    for (let f = 0; f < Math.round(fps * 1.2); f += 1) {
      perf.reportFrame(frameMs)
      tick(frameMs)
    }
    tick(1200)
  }
}

/* --- tests --------------------------------------------------------------- */

test('a fast device keeps the highest tier', () => {
  perf.watchPerformance()
  run(20, 60)
  assert.equal(perf.currentQuality(), 'high')
  perf.releasePerformance()
})

test('a deliberately rendered 30fps tier is not classified as a slow 60fps renderer', () => {
  perf.watchPerformance()
  run(30, 60)
  const before = perf.clarityStep()
  for (let i = 0; i < 450; i++) {
    perf.reportFrame(1000 / 30, 30)
    tick(1000 / 30)
  }
  assert.equal(perf.clarityStep(), before)
  assert.equal(perf.currentQuality(), 'high')
  perf.releasePerformance()
})

test('one bad window changes nothing', () => {
  perf.watchPerformance()
  run(20, 60)
  const before = perf.currentQuality()
  run(1.2, 10) // a single very slow window
  assert.equal(perf.currentQuality(), before, 'a single window must not change the tier')
  perf.releasePerformance()
})

test('a sustained miss steps down clarity before animation', () => {
  perf.watchPerformance()
  run(20, 60)
  const clarityBefore = perf.clarityStep()
  run(12, 8) // sustained slowness
  assert.ok(
    perf.clarityStep() > clarityBefore,
    'clarity should be given up before the animation tier is touched',
  )
  perf.releasePerformance()
})

test('a device that never recovers eventually stops animating', () => {
  perf.watchPerformance()
  run(90, 6)
  assert.equal(perf.currentQuality(), 'still', 'the last resort is a still scene')
  perf.releasePerformance()
})

test('no frames drawn means no judgement', () => {
  perf.watchPerformance()
  run(20, 60)
  const before = perf.currentQuality()
  /* Ten seconds of the sampler running with the scene drawing nothing — a stage
     scrolled away from, or a still tier waiting for input. */
  for (let i = 0; i < 100; i += 1) tick(100)
  assert.equal(perf.currentQuality(), before, 'an idle scene must not be marked down')
  perf.releasePerformance()
})

test('a hidden tab is not counted against the device', () => {
  perf.watchPerformance()
  run(20, 60)
  const before = perf.currentQuality()
  document.hidden = true
  for (let i = 0; i < 200; i += 1) tick(250)
  document.hidden = false
  assert.equal(perf.currentQuality(), before)
  perf.releasePerformance()
})

test('reduced motion is always a still scene, however capable the device', () => {
  /* Measured first, so there is a tier to return to. */
  perf.watchPerformance()
  run(30, 60)
  assert.equal(perf.currentQuality(), 'high')

  const listener = mediaListeners[mediaListeners.length - 1]
  assert.ok(listener, 'the preference must be watched')

  listener({ matches: true })
  assert.equal(perf.currentQuality(), 'still', 'a reduced-motion visitor gets a still scene')

  /* Nothing is drawn while the scene is still, and the sampler must not read
     that silence as a reason to change anything. */
  for (let i = 0; i < 40; i += 1) tick(250)
  assert.equal(perf.currentQuality(), 'still')

  /* Turning the preference back off returns the measured tier without a reload. */
  listener({ matches: false })
  assert.equal(perf.currentQuality(), 'high')
  perf.releasePerformance()
})

test('a change is not made twice in quick succession', () => {
  /* Every tier change costs the scene a rebuild — new shaders at a new
     resolution, or a clock that stops. Two in a row is a visible flutter, so
     the cooldown after a change must be respected in both directions. */
  perf.watchPerformance()
  run(20, 60)
  const before = perf.clarityStep()
  run(3, 8)
  const afterFirst = perf.clarityStep()
  assert.ok(afterFirst > before, 'the first sustained miss should have stepped down')
  /* The next window is still slow, but it arrives inside the settle period. */
  run(1.2, 8)
  assert.equal(perf.clarityStep(), afterFirst, 'a second change inside the cooldown must wait')
  perf.releasePerformance()
})

test('nothing about quality is offered to the visitor', async () => {
  /* There is no control, and there must not be: the rules above are the whole
     interface. This asserts the module's public surface, so a future addition
     of a setter or a toggle is caught here rather than reviewed by eye. */
  const exported = Object.keys(perf).sort()
  for (const name of exported) {
    assert.ok(
      !/^set|quality$/i.test(name) || ['currentQuality', 'useQuality'].includes(name),
      `${name} looks like a control`,
    )
  }
  assert.ok(!exported.includes('setQuality'))
  assert.ok(!exported.includes('quality'))
})

test('stalls count even when the mean frame rate looks fine', () => {
  perf.watchPerformance()
  run(20, 60)
  const clarityBefore = perf.clarityStep()
  /* Smooth frames, but two long ones per window: exactly the hitch the mean
     hides. */
  for (let w = 0; w < 8; w += 1) {
    for (let f = 0; f < 60; f += 1) {
      perf.reportFrame(16)
      if (f % 20 === 0) perf.reportStall(400)
      tick(16)
    }
    tick(1200)
  }
  assert.ok(perf.clarityStep() > clarityBefore, 'stalls should have cost clarity')
  perf.releasePerformance()
})
