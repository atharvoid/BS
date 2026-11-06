import * as THREE from 'three'

/* ==========================================================================
   Textures for the six category objects.

   Same rule as the rest of the site: nothing is downloaded. Every surface is
   drawn into an offscreen canvas at runtime, so the models have real weave,
   grain, glaze and fibre without shipping a single image.

   Each function returns a texture already configured for the material it is
   for (colour space, repeat, filtering), because getting that wrong is the
   difference between "real" and "flat".
   ========================================================================== */

function canvas2d(w: number, h = w) {
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  const ctx = el.getContext('2d')!
  return { el, ctx }
}

function finish(el: HTMLCanvasElement, repeatX = 1, repeatY = repeatX, srgb = true) {
  const tex = new THREE.CanvasTexture(el)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.anisotropy = 8
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* -------------------------------------------------------------------------- */
/* 1 · Blue pottery glaze (handicrafts)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Jaipur-style blue pottery: a warm off-white body under a soft glaze, with
 * cobalt bands and hand-drawn rosettes. The brushwork is deliberately slightly
 * irregular — a perfectly symmetric print reads as plastic.
 */
export function makeBluePotteryTexture(size = 512) {
  const { el, ctx } = canvas2d(size)
  const rand = rng(17)

  const base = ctx.createLinearGradient(0, 0, size, size)
  base.addColorStop(0, '#f2e9d6')
  base.addColorStop(0.45, '#e8dcc4')
  base.addColorStop(1, '#f4ecdb')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  /* cobalt */
  const blue = (alpha = 1) => `rgba(32, 58, 132, ${alpha})`

  /* three horizontal bands, each with a different motif, as a potter would */
  const band = (y: number, h: number) => {
    ctx.fillStyle = blue(0.92)
    ctx.fillRect(0, y, size, h)
  }

  band(size * 0.06, size * 0.024)
  band(size * 0.115, size * 0.012)
  band(size * 0.72, size * 0.05)
  band(size * 0.80, size * 0.014)

  /* a row of small leaves between the upper bands */
  ctx.strokeStyle = blue(0.75)
  ctx.lineWidth = size * 0.005
  for (let i = 0; i < 28; i++) {
    const x = (i / 28) * size
    ctx.beginPath()
    ctx.arc(x + size * 0.017, size * 0.085, size * 0.014, Math.PI * 0.15, Math.PI * 1.1)
    ctx.stroke()
  }

  /* the central motif: a hand-painted rosette, repeated around the pot */
  const rosette = (cx: number, cy: number, r: number) => {
    ctx.strokeStyle = blue(0.9)
    ctx.fillStyle = blue(0.86)
    ctx.lineWidth = size * 0.0045
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.ellipse(
        cx + Math.cos(a) * r * 0.62,
        cy + Math.sin(a) * r * 0.62,
        r * 0.22,
        r * 0.4,
        a - Math.PI / 2,
        0,
        Math.PI * 2,
      )
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 5; i++) rosette((i + 0.5) * (size / 5), size * 0.42, size * 0.12)

  /* vine between the rosettes */
  ctx.strokeStyle = blue(0.55)
  ctx.lineWidth = size * 0.0035
  for (let i = 0; i < 10; i++) {
    const cx = (i + 0.5) * (size / 10)
    ctx.beginPath()
    ctx.moveTo(cx - size * 0.04, size * 0.58)
    ctx.quadraticCurveTo(cx, size * 0.54, cx + size * 0.04, size * 0.585)
    ctx.stroke()
  }

  /* glaze speckle and a few brush slips */
  for (let i = 0; i < 900; i++) {
    const x = rand() * size
    const y = rand() * size
    ctx.fillStyle = `rgba(255,255,255,${rand() * 0.1})`
    ctx.beginPath()
    ctx.arc(x, y, rand() * 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(32,58,132,${0.05 + rand() * 0.08})`
    ctx.lineWidth = size * 0.002
    ctx.beginPath()
    const y = rand() * size
    ctx.moveTo(rand() * size, y)
    ctx.lineTo(rand() * size, y + rand() * 6)
    ctx.stroke()
  }

  return finish(el)
}

/* -------------------------------------------------------------------------- */
/* 2 · Jute sacking (agriculture)                                             */
/* -------------------------------------------------------------------------- */

/**
 * Burlap: thick warp and weft tapes woven over and under, with stray fibres
 * and the darker creases a sack picks up in handling. The stencil is painted
 * into the same sheet because that is how a real sack is marked — the print
 * follows the weave rather than sitting on top of it.
 */
export function makeJuteTexture(size = 512) {
  const { el, ctx } = canvas2d(size)
  const rand = rng(53)

  ctx.fillStyle = '#8d7647'
  ctx.fillRect(0, 0, size, size)

  const step = size / 34
  const tape = step * 1.55

  /* weft tapes (horizontal), drawn first so the warp passes over them */
  for (let y = 0; y < size; y += step) {
    const g = ctx.createLinearGradient(0, y, 0, y + tape)
    g.addColorStop(0, 'rgba(96,78,44,0.95)')
    g.addColorStop(0.35, 'rgba(184,158,104,0.95)')
    g.addColorStop(0.7, 'rgba(154,130,80,0.95)')
    g.addColorStop(1, 'rgba(92,74,42,0.95)')
    ctx.fillStyle = g
    ctx.fillRect(0, y, size, tape)
  }

  /* warp tapes (vertical), skipping every other band so the weave alternates */
  for (let x = 0; x < size; x += step) {
    const col = Math.round(x / step)
    const g = ctx.createLinearGradient(x, 0, x + tape, 0)
    g.addColorStop(0, 'rgba(88,71,40,0.9)')
    g.addColorStop(0.4, 'rgba(196,170,116,0.95)')
    g.addColorStop(0.75, 'rgba(158,134,84,0.95)')
    g.addColorStop(1, 'rgba(84,68,38,0.9)')
    ctx.fillStyle = g
    /* leave gaps where the weft shows through */
    for (let y = 0; y < size; y += step * 2) {
      const offset = col % 2 === 0 ? 0 : step
      ctx.fillRect(x, y + offset, tape, step * 0.92)
    }
  }

  /* fibre fuzz */
  for (let i = 0; i < 2600; i++) {
    const x = rand() * size
    const y = rand() * size
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(222,199,150,0.24)' : 'rgba(66,52,28,0.22)'
    ctx.lineWidth = 0.6 + rand() * 0.9
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (rand() - 0.5) * 10, y + (rand() - 0.5) * 10)
    ctx.stroke()
  }

  /* handling creases */
  for (let i = 0; i < 26; i++) {
    ctx.strokeStyle = `rgba(52,40,20,${0.1 + rand() * 0.14})`
    ctx.lineWidth = 1 + rand() * 2.4
    ctx.beginPath()
    const y = rand() * size
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(size * 0.3, y + (rand() - 0.5) * 40, size * 0.7, y + (rand() - 0.5) * 40, size, y)
    ctx.stroke()
  }

  /* stencilled export marking, in the flat black paint used on real sacks */
  ctx.save()
  ctx.translate(size * 0.5, size * 0.44)
  ctx.strokeStyle = 'rgba(28,22,14,0.82)'
  ctx.fillStyle = 'rgba(28,22,14,0.82)'
  ctx.lineWidth = 2
  ctx.strokeRect(-size * 0.2, -size * 0.1, size * 0.4, size * 0.2)
  ctx.font = `600 ${Math.round(size * 0.055)}px "Chivo Mono", ui-monospace, monospace`
  ctx.textAlign = 'center'
  ctx.fillText('INDIA', 0, -size * 0.035)
  ctx.font = `600 ${Math.round(size * 0.045)}px "Chivo Mono", ui-monospace, monospace`
  ctx.fillText('50 KG', 0, size * 0.02)
  ctx.font = `500 ${Math.round(size * 0.028)}px "Chivo Mono", ui-monospace, monospace`
  ctx.fillText('PRODUCE OF INDIA', 0, size * 0.07)
  ctx.restore()

  return finish(el)
}

/** Height field for the jute: the tapes stand proud, the gaps sit low. */
export function makeJuteBump(size = 512) {
  const { el, ctx } = canvas2d(size)
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(0, 0, size, size)

  const step = size / 34
  const tape = step * 1.55
  for (let y = 0; y < size; y += step) {
    const g = ctx.createLinearGradient(0, y, 0, y + tape)
    g.addColorStop(0, '#4a4a4a')
    g.addColorStop(0.4, '#d8d8d8')
    g.addColorStop(1, '#4a4a4a')
    ctx.fillStyle = g
    ctx.fillRect(0, y, size, tape)
  }
  for (let x = 0; x < size; x += step) {
    const col = Math.round(x / step)
    const g = ctx.createLinearGradient(x, 0, x + tape, 0)
    g.addColorStop(0, '#565656')
    g.addColorStop(0.4, '#ffffff')
    g.addColorStop(1, '#565656')
    ctx.fillStyle = g
    for (let y = 0; y < size; y += step * 2) {
      const offset = col % 2 === 0 ? 0 : step
      ctx.fillRect(x, y + offset, tape, step * 0.92)
    }
  }
  return finish(el, 1, 1, false)
}

/* -------------------------------------------------------------------------- */
/* 3 · Grain (agriculture)                                                    */
/* -------------------------------------------------------------------------- */

/** A heap of long-grain rice with a little husk and dust in it. */
export function makeGrainTexture(size = 512) {
  const { el, ctx } = canvas2d(size)
  const rand = rng(91)
  ctx.fillStyle = '#a98a52'
  ctx.fillRect(0, 0, size, size)

  const tones = ['#f3ead2', '#efe3c4', '#e6d7b2', '#d9c79c', '#f7f0dd']
  for (let i = 0; i < 5200; i++) {
    const x = rand() * size
    const y = rand() * size
    const len = size * (0.012 + rand() * 0.014)
    const wid = len * (0.26 + rand() * 0.1)
    const a = rand() * Math.PI
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    const g = ctx.createLinearGradient(-wid, 0, wid, 0)
    g.addColorStop(0, 'rgba(120,96,54,0.55)')
    g.addColorStop(0.5, tones[Math.floor(rand() * tones.length)])
    g.addColorStop(1, 'rgba(120,96,54,0.45)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  /* husk flecks */
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(126,96,44,${0.25 + rand() * 0.4})`
    ctx.beginPath()
    ctx.ellipse(rand() * size, rand() * size, 2 + rand() * 3, 1 + rand() * 1.5, rand() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  return finish(el)
}

export function makeGrainBump(size = 512) {
  const { el, ctx } = canvas2d(size)
  const rand = rng(92)
  ctx.fillStyle = '#6a6a6a'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 4200; i++) {
    const x = rand() * size
    const y = rand() * size
    const len = size * (0.012 + rand() * 0.014)
    const wid = len * 0.3
    const g = ctx.createRadialGradient(x, y, 0, x, y, len)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, '#5a5a5a')
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rand() * Math.PI)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  return finish(el, 1, 1, false)
}

/* -------------------------------------------------------------------------- */
/* 4 · Raw cotton (organic)                                                   */
/* -------------------------------------------------------------------------- */

/** Cotton lint: soft, bright, with the shadowed gaps between the locks. */
export function makeCottonTexture(size = 512) {
  const { el, ctx } = canvas2d(size)
  const rand = rng(29)
  ctx.fillStyle = '#e9e2d2'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 700; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = size * (0.02 + rand() * 0.09)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,253,247,0.95)')
    g.addColorStop(0.6, 'rgba(248,244,234,0.5)')
    g.addColorStop(1, 'rgba(196,186,166,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  /* the individual fibres, as short faint curls */
  for (let i = 0; i < 2200; i++) {
    const x = rand() * size
    const y = rand() * size
    const len = 5 + rand() * 22
    ctx.strokeStyle = rand() > 0.55 ? 'rgba(255,255,255,0.5)' : 'rgba(150,140,120,0.13)'
    ctx.lineWidth = 0.7 + rand() * 0.8
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + len * 0.5, y + (rand() - 0.5) * 10, x + len, y + (rand() - 0.5) * 4)
    ctx.stroke()
  }

  /* husk specks: a boll is never perfectly clean */
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(96,72,44,${0.12 + rand() * 0.25})`
    ctx.beginPath()
    ctx.ellipse(rand() * size, rand() * size, 1.4 + rand() * 2.4, 1 + rand() * 1.4, rand() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  return finish(el)
}

/* -------------------------------------------------------------------------- */
/* 5 · Copper (industrial)                                                    */
/* -------------------------------------------------------------------------- */

/** Drawn wire: a fine brushed grain along the coil, plus handling scuffs. */
export function makeCopperRoughness(size = 512) {
  const { el, ctx } = canvas2d(size)
  const rand = rng(61)
  ctx.fillStyle = '#4a4a4a'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 900; i++) {
    const y = rand() * size
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + rand() * 0.12})`
    ctx.lineWidth = 0.6 + rand() * 1.4
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y + (rand() - 0.5) * 3)
    ctx.stroke()
  }
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.1 + rand() * 0.18})`
    ctx.lineWidth = 1 + rand() * 2
    ctx.beginPath()
    const x = rand() * size
    ctx.moveTo(x, rand() * size)
    ctx.lineTo(x + (rand() - 0.5) * 60, rand() * size)
    ctx.stroke()
  }
  return finish(el, 3, 1, false)
}

/* -------------------------------------------------------------------------- */
/* 6 · Crate timber and stencils (general)                                    */
/* -------------------------------------------------------------------------- */

/** Sawn planks with seams, nails and a little weathering. */
export function makePlankTexture(size = 512) {
  const { el, ctx } = canvas2d(size)
  const rand = rng(43)

  ctx.fillStyle = '#8a6a44'
  ctx.fillRect(0, 0, size, size)

  const planks = 5
  const w = size / planks
  for (let i = 0; i < planks; i++) {
    const x = i * w
    const shade = 0.82 + rand() * 0.34
    const g = ctx.createLinearGradient(x, 0, x + w, 0)
    g.addColorStop(0, `rgba(${118 * shade},${88 * shade},${54 * shade},1)`)
    g.addColorStop(0.5, `rgba(${152 * shade},${116 * shade},${74 * shade},1)`)
    g.addColorStop(1, `rgba(${112 * shade},${84 * shade},${52 * shade},1)`)
    ctx.fillStyle = g
    ctx.fillRect(x, 0, w, size)

    /* grain */
    for (let k = 0; k < 26; k++) {
      const gx = x + rand() * w
      ctx.strokeStyle = rand() > 0.5 ? 'rgba(64,42,20,0.22)' : 'rgba(210,176,126,0.16)'
      ctx.lineWidth = 0.7 + rand() * 1.6
      ctx.beginPath()
      for (let y = 0; y <= size; y += 16) {
        const xx = gx + Math.sin(y * 0.02 + k) * 2.2
        y === 0 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y)
      }
      ctx.stroke()
    }

    /* the seam between boards */
    ctx.fillStyle = 'rgba(38,24,10,0.75)'
    ctx.fillRect(x - 1, 0, 2.5, size)

    /* nail heads near both ends */
    for (const y of [size * 0.08, size * 0.92]) {
      for (const nx of [x + w * 0.28, x + w * 0.72]) {
        const r = size * 0.008
        const ng = ctx.createRadialGradient(nx - r * 0.4, y - r * 0.4, 0, nx, y, r)
        ng.addColorStop(0, 'rgba(214,206,190,0.95)')
        ng.addColorStop(1, 'rgba(48,38,24,0.95)')
        ctx.fillStyle = ng
        ctx.beginPath()
        ctx.arc(nx, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  /* weathering */
  for (let i = 0; i < 240; i++) {
    ctx.strokeStyle = `rgba(60,42,22,${0.05 + rand() * 0.1})`
    ctx.lineWidth = 1 + rand() * 3
    ctx.beginPath()
    const x = rand() * size
    const y = rand() * size
    ctx.moveTo(x, y)
    ctx.lineTo(x + (rand() - 0.5) * 40, y + (rand() - 0.5) * 8)
    ctx.stroke()
  }
  return finish(el)
}

/** Flat black export stencils, painted straight onto a crate face. */
export function makeStencilTexture(w = 512, h = 256) {
  const { el, ctx } = canvas2d(w, h)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(24,20,14,0.86)'
  ctx.strokeStyle = 'rgba(24,20,14,0.86)'

  ctx.font = `700 ${Math.round(h * 0.16)}px "Chivo Mono", ui-monospace, monospace`
  ctx.textAlign = 'left'
  ctx.fillText('BS EXIMNEXUS', w * 0.06, h * 0.26)

  ctx.font = `600 ${Math.round(h * 0.105)}px "Chivo Mono", ui-monospace, monospace`
  ctx.fillText('MADE IN INDIA', w * 0.06, h * 0.44)
  ctx.font = `500 ${Math.round(h * 0.075)}px "Chivo Mono", ui-monospace, monospace`
  ctx.fillText('NET 25 KG', w * 0.06, h * 0.58)

  /* handling symbols: this way up, and fragile */
  const arrow = (cx: number, cy: number, s: number) => {
    ctx.lineWidth = Math.max(2, h * 0.016)
    ctx.beginPath()
    ctx.moveTo(cx, cy + s)
    ctx.lineTo(cx, cy - s)
    ctx.moveTo(cx - s * 0.5, cy - s * 0.4)
    ctx.lineTo(cx, cy - s)
    ctx.lineTo(cx + s * 0.5, cy - s * 0.4)
    ctx.stroke()
  }
  arrow(w * 0.72, h * 0.62, h * 0.09)
  arrow(w * 0.84, h * 0.62, h * 0.09)

  ctx.lineWidth = Math.max(2, h * 0.014)
  ctx.strokeRect(w * 0.66, h * 0.16, h * 0.2, h * 0.2)
  ctx.beginPath()
  ctx.moveTo(w * 0.71, h * 0.30)
  ctx.lineTo(w * 0.755, h * 0.21)
  ctx.lineTo(w * 0.80, h * 0.30)
  ctx.stroke()

  return finish(el)
}
