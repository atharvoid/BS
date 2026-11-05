const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    const origin = process.env.SITE_URL || 'http://localhost:5173'
    await page.goto(origin, { waitUntil: 'networkidle' })
    const intro = page.locator('#brand-intro')
    await intro.waitFor({ state: 'attached' })
    await page.waitForFunction(() => document.querySelector('#brand-intro')?.dataset.state === 'idle')
    assert.equal(await page.locator('.nav .brand-logo [data-draw]').count(), 13)

    // Assert short-lived states in the same browser task. Polling after a
    // Playwright click can miss the entire one-second intro on a busy GPU.
    for (const action of ['Escape', 'Tab', 'skip', 'wheel', 'touchstart', 'resize']) {
      const result = await page.evaluate(action => {
        const brand = document.querySelector('.nav .brand')
        const intro = document.querySelector('#brand-intro')
        brand.click()
        const started = !intro.hidden
        const timings = intro.getAnimations({ subtree: true }).map(a => a.effect.getTiming())
        if (action === 'skip') {
          const skip = intro.querySelector('.intro-skip')
          skip.focus()
          skip.click()
        } else if (action === 'Escape' || action === 'Tab') {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: action }))
        } else window.dispatchEvent(new Event(action))
        return {
          started, hidden: intro.hidden, active: document.documentElement.dataset.introActive,
          headerVisible: getComputedStyle(brand.querySelector('.brand-logo')).visibility,
          focused: document.activeElement === brand, timings,
        }
      }, action)
      assert.equal(result.started, true, `${action}: replay starts`)
      assert.equal(result.hidden, true, `${action}: interruption dismisses`)
      assert.equal(result.active, undefined)
      assert.equal(result.headerVisible, 'visible')
      assert.ok(result.timings.some(t => t.duration === 460), 'supplied draw duration is retained')
      if (action === 'skip') assert.equal(result.focused, true)
    }

    assert.equal(await page.evaluate(() => {
      document.querySelector('.nav .brand').click()
      return !document.querySelector('#brand-intro').hidden
    }), true)
    await intro.waitFor({ state: 'hidden', timeout: 5000 })

    assert.equal(await page.evaluate(() => {
      const brand = document.querySelector('.nav .brand')
      let prevented
      brand.addEventListener('click', event => {
        prevented = event.defaultPrevented
        event.preventDefault() // The harness suppresses the new tab.
      }, { once: true })
      brand.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }))
      return prevented
    }), false, 'modified logo clicks retain native behavior')

    await page.evaluate(() => {
      document.querySelector('.nav .brand').click()
      document.querySelector('.nav a[href="/textiles"]').click()
    })
    await page.waitForURL('**/textiles')
    await intro.waitFor({ state: 'detached' })
    assert.equal(await intro.count(), 0, 'SPA navigation removes the active startup')
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-intro-active'))
    assert.equal(await page.locator('html').getAttribute('data-intro-active'), null)
    await page.goBack({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.querySelector('#brand-intro')?.dataset.state === 'idle')

    await page.goto(`${origin}/#process`, { waitUntil: 'networkidle' })
    assert.equal(await intro.isVisible(), false, 'direct section entry skips the startup')
    await page.goto(`${origin}/textiles`, { waitUntil: 'networkidle' })
    assert.equal(await intro.count(), 0, 'inner routes have no startup overlay')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(origin, { waitUntil: 'networkidle' })
    assert.equal(await page.evaluate(() => {
      document.querySelector('.nav .brand').click()
      return document.querySelector('#brand-intro').hidden
    }), true, 'reduced motion never runs the startup')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    assert.equal(await page.evaluate(() => {
      document.querySelector('.nav .brand').click()
      return !document.querySelector('#brand-intro').hidden
    }), true)
    await intro.waitFor({ state: 'hidden' })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    console.log('PASS: logo draw/timing, replay, Escape/Tab, skip/focus, wheel/touch, modified clicks, hash, SPA cleanup/Back, reduced motion, resize and mobile width')
  } finally {
    await browser.close()
  }
})().catch(error => { console.error(error); process.exitCode = 1 })
