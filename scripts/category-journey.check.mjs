/** Browser acceptance check. npm run build, serve dist, then:
 * SITE_URL=http://localhost:4173 PLAYWRIGHT_MODULE=playwright node scripts/category-journey.check.mjs
 * BROWSER_EXECUTABLE/LD_LIBRARY_PATH are optional for sandbox installations. */
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
})
const origin = process.env.SITE_URL || 'http://localhost:4173'
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'commit' })
    await page.waitForTimeout(10000)
    const top = await page.locator('#products').evaluate(el => el.getBoundingClientRect().top + scrollY)
    const runway = await page.locator('.journey__runway').evaluate(el => el.offsetHeight - innerHeight)
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top + runway * .3 / 6)
    await page.waitForTimeout(4000)
    assert.equal(await page.locator('[data-chapter="0"]').evaluate(el => el.inert), false)
    assert.equal(await page.locator('.journey__anchor[data-active="true"]').count(), 1)
    const canvas = page.locator('.gallery--journey canvas')
    await canvas.evaluate(el => { el.dataset.testIdentity = 'retained' })
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top + runway)
    await page.waitForFunction(() => document.querySelectorAll('[data-dock][data-filled="true"]').length === 6)
    assert.equal(await page.locator('[data-dock][data-filled="true"]').count(), 6)
    assert.equal(await canvas.getAttribute('data-test-identity'), 'retained', 'docking must not replace the renderer')
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top + runway * 2.3 / 6)
    await page.waitForFunction(() => document.querySelectorAll('.journey__anchor[data-active="true"]').length === 3)
    assert.equal(await page.locator('.journey__anchor[data-active="true"]').count(), 3, 'reverse scroll retraces choreography')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    await page.close()
    console.log(`PASS scroll/dock/reverse/layout/renderer retention at ${width}px`)
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await page.goto(origin, { waitUntil: 'commit' })
  await page.waitForTimeout(10000)
  const globe = page.locator('.hero__stage canvas')
  assert.equal(await globe.count(), 1)
  const first = await globe.screenshot()
  await page.waitForTimeout(700)
  assert.deepEqual(await globe.screenshot(), first, 'frozen globe must preserve its exact pixels')
  await page.locator('#category-directory').scrollIntoViewIfNeeded()
  await page.waitForTimeout(4000)
  assert.equal(await page.locator('.journey__runway').evaluate(el => el.offsetHeight), 0)
  const gallery = page.locator('.gallery--journey canvas')
  const frozen = await gallery.screenshot()
  await page.waitForTimeout(700)
  assert.deepEqual(await gallery.screenshot(), frozen, 'frozen models must preserve exact pixels')
  assert.equal(await page.locator('.journey__directory li a').count(), 6)
  await page.close()
  console.log('PASS reduced motion / exact repeated frozen-frame pixels / accessible directory')
} finally {
  await browser.close()
}
