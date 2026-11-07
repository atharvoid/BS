import test from 'node:test'
import assert from 'node:assert/strict'

/* The resolution ladder is pure maths with no DOM in it, so it is checked here
   rather than by eye on a screen: a step that never applies, a cap that ignores
   one axis, or a scene drawn above the screen's own ratio are all easy to write
   and almost impossible to spot in a screenshot.

   The module is imported through a loader shim because it ships as TypeScript;
   the three lines it needs (`document`, `window`, `navigator`) are stubbed
   below, before the import. */

/* Node 22 already defines `navigator`, and `window`/`document` are absent. The
   ones that exist are replaced through `defineProperty` because they are
   read-only getters. */
const stub = (name, value) =>
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })

stub('document', { hidden: false, addEventListener() {} })
stub('navigator', { hardwareConcurrency: 8, deviceMemory: 8 })
stub('window', {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  devicePixelRatio: 2,
  addEventListener() {},
})
stub('requestAnimationFrame', () => 0)
stub('cancelAnimationFrame', () => {})

const { resolutionFor, measuredDpr } = await import('../src/three/performance.ts')

test('never draws above the screen’s own ratio', () => {
  for (const dpr of [1, 1.5, 2, 2.625, 3, 4]) {
    const { dpr: chosen } = resolutionFor('high', 800, 600, dpr)
    assert.ok(chosen <= dpr + 1e-9, `chose ${chosen} on a ${dpr}× screen`)
  }
})

test('a slow device loses clarity one rung at a time, never in a jump', () => {
  /* The old rule fell from 1.75 straight to 1. That is the step that read as a
     bug, so the ladder has to contain every rung between them. */
  const ladder = [3, 2.5, 2, 1.75, 1.5, 1.25, 1]
  /* A small canvas, so the budget stays out of the way and this measures the
     ladder alone. */
  const ratios = ladder.map((screen) => resolutionFor('high', 320, 200, screen).dpr)
  for (let i = 1; i < ratios.length; i += 1) {
    const drop = ratios[i - 1] / ratios[i]
    assert.ok(drop <= 1.25 + 1e-9, `rung ${i} drops by ${drop.toFixed(2)}×`)
  }
  /* Every rung is reachable: none is shadowed by a neighbouring step. */
  assert.deepEqual(ratios, ladder)
})

test('the pixel budget bounds a large canvas', () => {
  const big = resolutionFor('high', 1400, 900, 3)
  assert.ok(big.capped, 'a 1400×900 canvas at 3× should hit the budget')
  assert.ok(1400 * 900 * big.dpr * big.dpr <= 3_000_000, 'over budget after capping')
})

test('the budget never raises a small canvas above the screen', () => {
  const small = resolutionFor('high', 300, 200, 1)
  assert.equal(small.dpr, 1)
  assert.equal(small.capped, false)
})

test('a still scene draws at 1× whatever the screen', () => {
  for (const dpr of [1, 2, 3]) {
    assert.equal(resolutionFor('still', 1200, 800, dpr).dpr, 1)
  }
})

test('medium starts below high on the same screen', () => {
  const high = resolutionFor('high', 320, 200, 3).dpr
  const medium = resolutionFor('medium', 320, 200, 3).dpr
  assert.ok(medium < high, `medium ${medium} should be below high ${high}`)
  assert.ok(medium >= 1)
})

test('the renderer is never asked for an invalid ratio', () => {
  for (const q of ['high', 'medium', 'still']) {
    for (const [w, h] of [[0, 0], [1, 1], [3840, 2160]]) {
      for (const dpr of [0, 0.5, 1, 3, 8]) {
        const { dpr: chosen } = resolutionFor(q, w, h, dpr)
        assert.ok(Number.isFinite(chosen) && chosen >= 1, `got ${chosen}`)
      }
    }
  }
})

test('a desktop hero is drawn above 1× — the size the softness was worst on', () => {
  /* 1440×900 CSS on a 2× screen. At the old ceiling this was 1×, which is the
     setting that made the models look soft on a laptop. */
  const hero = measuredDpr('high', 1440, 900)
  assert.ok(hero >= 1.5, `desktop hero drew at ${hero}×`)
})

test('a phone row opens at the screen ratio and is bounded by the budget', () => {
  /* 351×207 CSS, the row on a 390-wide phone. Small enough that the budget
     does not bite, so a phone starts at its own 3× and steps down only if it
     cannot hold it. */
  const row = measuredDpr('high', 351, 207)
  assert.ok(row >= 2, `phone row drew at ${row}×`)
})

test('measuredDpr honours the budget for a real row and a real hero', () => {
  /* The row on a 1440-wide screen, and the hero it sits under. */
  const row = measuredDpr('high', 1311, 242)
  const hero = measuredDpr('high', 1440, 900)
  assert.ok(row >= 1 && hero >= 1)
  assert.ok(1311 * 242 * row * row <= 3_000_000 + 1)
  assert.ok(1440 * 900 * hero * hero <= 3_000_000 + 1, `hero drew at ${hero}×`)
})
