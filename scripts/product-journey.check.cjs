const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const path = require('node:path')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function fillEnquiry(page) {
  await page.locator('label.choice').filter({ has: page.locator('input[value="overseas-buyer"]') }).click()
  await page.locator('#requirement').fill('Cotton twill for workwear in natural colours')
  await page.locator('#location').fill('Rotterdam, Netherlands')
  await page.locator('#name').fill('Example Buyer')
  await page.locator('#email').fill('buyer@example.test')
}

async function assertDraft(page) {
  assert.equal(await page.locator('#requirement').inputValue(), 'Cotton twill for workwear in natural colours')
  assert.equal(await page.locator('#location').inputValue(), 'Rotterdam, Netherlands')
  assert.equal(await page.locator('#name').inputValue(), 'Example Buyer')
  assert.equal(await page.locator('#email').inputValue(), 'buyer@example.test')
  assert.equal(await page.locator('input[value="overseas-buyer"]').isChecked(), true)
}

async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error('Mock test server exited before becoming ready')
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch { /* Server is starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Mock test server did not become ready')
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const origin = process.env.SITE_URL || 'http://127.0.0.1:5173'
  const mockPort = Number(process.env.TEST_MOCK_SERVER_PORT || 5189)
  const mockOrigin = `http://127.0.0.1:${mockPort}`
  let server
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    let unexpectedRequests = 0
    await page.route('https://api.web3forms.com/**', async (route) => {
      unexpectedRequests++
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false}' })
    })
    await page.goto(`${origin}/?category=handicrafts#products`, { waitUntil: 'networkidle' })
    const tabs = page.getByRole('tablist', { name: 'Product categories' })
    const handicrafts = tabs.getByRole('tab', { name: /Handicrafts/ })
    const agriculture = tabs.getByRole('tab', { name: /Agriculture/ })
    const textiles = tabs.getByRole('tab', { name: /Textiles/ })
    await page.waitForFunction(() => document.querySelector('#category-tab-handicrafts')?.getAttribute('aria-selected') === 'true')
    assert.equal(await handicrafts.getAttribute('aria-selected'), 'true')
    await fillEnquiry(page)
    await agriculture.click()
    await page.waitForURL('**/?category=agriculture-food#products')
    await page.waitForFunction(() => document.querySelector('#category-tab-agriculture-food')?.getAttribute('aria-selected') === 'true')
    assert.equal(await agriculture.getAttribute('aria-selected'), 'true')
    await assertDraft(page)
    await page.goBack()
    await page.waitForURL('**/?category=handicrafts#products')
    await page.waitForFunction(() => document.querySelector('#category-tab-handicrafts')?.getAttribute('aria-selected') === 'true')
    assert.equal(await handicrafts.getAttribute('aria-selected'), 'true')
    await assertDraft(page)
    await textiles.click()
    await page.getByRole('link', { name: 'Explore textiles' }).waitFor()
    await handicrafts.click()
    await assertDraft(page)
    await page.getByRole('button', { name: 'Send the enquiry' }).click()
    await page.getByText('To send your enquiry, email', { exact: false }).waitFor()
    await assertDraft(page)
    assert.equal(unexpectedRequests, 0, 'unconfigured form must not send a request')

    await page.goto(`${origin}/enquiry?category=industrial-materials`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.querySelector('#enquiry-category')?.value === 'industrial-materials')
    await page.selectOption('#enquiry-category', 'agriculture-food')
    await page.waitForURL('**/enquiry?category=agriculture-food')
    await page.goto(`${origin}/enquiry?category=unknown`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.querySelector('#enquiry-category')?.value === 'general')
    await page.goto(`${origin}/enquiry/acknowledgement`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: /No enquiry recorded/ }).waitFor()
    await page.evaluate(() => sessionStorage.setItem('bs.enquiry.receipt', JSON.stringify({ subject: 'textiles', role: 'overseas-buyer', at: '2026-11-06T00:00:00Z' })))
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: /Enquiry submitted/ }).waitFor()
    assert.match(await page.locator('.ack__receipt').innerText(), /Textiles/)
    await page.evaluate(() => sessionStorage.setItem('bs.enquiry.receipt', JSON.stringify({ subject: 'textiles', role: 'overseas-buyer', at: 'bad date' })))
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: /No enquiry recorded/ }).waitFor()
    await page.close()

    try {
      await fetch(mockOrigin)
      throw new Error(`Port ${mockPort} is already occupied`)
    } catch (error) {
      if (error.message.includes('already occupied')) throw error
    }
    server = spawn(process.execPath, [path.join(process.cwd(), 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(mockPort), '--strictPort'], {
      cwd: process.cwd(), env: { ...process.env, VITE_WEB3FORMS_KEY: 'local-mock-key' }, windowsHide: true,
      stdio: 'ignore',
    })
    await waitForServer(mockOrigin, server)
    const mocked = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const requests = []
    let releaseSuccess
    const heldSuccess = new Promise((resolve) => { releaseSuccess = resolve })
    await mocked.route('https://api.web3forms.com/**', async (route) => {
      requests.push(route.request().postDataJSON())
      if (requests.length === 1) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        return
      }
      await heldSuccess
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
    })
    await mocked.goto(`${mockOrigin}/?category=industrial-materials#products`, { waitUntil: 'networkidle' })
    await fillEnquiry(mocked)
    await mocked.getByRole('button', { name: 'Send the enquiry' }).click()
    await mocked.getByText('We couldn’t send your enquiry.', { exact: false }).waitFor()
    await assertDraft(mocked)
    assert.equal(new URL(mocked.url()).pathname, '/', 'malformed success must not confirm')
    await mocked.getByRole('button', { name: 'Send the enquiry' }).click()
    await mocked.getByRole('button', { name: /Sending/ }).waitFor()
    assert.equal(await mocked.getByRole('tab', { name: /Agriculture/ }).isDisabled(), true)
    assert.equal(await mocked.getByRole('button', { name: /Sending/ }).isDisabled(), true)
    releaseSuccess()
    await mocked.waitForURL('**/enquiry/acknowledgement')
    await mocked.getByRole('heading', { name: /Enquiry submitted/ }).waitFor()
    assert.equal(requests.length, 2, 'one request per explicit attempt')
    assert.equal(requests[1]['Enquiry subject'], 'Industrial materials')
    assert.match(requests[1].subject, /Industrial materials/)
    assert.match(await mocked.locator('.ack__receipt').innerText(), /Industrial materials/)
    console.log('PASS: category selection, retained draft, Back, unconfigured fallback, direct categories, receipts, malformed response, pending lock and intercepted successful submission')
  } finally {
    if (server) server.kill()
    await browser.close()
  }
})().catch((error) => { console.error(error); process.exitCode = 1 })
