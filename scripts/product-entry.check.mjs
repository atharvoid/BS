/** Run against the built preview. Checks the first entry to the product directory. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const origin = process.env.SITE_URL || 'http://127.0.0.1:4185'
const output = process.env.EVIDENCE_DIR || 'output/product-entry'
const results = []
await mkdir(output, { recursive: true })

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const phone = viewport.width < 500
    const page = await browser.newPage({ viewport, ...(phone ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}) })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(origin)
    await page.locator('#brand-intro').waitFor({ state: 'hidden', timeout: 30000 })
    const gallery = page.locator('.gallery--cards[data-ready=true]')
    await gallery.waitFor({ state: 'attached', timeout: 20000 })
    assert.equal(await page.evaluate(() => scrollY), 0, 'the directory prepares without a scroll')
    assert.equal(await gallery.getAttribute('data-motion'), 'frozen', 'the gallery clock is idle while offscreen')

    const trace = await page.evaluate(async () => {
      const anchors = [...document.querySelectorAll('.product-card__stage')]
      const section = document.querySelector('#products')
      const angles = () => anchors.map(anchor => Number(anchor.dataset.presentedYaw))
      const before = angles()
      const samples = []
      const start = performance.now()
      scrollTo({ top: scrollY + section.getBoundingClientRect().top - 90, behavior: 'instant' })
      for (let frame = 0; frame < 24; frame++) {
        await new Promise(requestAnimationFrame)
        const yaw = angles()
        samples.push({ ms: Math.round(performance.now() - start), yaw })
        if (yaw.every((value, i) => value > before[i])) break
      }
      return { before, samples }
    })
    assert.equal(trace.before.length, 6)
    assert.ok(trace.before.every(Number.isFinite), 'all six models were painted before entry')
    assert.ok(trace.samples.at(-1).yaw.every((angle, i) => angle > trace.before[i]), 'all six models turn on the first entry')
    assert.ok(trace.samples.length <= 8, 'rotation advances within the first draws after entry')
    assert.deepEqual(errors, [])
    await page.screenshot({ path: output + '/directory-' + viewport.width + '.png' })
    results.push({ viewport, framesToMotion: trace.samples.length, ...trace })
    console.log('PASS directory at ' + viewport.width + '×' + viewport.height + ': six models turning on entry')
    await page.close()
  }
  await writeFile(output + '/entry.json', JSON.stringify(results, null, 2))
} finally {
  await browser.close()
}
