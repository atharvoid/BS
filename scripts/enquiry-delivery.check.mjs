/** Isolated acceptance test; NEVER performs a real submission.
 * Serve a separate build with VITE_WEB3FORMS_KEY=arena-mocked-delivery-test.
 * SITE_URL=http://localhost:4180 PLAYWRIGHT_MODULE=playwright node scripts/enquiry-delivery.check.mjs
 * All cross-origin requests are intercepted or blocked. */
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const origin = new URL(process.env.SITE_URL || 'http://localhost:4180').origin
const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
})
try {
  for (const scenario of ['accepted', 'storage-blocked', 'rejected', 'network-error', 'invalid-json']) {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1200, height: 900 }, serviceWorkers: 'block' })
    let requests = 0
    await context.route('**/*', async route => {
      if (route.request().url() === 'https://api.web3forms.com/submit') {
        requests++
        const data = route.request().postDataJSON()
        assert.equal(data.access_key, 'arena-mocked-delivery-test', 'Use only the isolated fixture build, never a production key')
        if (scenario === 'network-error') return route.abort()
        if (scenario === 'invalid-json') return route.fulfill({ status: 200, contentType: 'application/json', body: '{' })
        return route.fulfill({ status: scenario === 'rejected' ? 429 : 200, contentType: 'application/json', body: JSON.stringify({ success: scenario !== 'rejected' }) })
      }
      if (new URL(route.request().url()).origin !== origin) return route.abort()
      return route.continue()
    })
    if (scenario === 'storage-blocked') await context.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } })
    })
    const page = await context.newPage()
    await page.goto(origin, { waitUntil: 'commit' })
    await page.locator('.hero__actions a[href="/enquiry"]').click()
    await page.locator('.choice').first().click()
    await page.locator('#requirement').fill('Mock browser test only. Woven cotton fabric requirement.')
    await page.locator('#location').fill('Pune')
    await page.locator('#name').fill('Mock verification')
    await page.locator('#email').fill('test@example.com')
    // Two synchronous submissions test the in-flight guard, not just button styling.
    await page.locator('form').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    if (scenario === 'accepted' || scenario === 'storage-blocked') {
      await page.locator('.ack__title').waitFor()
      assert.match(await page.locator('.ack__title').innerText(), /submitted/i)
    } else {
      await page.locator('.form__status .notice--error').waitFor()
      assert.equal(new URL(page.url()).pathname, '/enquiry')
      assert.match(await page.locator('#requirement').inputValue(), /Mock browser test/)
    }
    assert.equal(requests, 1, 'No duplicate delivery')
    console.log(`PASS mocked ${scenario}: truthful status and one request`)
    await context.close()
  }
} finally { await browser.close() }
