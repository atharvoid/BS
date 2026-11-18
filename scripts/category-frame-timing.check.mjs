/** Measure visible rotation commits on the built site. The browser uses its default GPU. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const origin = process.env.SITE_URL || 'http://127.0.0.1:4173'
const output = process.env.EVIDENCE_DIR || '.poster-build/category-timing'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE })
const samples = []
try {
  for (const phone of [false, true]) {
    const viewport = phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }
    const page = await browser.newPage({ viewport, deviceScaleFactor: phone ? 3 : 1, isMobile: phone, hasTouch: phone })
    await page.goto(origin)
    await page.keyboard.press('Escape')
    const anchor = page.locator('[data-motif="general"]').last()
    if (phone) await anchor.scrollIntoViewIfNeeded()
    else await page.locator('#product-tour').evaluate(el => {
      const travel = el.querySelector('.journey__runway').offsetHeight - innerHeight
      scrollTo({ top: scrollY + el.getBoundingClientRect().top + travel * 5.3 / 6, behavior: 'instant' })
    })
    await page.locator('.gallery[data-ready="true"]').waitFor({ timeout: 60000 })
    const sample = await anchor.evaluate(async el => {
      const canvas = document.querySelector('.gallery canvas')
      const gl = canvas.getContext('webgl2')
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      const stamps = []
      let yaw = el.dataset.presentedYaw
      const observer = new MutationObserver(() => {
        if (el.dataset.presentedYaw === yaw) return
        yaw = el.dataset.presentedYaw
        stamps.push(performance.now())
      })
      observer.observe(el, { attributes: true, attributeFilter: ['data-presented-yaw'] })
      const start = performance.now()
      await new Promise(resolve => setTimeout(resolve, 3000))
      observer.disconnect()
      const duration = performance.now() - start
      const intervals = stamps.slice(1).map((t, i) => t - stamps[i]).sort((a, b) => a - b)
      const percentile = p => intervals.length ? Number(intervals[Math.floor((intervals.length - 1) * p)].toFixed(1)) : null
      return {
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        buffer: [canvas.width, canvas.height], commits: stamps.length, durationMs: Math.round(duration),
        commitsPerSecond: Number((stamps.length * 1000 / duration).toFixed(1)),
        medianIntervalMs: percentile(.5), p95IntervalMs: percentile(.95),
        endState: canvas.closest('.gallery').dataset.motion,
      }
    })
    assert.ok(sample.commits >= 2, 'the visible model advanced on this run')
    samples.push({ viewport, ...sample })
    await page.close()
  }
  await writeFile(`${output}/timing.json`, JSON.stringify({ chromium: browser.version(), samples }, null, 2))
  console.table(samples)
} finally {
  await browser.close()
}
