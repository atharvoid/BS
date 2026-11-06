const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        if (kind === 'webgl' || kind === 'webgl2') return null
        return getContext.call(this, kind, ...args)
      }
    })
    await page.goto(process.env.SITE_URL || 'http://localhost:5173', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.querySelector('#brand-intro')?.dataset.state === 'idle')
    await page.evaluate(() => {
      const fixture = document.createElement('div')
      fixture.innerHTML = '<a href="#fixture" data-cursor="menu" data-cursor-size="compact" style="position:fixed;top:120px;left:100px;width:110px;height:32px;z-index:200">Products</a><input aria-label="Cursor fixture" style="position:fixed;top:200px;left:100px;width:180px;height:32px;z-index:200"><canvas width="180" height="120" style="position:fixed;top:280px;left:100px;z-index:200"></canvas>'
      document.body.append(fixture)
    })
    const cursor = page.locator('.cursor')
    await page.mouse.move(80, 135)
    await page.waitForFunction(() => document.querySelector('.cursor')?.dataset.mode === 'approach')
    assert.equal(await cursor.locator('.cursor__label').textContent(), '')
    await page.mouse.move(150, 135)
    await page.waitForFunction(() => document.querySelector('.cursor')?.dataset.mode === 'menu-compact')
    assert.equal(await cursor.locator('.cursor__label').textContent(), 'Explore')
    await page.mouse.move(150, 215)
    await page.waitForFunction(() => !document.documentElement.classList.contains('has-custom-cursor'))
    await page.mouse.move(150, 330)
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('bs:scene-pointer', {
      detail: { sceneId: 'fixture', phase: 'enter', pointerId: 1, pointerType: 'mouse' },
    })))
    await page.waitForFunction(() => document.querySelector('.cursor')?.dataset.mode === 'scene')
    assert.equal(await cursor.locator('.cursor__label').textContent(), 'Drag')
    assert.equal(await cursor.locator('.cursor__ring').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)')
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('bs:scene-pointer', {
      detail: { sceneId: 'fixture', phase: 'press', pointerId: 1, pointerType: 'mouse' },
    })))
    await page.waitForFunction(() => document.querySelector('.cursor')?.dataset.mode === 'dragging')
    await page.mouse.move(150, 215)
    await page.waitForFunction(() => document.querySelector('.cursor')?.dataset.mode === 'dragging')
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('bs:scene-pointer', {
      detail: { sceneId: 'fixture', phase: 'remove', pointerId: -1, pointerType: '' },
    })))
    await page.waitForFunction(() => !document.documentElement.classList.contains('has-custom-cursor'))
    await page.mouse.move(450, 400)
    await page.waitForFunction(() => document.documentElement.classList.contains('has-custom-cursor'))
    await page.keyboard.press('Tab')
    await page.waitForFunction(() => !document.documentElement.classList.contains('has-custom-cursor'))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => !document.documentElement.classList.contains('has-custom-cursor'))
    console.log('PASS: menu Explore, native input, transparent Drag, capture state, removal and reduced motion')
  } finally {
    await browser.close()
  }
})().catch(error => { console.error(error); process.exitCode = 1 })
