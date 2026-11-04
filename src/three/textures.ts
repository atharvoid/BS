import * as THREE from 'three'

/* ==========================================================================
   Procedural textile textures.
   Everything is drawn into an offscreen canvas at runtime — no image
   downloads, no CDN, and the weave actually reads as woven cloth.
   ========================================================================== */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas2d(size: number) {
  const el = document.createElement('canvas')
  el.width = size
  el.height = size
  const ctx = el.getContext('2d')!
  return { el, ctx }
}

function finish(el: HTMLCanvasElement, repeat: number, srgb = true) {
  const tex = new THREE.CanvasTexture(el)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  tex.anisotropy = 4
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

export type WeaveOptions = {
  size?: number
  threads?: number
  warp?: string
  weft?: string
  sheen?: string
  repeat?: number
  seed?: number
}

/**
 * A plain-weave tile: warp and weft threads interlacing over/under, each
 * thread drawn as a rounded band with a specular ridge down its centre.
 */
export function makeWeaveTexture(opts: WeaveOptions = {}) {
  const {
    size = 512,
    threads = 12,
    warp = '#c8b190',
    weft = '#ab9270',
    sheen = '#f6ecd6',
    repeat = 1,
    seed = 7,
  } = opts

  const { el, ctx } = canvas2d(size)
  const rnd = mulberry32(seed)
  const cell = size / threads

  ctx.fillStyle = '#8d7characters'
  ctx.fillStyle = warp
  ctx.fillRect(0, 0, size, size)

  const band = (x: number, y: number, w: number, h: number, vertical: boolean, jitter: number) => {
    const g = vertical
      ? ctx.createLinearGradient(x, 0, x + w, 0)
      : ctx.createLinearGradient(0, y, 0, y + h)
    const base = vertical ? warp : weft
    g.addColorStop(0, 'rgba(0,0,0,0.30)')
    g.addColorStop(0.18, base)
    g.addColorStop(0.48, sheen)
    g.addColorStop(0.62, base)
    g.addColorStop(1, 'rgba(0,0,0,0.34)')
    ctx.globalAlpha = jitter
    ctx.fillStyle = g
    const pad = Math.max(0.6, cell * 0.055)
    ctx.beginPath()
    ctx.roundRect(x + pad, y + pad, Math.max(0, w - pad * 2), Math.max(0, h - pad * 2), cell * 0.24)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  for (let i = 0; i < threads; i++) {
    for (let j = 0; j < threads; j++) {
      const x = i * cell
      const y = j * cell
      const warpOnTop = (i + j) % 2 === 0
      const jitter = 0.78 + rnd() * 0.22

      // The thread underneath shows as a darker shoulder on both sides.
      ctx.globalAlpha = 0.55
      ctx.fillStyle = 'rgba(52,40,26,0.9)'
      if (warpOnTop) {
        ctx.fillRect(x, y + cell * 0.34, cell, cell * 0.32)
      } else {
        ctx.fillRect(x + cell * 0.34, y, cell * 0.32, cell)
      }
      ctx.globalAlpha = 1

      band(x, y, cell, cell, true, warpOnTop ? jitter : jitter * 0.72)
      band(x, y, cell, cell, false, warpOnTop ? jitter * 0.72 : jitter)
    }
  }

  // Fuzz / slub character.
  ctx.globalCompositeOperation = 'overlay'
  for (let k = 0; k < size * 5; k++) {
    const x = rnd() * size
    const y = rnd() * size
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    ctx.fillRect(x, y, 1 + rnd() * 2, 1 + rnd() * 2)
  }
  ctx.globalCompositeOperation = 'source-over'

  return finish(el, repeat)
}

/** Greyscale companion used as a bump/roughness map so the weave catches light. */
export function makeWeaveBump(opts: WeaveOptions = {}) {
  const { size = 512, threads = 12, repeat = 1, seed = 7 } = opts
  const { el, ctx } = canvas2d(size)
  const rnd = mulberry32(seed)
  const cell = size / threads

  ctx.fillStyle = '#6a6a6a'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < threads; i++) {
    for (let j = 0; j < threads; j++) {
      const x = i * cell
      const y = j * cell
      const warpOnTop = (i + j) % 2 === 0
      const vertical = true
      const g = ctx.createLinearGradient(
        vertical ? x : 0,
        vertical ? 0 : y,
        vertical ? x + cell : 0,
        vertical ? 0 : y + cell,
      )
      const top = warpOnTop ? 225 : 150
      g.addColorStop(0, '#3a3a3a')
      g.addColorStop(0.5, `rgb(${top},${top},${top})`)
      g.addColorStop(1, '#3a3a3a')
      ctx.fillStyle = g
      ctx.fillRect(x, y, cell, cell)

      const g2 = ctx.createLinearGradient(0, y, 0, y + cell)
      const top2 = warpOnTop ? 150 : 225
      g2.addColorStop(0, '#3a3a3a')
      g2.addColorStop(0.5, `rgb(${top2},${top2},${top2})`)
      g2.addColorStop(1, '#3a3a3a')
      ctx.globalAlpha = 0.85
      ctx.fillStyle = g2
      ctx.fillRect(x, y, cell, cell)
      ctx.globalAlpha = 1
    }
  }

  for (let k = 0; k < size * 2; k++) {
    const v = 90 + Math.floor(rnd() * 120)
    ctx.fillStyle = `rgba(${v},${v},${v},0.25)`
    ctx.fillRect(rnd() * size, rnd() * size, 2, 2)
  }

  return finish(el, repeat, false)
}

/** Diagonal yarn winding, for the bobbin. */
export function makeWindingTexture(size = 512, repeat = 1) {
  const { el, ctx } = canvas2d(size)
  const g = ctx.createLinearGradient(0, 0, size, size)
  g.addColorStop(0, '#9d2f30')
  g.addColorStop(0.5, '#c14a3f')
  g.addColorStop(1, '#8f2a29')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  const step = size / 26
  for (let k = -size; k < size * 2; k += step) {
    ctx.strokeStyle = 'rgba(0,0,0,0.30)'
    ctx.lineWidth = step * 0.30
    ctx.beginPath()
    ctx.moveTo(k, 0)
    ctx.lineTo(k + size * 0.62, size)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255,236,214,0.20)'
    ctx.lineWidth = step * 0.14
    ctx.beginPath()
    ctx.moveTo(k + step * 0.34, 0)
    ctx.lineTo(k + step * 0.34 + size * 0.62, size)
    ctx.stroke()
  }
  return finish(el, repeat)
}

export function makeWindingBump(size = 512, repeat = 1) {
  const { el, ctx } = canvas2d(size)
  ctx.fillStyle = '#7a7a7a'
  ctx.fillRect(0, 0, size, size)
  const step = size / 26
  for (let k = -size; k < size * 2; k += step) {
    const g = ctx.createLinearGradient(k, 0, k + step, 0)
    g.addColorStop(0, '#3d3d3d')
    g.addColorStop(0.5, '#e2e2e2')
    g.addColorStop(1, '#3d3d3d')
    ctx.strokeStyle = g
    ctx.lineWidth = step * 0.72
    ctx.beginPath()
    ctx.moveTo(k, 0)
    ctx.lineTo(k + size * 0.62, size)
    ctx.stroke()
  }
  return finish(el, repeat, false)
}

/** Section through a rolled bolt: an Archimedean spiral of cloth. */
export function makeRollEndTexture(size = 512) {
  const { el, ctx } = canvas2d(size)
  const c = size / 2
  ctx.fillStyle = '#2a2118'
  ctx.fillRect(0, 0, size, size)

  ctx.translate(c, c)
  ctx.lineCap = 'round'
  const turns = 7
  for (let i = 0; i < turns * 40; i++) {
    const t = i / (turns * 40)
    const r = size * 0.055 + t * size * 0.42
    const a = t * turns * Math.PI * 2
    const shade = 0.55 + 0.45 * Math.abs(Math.sin(t * turns * Math.PI))
    ctx.strokeStyle = `rgba(${210 * shade + 20},${188 * shade + 18},${152 * shade + 14},1)`
    ctx.lineWidth = size * 0.026
    ctx.beginPath()
    ctx.arc(0, 0, r, a, a + 0.32)
    ctx.stroke()
  }
  // the visible tail leaving the roll
  ctx.strokeStyle = 'rgba(238,224,198,0.95)'
  ctx.lineWidth = size * 0.02
  ctx.beginPath()
  ctx.moveTo(size * 0.47, 0)
  ctx.bezierCurveTo(size * 0.30, size * 0.22, size * 0.44, size * 0.42, size * 0.2, size * 0.47)
  ctx.stroke()

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  // outer rim
  ctx.strokeStyle = 'rgba(20,16,12,0.9)'
  ctx.lineWidth = size * 0.05
  ctx.beginPath()
  ctx.arc(c, c, c - size * 0.025, 0, Math.PI * 2)
  ctx.stroke()

  return finish(el, 1)
}

/** Timber grain for the shuttle. */
export function makeTimberTexture(size = 512, repeat = 1) {
  const { el, ctx } = canvas2d(size)
  const rnd = mulberry32(31)
  const g = ctx.createLinearGradient(0, 0, size, 0)
  g.addColorStop(0, '#4a2a18')
  g.addColorStop(0.35, '#6b3d22')
  g.addColorStop(0.6, '#57301b')
  g.addColorStop(1, '#3f2313')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  for (let k = 0; k < 200; k++) {
    const y = rnd() * size
    const amp = 3 + rnd() * 10
    const w = 0.6 + rnd() * 2.6
    ctx.strokeStyle = rnd() > 0.55 ? 'rgba(24,12,5,0.30)' : 'rgba(190,140,96,0.16)'
    ctx.lineWidth = w
    ctx.beginPath()
    for (let x = 0; x <= size; x += 12) {
      const yy = y + Math.sin((x / size) * Math.PI * 2 + y) * amp
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy)
    }
    ctx.stroke()
  }
  return finish(el, repeat)
}

/** Cheap soft shadow blob — far lighter than a shadow map. */
export function makeShadowTexture(size = 256) {
  const { el, ctx } = canvas2d(size)
  const c = size / 2
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, 'rgba(0,0,0,0.55)')
  g.addColorStop(0.42, 'rgba(0,0,0,0.26)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(el)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Equirectangular studio environment, generated locally for metal reflections. */
export function makeStudioEnvironment(size = 512) {
  const el = document.createElement('canvas')
  el.width = size
  el.height = size / 2
  const ctx = el.getContext('2d')!

  const sky = ctx.createLinearGradient(0, 0, 0, el.height)
  sky.addColorStop(0, '#3b3128')
  sky.addColorStop(0.42, '#8d7f6c')
  sky.addColorStop(0.52, '#5c5145')
  sky.addColorStop(1, '#100e0b')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, size, el.height)

  const blob = (x: number, y: number, r: number, color: string, alpha: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalAlpha = alpha
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
    ctx.globalAlpha = 1
  }

  blob(size * 0.22, el.height * 0.26, size * 0.26, '#fff4e0', 0.95)
  blob(size * 0.68, el.height * 0.18, size * 0.16, '#ffe2b0', 0.75)
  blob(size * 0.9, el.height * 0.55, size * 0.2, '#9fb6d0', 0.35)
  blob(size * 0.05, el.height * 0.62, size * 0.18, '#c98a5a', 0.3)

  const tex = new THREE.CanvasTexture(el)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
