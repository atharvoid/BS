/** Frame-level regression. Run against the Vite dev server, which exposes the R3F stores. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
})
const origin = process.env.SITE_URL || 'http://127.0.0.1:5175'
const out = process.env.EVIDENCE_DIR || 'output/opening-product'
await mkdir(out, { recursive: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))
try {
  await page.addInitScript(() => {
    window.motionSamples = { globe: [], tour: [], cards: [], readbacks: [] }
    const encode = HTMLCanvasElement.prototype.toDataURL
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      const start = performance.now()
      const data = encode.apply(this, args)
      window.motionSamples.readbacks.push({ start, ms: performance.now() - start, width: this.width, height: this.height })
      return data
    }
    const hooked = new WeakSet()
    let fiber
    function attach() {
      if (!fiber) {
        const url = performance.getEntriesByType('resource').find(entry => entry.name.includes('/@react-three_fiber.js?v='))?.name
        if (url) fiber = import(url)
      }
      fiber?.then(({ _roots }) => {
        for (const [canvas, { store }] of _roots) {
          if (hooked.has(canvas)) continue
          const type = canvas.closest('.hero__stage') ? 'globe'
            : canvas.closest('.gallery--journey') ? 'tour'
            : canvas.closest('.gallery--cards') ? 'cards' : null
          if (!type) continue
          const { gl } = store.getState()
          const render = gl.render.bind(gl)
          hooked.add(canvas)
          gl.render = (scene, camera) => {
            const start = performance.now()
            render(scene, camera)
            const sample = { time: start, ms: performance.now() - start, scrollY }
            if (type === 'globe') {
              let yaw
              scene.traverse(node => {
                if (node.isGroup && node.rotation.z === .06) yaw = node.rotation.y
              })
              if (yaw === undefined) return
              const intro = document.querySelector('#brand-intro')
              const curtain = intro.querySelector('.intro-surface')
              Object.assign(sample, {
                yaw, intro: !intro.hidden, opacity: Number(getComputedStyle(curtain).opacity),
                ready: !!canvas.closest('[data-scene-ready=true]'),
              })
            } else {
              sample.poses = []
              const box = canvas.getBoundingClientRect()
              const parent = canvas.closest('.gallery').parentElement
              scene.traverse(node => {
                if (!node.name.startsWith('category-spin-')) return
                const motif = node.name.slice(14)
                const anchor = parent.querySelector('[data-motif="' + motif + '"]')
                if (!anchor) return
                const r = anchor.getBoundingClientRect()
                const p = node.parent.position.clone().project(camera)
                sample.poses.push({ motif, visible: node.parent.visible, inViewport: r.top < innerHeight && r.bottom > 0,
                  x: box.left + (p.x + 1) * box.width / 2,
                  y: box.top + (1 - p.y) * box.height / 2 })
              })
              sample.begun = canvas.closest('#product-tour')?.dataset.begun
            }
            window.motionSamples[type].push(sample)
          }
        }
      })
      requestAnimationFrame(attach)
    }
    requestAnimationFrame(attach)
  })
  await page.goto(origin)
  await page.waitForFunction(() => window.motionSamples.globe.some(frame => frame.ready && !frame.intro))
  const cold = await page.evaluate(() => window.motionSamples.globe.splice(0))
  await page.locator('.nav .brand').evaluate(brand => brand.click())
  await page.waitForFunction(() => document.querySelector('#brand-intro').hidden)
  const replay = await page.evaluate(() => window.motionSamples.globe.slice())
  const covered = replay.filter(frame => frame.intro)
  const preReveal = covered.filter(frame => frame.opacity >= .98)
  await page.screenshot({ path: out + '/hero.png' })

  await page.locator('#products').evaluate(el => el.scrollIntoView({ behavior: 'instant' }))
  await page.locator('.gallery--cards[data-ready=true]').waitFor()
  const cards = await page.evaluate(() => window.motionSamples.cards.at(-1))
  await page.locator('#product-tour').evaluate(el => el.scrollIntoView({ behavior: 'instant' }))
  await page.locator('.gallery--journey[data-ready=true]').waitFor()
  const tour = await page.evaluate(async () => {
    const root = document.querySelector('#product-tour')
    const top = root.getBoundingClientRect().top + scrollY
    const range = root.querySelector('.journey__runway').offsetHeight - innerHeight
    const samples = []
    const before = window.motionSamples.tour.length
    for (const direction of [1, -1]) {
      for (let step = 0; step <= 72; step++) {
        const fraction = direction === 1 ? step / 72 : 1 - step / 72
        scrollTo({ top: top + range * fraction, behavior: 'instant' })
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)))
        const frame = window.motionSamples.tour.at(-1)
        if (!frame) continue
        const anchors = [...root.querySelectorAll('[data-journey-index][data-active=true]')]
        const miss = anchors.reduce((max, anchor) => {
          const r = anchor.getBoundingClientRect()
          if (r.right <= 0 || r.left >= innerWidth) return max
          const pose = frame.poses.find(pose => pose.motif === anchor.dataset.motif && pose.visible)
          return Math.max(max, pose ? Math.hypot(pose.x - r.left - r.width / 2, pose.y - r.top - r.height / 2) : innerWidth)
        }, 0)
        samples.push({ miss, scrollY, drawScrollY: frame.scrollY })
      }
    }
    return { draws: window.motionSamples.tour.length - before, samples }
  })
  await page.evaluate(() => {
    const root = document.querySelector('#product-tour')
    const range = root.querySelector('.journey__runway').offsetHeight - innerHeight
    scrollTo({ top: root.getBoundingClientRect().top + scrollY + range * .23, behavior: 'instant' })
  })
  await page.waitForTimeout(200)
  await page.screenshot({ path: out + '/tour.png' })
  const metrics = {
    coldIntroFrames: cold.filter(frame => frame.intro).length,
    introFrames: covered.length,
    yawDuringIntro: covered.at(-1)?.yaw - covered[0]?.yaw,
    yawBeforeCurtain: preReveal.at(-1)?.yaw - preReveal[0]?.yaw,
    cardPainted: cards?.poses.filter(pose => pose.visible).length,
    tourDraws: tour.draws,
    tourMisaligned: tour.samples.filter(sample => sample.miss > 2).length,
    worstTourMiss: Math.max(...tour.samples.map(sample => sample.miss)),
    errors,
  }
  const trace = await page.evaluate(() => window.motionSamples)
  metrics.readbacks = trace.readbacks.length
  metrics.maxPngEncodeMs = Math.max(0, ...trace.readbacks.map(readback => readback.ms))
  assert.ok(tour.samples.length >= 140, 'both scroll directions are sampled throughout')
  const beforeLoss = await page.evaluate(() => scrollY)
  await page.locator('.gallery--journey canvas').evaluate(canvas => {
    canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()
  })
  await page.locator('#product-tour[data-drawn=false]').waitFor()
  await page.locator('.journey__anchor[data-motif=handicrafts] img').waitFor({ state: 'visible' })
  assert.equal(await page.evaluate(() => scrollY), beforeLoss, 'a lost context keeps the current tour chapter')
  assert.equal(await page.locator('.gallery--journey canvas').count(), 0)
  await writeFile(out + '/frames.json', JSON.stringify({ metrics, cold, trace, tour }, null, 2))
  console.log(metrics)
  assert.ok(metrics.yawBeforeCurtain > .0001, 'the globe turns while the curtain is still opaque')
  assert.equal(metrics.cardPainted, 6, 'the composited card grid retains all six models when it scrolls')
  assert.equal(metrics.readbacks, 0, 'visible animation never encodes a PNG')
  assert.equal(metrics.tourMisaligned, 0, 'every moving tour pose stays aligned with its anchor')
  assert.deepEqual(errors.filter(message => !message.includes('WebSocket closed')), [])
} finally {
  await browser.close()
}
