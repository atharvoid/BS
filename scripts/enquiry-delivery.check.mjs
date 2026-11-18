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
  for (const scenario of ['accepted', 'storage-blocked', 'rejected', 'captcha-required', 'invalid-key', 'network-error', 'invalid-json']) {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: scenario === 'accepted' ? 375 : 1200, height: 900 }, serviceWorkers: 'block' })
    let requests = 0
    await context.route('**/*', async route => {
      if (route.request().url() === 'https://api.web3forms.com/submit') {
        requests++
        const request = route.request()
        const contentType = request.headers()['content-type']
        assert.match(contentType, /^multipart\/form-data; boundary=/)
        const data = Object.fromEntries(await new Response(request.postDataBuffer(), {
          headers: { 'Content-Type': contentType },
        }).formData())
        assert.equal(data.access_key, 'arena-mocked-delivery-test', 'Use only the isolated fixture build, never a production key')
        assert.equal(Object.hasOwn(data, 'h-captcha-response'), false)
        assert.equal(data.replyto, 'test@example.com')
        assert.equal(data.email, data.replyto)
        assert.equal(data.name, 'Mock verification')
        assert.equal(data['Enquiry subject'], 'Textiles & fabrics')
        assert.equal(data['Destination or business location'], 'Pune')
        assert.equal(data['Visitor type'], 'Overseas buyer')
        assert.match(data.message, /Woven cotton fabric/)
        if (scenario === 'network-error') return route.abort()
        if (scenario === 'invalid-json') return route.fulfill({ status: 200, contentType: 'application/json', body: '{' })
        if (scenario === 'captcha-required' || scenario === 'invalid-key') {
          const message = scenario === 'captcha-required' ? 'hCaptcha response is required' : 'Invalid access key'
          return route.fulfill({ status: 400, json: { success: false, body: { message } } })
        }
        return route.fulfill({ status: scenario === 'rejected' ? 429 : 200, contentType: 'application/json', body: JSON.stringify({ success: scenario !== 'rejected' }) })
      }
      if (new URL(route.request().url()).origin !== origin) return route.abort()
      return route.continue()
    })
    if (scenario === 'storage-blocked') await context.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } })
    })
    const page = await context.newPage()
    await page.goto(`${origin}/enquiry?category=textiles`, { waitUntil: 'commit' })
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
      await page.locator('.ack__title').waitFor({ timeout: 6000 })
      assert.match(await page.locator('.ack__title').innerText(), /submitted/i)
    } else {
      const notice = page.locator('.form__status .notice--error')
      await notice.waitFor()
      if (scenario === 'captcha-required') assert.match(await notice.innerText(), /required CAPTCHA/)
      if (scenario === 'invalid-key') assert.match(await notice.innerText(), /access key was rejected/)
      assert.equal(new URL(page.url()).pathname, '/enquiry')
      assert.match(await page.locator('#requirement').inputValue(), /Mock browser test/)
    }
    assert.equal(requests, 1, 'One request without an interactive challenge')
    console.log(`PASS mocked ${scenario}: truthful status and one request`)
    await context.close()
  }
} finally { await browser.close() }
