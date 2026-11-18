import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const origin = process.env.SITE_URL || 'http://127.0.0.1:4482'
const evidence = process.env.EVIDENCE_DIR
if (evidence) await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const failures = []

async function check(name, options, run) {
  const page = await browser.newPage(options)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => {
    const request = route.request()
    return request.method() === 'GET' && new URL(request.url()).origin === origin ? route.continue() : route.abort()
  })
  async function open(path) {
    await page.goto(origin + path)
    await page.locator('main h1').waitFor({ timeout: 6000 })
    await page.keyboard.press('Escape')
    await page.evaluate(() => document.fonts.ready)
  }
  try {
    await run(page, open)
    assert.deepEqual(errors, [])
    console.log(`PASS ${name}`)
  } catch (error) {
    failures.push(name)
    console.error(`FAIL ${name}: ${error.message}`)
  } finally {
    await page.close()
  }
}

const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }
const desktop = { viewport: { width: 1440, height: 900 } }

try {
  await check('scrolling below the cards starts the tour on every visit', desktop, async (page, open) => {
    for (let visit = 0; visit < 2; visit++) {
      if (visit === 0) await open('/')
      else {
        await page.reload()
        await page.keyboard.press('Escape')
      }
      const tour = page.locator('#product-tour')
      assert.equal(await page.locator('#products + #product-tour').count(), 1, 'tour follows the six-card directory on the home route')
      assert.equal(await page.locator('#products .product-card').count(), 6)
      assert.equal(await page.locator('#products button, #product-tour button, #products a[href$="#product-tour"]').count(), 0)
      assert.equal(await page.locator('#product-tour .gallery').count(), 0, 'tour renderer waits until scrolling near it')
      await tour.evaluate(el => {
        const runway = el.querySelector('.journey__runway').offsetHeight - innerHeight
        scrollTo({ top: scrollY + el.getBoundingClientRect().top + runway * .05, behavior: 'instant' })
      })
      await tour.locator('.gallery--journey[data-ready=true]').waitFor({ timeout: 60000 })
      assert.ok(await tour.locator('[data-chapter="0"] .journey__detail').evaluate(el => !el.closest('[inert]')))
      assert.equal(await page.evaluate(() => location.hash), '', 'scrolling activates the tour without navigation')
    }
    if (evidence) await page.screenshot({ path: `${evidence}/scroll-starts-tour.png` })
  })

  await check('textile and privacy jumps move focus forward', phone, async (page, open) => {
    await open('/textiles')
    const hero = page.getByRole('link', { name: 'Start a textile enquiry' }).first()
    await hero.focus()
    await page.keyboard.press('Enter')
    await page.waitForURL('**/textiles#textile-enquiry')
    await page.waitForFunction(() => document.querySelector('#textile-enquiry')?.contains(document.activeElement), null, { timeout: 5000 })
    assert.ok(await page.locator('#textile-enquiry').evaluate(el => el.contains(document.activeElement)), 'textile destination owns focus')
    await page.keyboard.press('Tab')
    assert.ok(await page.locator('#textile-enquiry').evaluate(el => el.contains(document.activeElement)), 'Tab continues inside the form')
    assert.equal(await page.locator('.brief__actions a').first().getAttribute('href'), '/textiles#textile-enquiry')
    await page.setViewportSize(desktop.viewport)
    await open('/privacy')
    await page.locator('.privacy__toc a[href$="#contact"]').click()
    await page.waitForFunction(() => document.querySelector('#contact')?.contains(document.activeElement), null, { timeout: 5000 })
    assert.ok(await page.locator('#contact').evaluate(el => el.contains(document.activeElement)), 'privacy destination owns focus')
    await page.keyboard.press('Tab')
    assert.ok(await page.locator('#contact').evaluate(el => el.contains(document.activeElement)), 'Tab continues to contact')
  })

  await check('category selection preserves focus, viewport and draft', phone, async (page, open) => {
    await open('/enquiry?category=handicrafts')
    await page.locator('#requirement').fill('A sample requirement')
    const combo = page.getByRole('combobox')
    await combo.evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 148, behavior: 'instant' }))
    await combo.focus()
    const before = await page.evaluate(() => scrollY)
    assert.ok(before > 30)
    await page.keyboard.press('Space')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForURL('**/enquiry?category=agriculture-food', { timeout: 5000 })
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - before) < 3, 'category change did not jump')
    assert.ok(await combo.evaluate(el => el === document.activeElement))
    assert.equal(await page.locator('#requirement').inputValue(), 'A sample requirement')
    await page.goBack()
    await page.waitForFunction(() => document.querySelector('[role=combobox]')?.textContent.trim() === 'Handicrafts & home decor')
    assert.equal(await combo.innerText(), 'Handicrafts & home decor')
    await page.goForward()
    await page.waitForFunction(() => document.querySelector('[role=combobox]')?.textContent.trim() === 'Agriculture & food')
    assert.equal(await combo.innerText(), 'Agriculture & food')
    assert.equal(await page.locator('#requirement').inputValue(), 'A sample requirement')
  })

  await check('Products directly opens the six-item directory', desktop, async (page, open) => {
    await open('/')
    assert.equal(await page.locator('.nav__links a[href="/#products"]').getAttribute('aria-current'), null)
    assert.equal(await page.locator('.gallery--journey').count(), 0)
    await page.locator('.nav__links a[href="/#products"]').click()
    const products = page.locator('#products')
    await page.waitForFunction(() => document.querySelector('#products')?.contains(document.activeElement), null, { timeout: 5000 })
    assert.equal(await products.locator('.product-card').count(), 6)
    assert.ok(await products.evaluate(el => el.contains(document.activeElement)))
    assert.ok(await products.locator('.product-card').first().evaluate(el => el.getBoundingClientRect().top < innerHeight))
    assert.equal(await page.locator('.nav__links a[href="/#products"]').getAttribute('aria-current'), 'location')
    assert.equal(await page.locator('#product-tour').getAttribute('data-begun'), 'false')
    const gallery = page.locator('.gallery--cards[data-ready=true]')
    await gallery.waitFor({ timeout: 30000 })
    const stages = products.locator('.product-card__stage')
    const angles = () => stages.evaluateAll(els => els.map(el => Number(el.dataset.presentedYaw)))
    const start = await angles()
    const before = await stages.first().screenshot()
    await page.waitForTimeout(5300)
    const later = await angles()
    assert.ok(later.every((yaw, i) => yaw > start[i]), 'all visible objects turn in the same direction')
    assert.notDeepEqual(await stages.first().screenshot(), before, 'rotation changes the painted card')
    await page.waitForFunction(last => [...document.querySelectorAll('.product-card__stage')]
      .every((el, i) => Number(el.dataset.presentedYaw) > last[i]), later, { timeout: 5000 })
    if (evidence) await page.screenshot({ path: `${evidence}/homepage-rotation.png` })
  })

  await check('visible phone cards keep rotating', { ...phone, reducedMotion: 'no-preference' }, async (page, open) => {
    await open('/#products')
    assert.equal(await page.locator('#product-tour, #products button').count(), 0)
    await page.locator('.gallery--cards[data-ready=true][data-motion=running]').waitFor({ timeout: 30000 })
    const stage = page.locator('.product-card__stage').first()
    const start = Number(await stage.getAttribute('data-presented-yaw'))
    await page.waitForTimeout(5000)
    const later = Number(await stage.getAttribute('data-presented-yaw'))
    assert.ok(later > start, 'phone cards continue past the former cutoff')
    await page.waitForFunction(last => Number(document.querySelector('.product-card__stage').dataset.presentedYaw) > last, later, { timeout: 5000 })
    if (evidence) await page.screenshot({ path: `${evidence}/phone-rotation.png` })
  })

  await check('short desktop keeps the directory usable', { viewport: { width: 1024, height: 480 } }, async (page, open) => {
    await open('/#products')
    assert.equal(await page.locator('#products .product-card').count(), 6)
    assert.equal(await page.locator('.journey__shelf').count(), 0)
    await open('/#product-tour')
    assert.equal(await page.locator('#products .product-card').count(), 6)
    assert.ok(await page.locator('#products').evaluate(el => el.contains(document.activeElement)))
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  })

  await check('form status and control boundaries meet contrast targets', phone, async (page, open) => {
    await open('/enquiry')
    const ratios = await page.evaluate(() => {
      const rgb = value => value.match(/[\d.]+/g).map(Number)
      const mix = (color, base, opacity) => color.slice(0, 3).map((channel, i) => opacity * channel + (1 - opacity) * base[i])
      const luminance = value => value.slice(0, 3).map(channel => channel / 255)
        .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
        .reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i], 0)
      const ratio = (a, b) => {
        const pair = [luminance(a), luminance(b)]
        return (Math.max(...pair) + .05) / (Math.min(...pair) + .05)
      }
      const style = selector => getComputedStyle(document.querySelector(selector))
      const form = rgb(style('.form').backgroundColor)
      const required = style('.field__req')
      const edges = ['#requirement', '.choice__dot', '.select__button'].map(selector => {
        const control = style(selector)
        const fill = rgb(control.backgroundColor)
        const border = rgb(control.borderTopColor)
        return ratio(mix(border, fill, border[3] ?? 1), fill)
      })
      return { required: ratio(mix(rgb(required.color), form, Number(required.opacity)), form), edges }
    })
    assert.ok(ratios.required >= 4.5, `required text contrast ${ratios.required.toFixed(2)}`)
    assert.ok(ratios.edges.every(ratio => ratio >= 3), `control contrast ratios ${ratios.edges.map(ratio => ratio.toFixed(2))}`)
    await page.emulateMedia({ forcedColors: 'active' })
    assert.ok(await page.locator('.nav__toggle').evaluate(button =>
      getComputedStyle(button.querySelector('.nav__toggle-bar')).backgroundColor === getComputedStyle(button).color
    ), 'menu icon uses the system button text colour in forced colours')
  })
} finally {
  await browser.close()
}
assert.deepEqual(failures, [], 'design audit regressions')
