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
  for (const width of [1440, 1024]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(new URL('/#product-tour', origin).href)
    const top = await page.locator('#product-tour').evaluate(el => el.getBoundingClientRect().top + scrollY)
    const runway = await page.locator('.journey__runway').evaluate(el => el.offsetHeight - innerHeight)
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top + runway * .3 / 6)
    await page.locator('.gallery--journey[data-ready="true"]').waitFor({ timeout: 60000 })
    assert.equal(await page.locator('[data-chapter="0"]').evaluate(el => el.inert), false)
    assert.equal(await page.locator('.journey__anchor[data-active="true"]').count(), 1)
    const canvas = page.locator('.gallery--journey canvas')
    await canvas.evaluate(el => { el.dataset.testIdentity = 'retained' })
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top + runway)
    await page.waitForFunction(() => document.querySelectorAll('[data-dock][data-filled="true"]').length === 6)
    assert.equal(await page.locator('[data-dock][data-filled="true"]').count(), 6)
    assert.equal(await canvas.getAttribute('data-test-identity'), 'retained', 'docking must not replace the renderer')
    await page.waitForFunction(() => document.querySelector('.gallery--journey')?.dataset.motion === 'frozen')
    const still = await canvas.screenshot()
    assert.deepEqual(await canvas.screenshot(), still, 'the dock holds its painted frame')
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top + runway * 2.3 / 6)
    await page.waitForFunction(() => document.querySelectorAll('.journey__anchor[data-active="true"]').length === 3)
    assert.equal(await page.locator('.journey__anchor[data-active="true"]').count(), 3, 'reverse scroll retraces choreography')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    await page.close()
    console.log(`PASS scroll/dock/reverse/layout/renderer retention at ${width}px`)
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await page.goto(new URL('/#product-tour', origin).href)
  await page.locator('#category-directory').waitFor()
  assert.equal(await page.locator('canvas').count(), 0)
  assert.equal(await page.locator('.journey__runway').count(), 0)
  assert.equal(await page.locator('.product-card').count(), 6)
  assert.ok(await page.locator('#products').evaluate(el => el.contains(document.activeElement)))
  await page.close()
  console.log('PASS reduced motion opens the renderer-free directory')
} finally {
  await browser.close()
}
