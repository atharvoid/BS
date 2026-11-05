const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    await page.goto(process.env.SITE_URL || 'http://localhost:5173', { waitUntil: 'networkidle' })
    await page.locator('.hero canvas').waitFor()
    const result = await page.evaluate(async () => {
      // Use the exact Vite module instance that owns the running canvas.
      const moduleUrl = performance.getEntriesByType('resource').find(e => e.name.includes('/@react-three_fiber.js?v='))?.name
      if (!moduleUrl) throw new Error('Run this diagnostic against npm run dev')
      const { _roots } = await import(moduleUrl)
      const state = _roots.get(document.querySelector('.hero canvas')).store.getState()
      const canvas = state.gl.domElement
      const bounds = canvas.getBoundingClientRect()
      let decorativeCalls = 0
      const originals = []
      state.internal.interaction[0].children.forEach(child => child.traverse(object => {
        originals.push([object, object.raycast])
        const original = object.raycast
        object.raycast = function (...args) {
          decorativeCalls++
          return original.apply(this, args)
        }
      }))
      const hitCounts = []
      const elapsed = []
      const intersect = state.raycaster.intersectObject
      state.raycaster.intersectObject = function (...args) {
        const hits = intersect.apply(this, args)
        hitCounts.push(hits.length)
        return hits
      }
      try {
        for (let i = 0; i < 24; i++) {
          const start = performance.now()
          canvas.dispatchEvent(new PointerEvent('pointermove', {
            bubbles: true, pointerId: 1, pointerType: 'mouse',
            clientX: bounds.x + bounds.width * (.76 + .05 * Math.sin(i)),
            clientY: bounds.y + bounds.height * (.48 + .05 * Math.cos(i)),
          }))
          elapsed.push(performance.now() - start)
        }
      } finally {
        state.raycaster.intersectObject = intersect
        originals.forEach(([object, raycast]) => { object.raycast = raycast })
      }
      return { decorativeCalls, hitCounts, averageMs: elapsed.reduce((a, b) => a + b, 0) / elapsed.length, maxMs: Math.max(...elapsed) }
    })
    assert.equal(result.decorativeCalls, 0, 'hover must never scan decorative geometry')
    assert.equal(result.hitCounts.length, 24)
    assert.ok(result.hitCounts.every(count => count <= 1))
    assert.ok(result.hitCounts.some(count => count === 1), 'the globe must remain pickable')
    assert.ok(result.maxMs < 100, 'pointer handling must not become a long blocking task')
    console.log('PASS: globe hover', JSON.stringify(result))
  } finally {
    await browser.close()
  }
})().catch(error => { console.error(error); process.exitCode = 1 })
