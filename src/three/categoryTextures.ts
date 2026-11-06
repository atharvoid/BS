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

  /* Where the ornament goes is decided by where the light goes.

     The lathe profile runs from foot (-0.62) to lip (0.82), so v = 0 is the
     foot and v = 1 is the lip. The belly catches the key light, and the foot
     and neck fall into shade — so the cobalt bands sit on the foot and the
     neck, where a band is meant to be, and the hand-painted motifs sit on the
     belly that one actually sees. */
  const band = (v: number, h: number) => {
    ctx.fillStyle = blue(0.94)
    ctx.fillRect(0, v * size, size, h * size)
  }

  band(0.02, 0.05)
  band(0.09, 0.012)
  band(0.86, 0.014)
  band(0.9, 0.04)

  /* the central motif: a hand-painted rosette, repeated around the pot */
  const rosette = (cx: number, cy: number, r: number) => {
    ctx.strokeStyle = blue(0.92)
    ctx.fillStyle = blue(0.9)
    ctx.lineWidth = size * 0.0045
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.ellipse(
        cx + Math.cos(a) * r * 0.6,
        cy + Math.sin(a) * r * 0.6,
        r * 0.23,
        r * 0.42,
        a - Math.PI / 2,
        0,
        Math.PI * 2,
      )
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.19, 0, Math.PI * 2)
    ctx.fill()
  }

  /* Four across the 360 degrees means each one is seen nearly flat when it
     faces the camera; six is enough that one always is. */
  for (let i = 0; i < 4; i++) rosette((i + 0.5) * (size / 4), size * 0.6, size * 0.13)

  /* a scalloped vine between the rosettes, the way the Jaipur pots are doodled */
  ctx.strokeStyle = blue(0.6)
  ctx.lineWidth = size * 0.004
  for (let i = 0; i < 16; i++) {
    const cx = (i + 0.5) * (size / 16)
    ctx.beginPath()
    ctx.arc(cx, size * 0.6, size * 0.028, Math.PI * 0.1, Math.PI * 0.9)
    ctx.stroke()
  }
  /* leaf sprays running up to the shoulder */
  ctx.strokeStyle = blue(0.5)
  ctx.lineWidth = size * 0.0035
  for (let i = 0; i < 8; i++) {
    const cx = (i + 0.5) * (size / 8)
    ctx.beginPath()
    ctx.moveTo(cx, size * 0.74)
    ctx.quadraticCurveTo(cx + size * 0.03, size * 0.7, cx + size * 0.015, size * 0.66)
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

  ctx.fillStyle = '#a08553'
  ctx.fillRect(0, 0, size, size)

  /* Sixty tapes across the sheet, over a two-metre circumference, is a tape
     about 3 cm wide — the scale of real sacking. At thirty-four the weave read
     as scales rather than cloth. */
  const step = size / 96
  const tape = step * 1.45

  /* weft tapes (horizontal), drawn first so the warp passes over them */
  for (let y = 0; y < size; y += step) {
    const g = ctx.createLinearGradient(0, y, 0, y + tape)
    g.addColorStop(0, 'rgba(140,116,66,0.9)')
    g.addColorStop(0.35, 'rgba(196,170,114,0.92)')
    g.addColorStop(0.7, 'rgba(176,150,96,0.9)')
    g.addColorStop(1, 'rgba(136,112,64,0.9)')
    ctx.fillStyle = g
    ctx.fillRect(0, y, size, tape)
  }

  /* warp tapes (vertical), skipping every other band so the weave alternates */
  for (let x = 0; x < size; x += step) {
    const col = Math.round(x / step)
    const g = ctx.createLinearGradient(x, 0, x + tape, 0)
    g.addColorStop(0, 'rgba(132,108,62,0.86)')
    g.addColorStop(0.4, 'rgba(204,178,120,0.9)')
    g.addColorStop(0.75, 'rgba(174,148,94,0.88)')
    g.addColorStop(1, 'rgba(128,106,60,0.86)')
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
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(238,216,168,0.26)' : 'rgba(84,66,34,0.2)'
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

  /* the stitched seam a sack has across its body */
  ctx.strokeStyle = 'rgba(92,72,38,0.55)'
  ctx.lineWidth = Math.max(1.5, size * 0.008)
  ctx.setLineDash([size * 0.018, size * 0.014])
  ctx.beginPath()
  ctx.moveTo(0, size * 0.16)
  ctx.lineTo(size, size * 0.16)
  ctx.stroke()
  ctx.setLineDash([])

  /* stencilled export marking, in the flat black paint used on real sacks */
  ctx.save()
  ctx.translate(size * 0.5, size * 0.44)
  ctx.strokeStyle = 'rgba(30,24,16,0.9)'
  ctx.fillStyle = 'rgba(30,24,16,0.9)'
  ctx.lineWidth = 2
  ctx.strokeRect(-size * 0.2, -size * 0.1, size * 0.4, size * 0.2)
  ctx.font = `700 ${Math.round(size * 0.06)}px "Chivo Mono", ui-monospace, monospace`
  ctx.textAlign = 'center'
  ctx.fillText('INDIA', 0, -size * 0.036)
  ctx.font = `700 ${Math.round(size * 0.052)}px "Chivo Mono", ui-monospace, monospace`
  ctx.fillText('50 KG', 0, size * 0.022)
  ctx.font = `500 ${Math.round(size * 0.03)}px "Chivo Mono", ui-monospace, monospace`
  ctx.fillText('PRODUCE OF INDIA', 0, size * 0.075)
  ctx.restore()

  return finish(el)
}

/** Height field for the jute: the tapes stand proud, the gaps sit low. */
export function makeJuteBump(size = 512) {
  const { el, ctx } = canvas2d(size)
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(0, 0, size, size)

  const step = size / 96
  const tape = step * 1.45
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
    g.addColorStop(0, '#787878')
    g.addColorStop(0.4, '#e2e2e2')
    g.addColorStop(1, '#787878')
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
  ctx.fillStyle = '#8d7238'
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

  /* Pale export pine, not walnut: a shipping crate is cheap softwood that has
     been cut and nailed, and it reads as a crate mainly because the boards are
     wide and the seams are hard. */
  ctx.fillStyle = '#c3a375'
  ctx.fillRect(0, 0, size, size)

  const planks = 3
  const w = size / planks
  for (let i = 0; i < planks; i++) {
    const x = i * w
    const shade = 0.9 + rand() * 0.16
    const g = ctx.createLinearGradient(x, 0, x + w, 0)
    g.addColorStop(0, `rgba(${196 * shade},${164 * shade},${118 * shade},1)`)
    g.addColorStop(0.5, `rgba(${222 * shade},${192 * shade},${146 * shade},1)`)
    g.addColorStop(1, `rgba(${188 * shade},${156 * shade},${112 * shade},1)`)
    ctx.fillStyle = g
    ctx.fillRect(x, 0, w, size)

    /* grain */
    for (let k = 0; k < 34; k++) {
      const gx = x + rand() * w
      ctx.strokeStyle = rand() > 0.5 ? 'rgba(126,96,58,0.26)' : 'rgba(246,230,204,0.3)'
      ctx.lineWidth = 0.7 + rand() * 1.6
      ctx.beginPath()
      for (let y = 0; y <= size; y += 16) {
        const xx = gx + Math.sin(y * 0.02 + k) * 2.2
        y === 0 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y)
      }
      ctx.stroke()
    }

    /* the seam between boards, plus the shadow it casts */
    ctx.fillStyle = 'rgba(58,40,20,0.62)'
    ctx.fillRect(x - 2, 0, 4, size)
    ctx.fillStyle = 'rgba(46,32,16,0.5)'
    ctx.fillRect(x - 1, 0, 1.5, size)

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
  for (let i = 0; i < 200; i++) {
    ctx.strokeStyle = `rgba(104,78,42,${0.05 + rand() * 0.09})`
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
  /* Stencil paint sinks into the grain and is never solid: at 0.7 alpha it
     reads as paint on timber rather than as a printed label. */
  ctx.fillStyle = 'rgba(38,30,20,0.7)'
  ctx.strokeStyle = 'rgba(38,30,20,0.7)'

  ctx.font = `700 ${Math.round(h * 0.19)}px "Chivo Mono", ui-monospace, monospace`
  ctx.textAlign = 'left'
  ctx.fillText('BS EXIMNEXUS', w * 0.05, h * 0.3)

  ctx.font = `600 ${Math.round(h * 0.12)}px "Chivo Mono", ui-monospace, monospace`
  ctx.fillText('MADE IN INDIA', w * 0.05, h * 0.52)
  ctx.font = `500 ${Math.round(h * 0.085)}px "Chivo Mono", ui-monospace, monospace`
  ctx.fillText('NET 25 KG', w * 0.05, h * 0.7)

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
