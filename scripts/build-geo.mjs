#!/usr/bin/env node
/**
 * Builds the geography the globe renders from.
 *
 * Source: Natural Earth 1:50m vector data (public domain), fetched to a local
 * directory at build time. Only the compact output below is committed, so the
 * repository stays small and the runtime payload is about 70 KB gzipped.
 *
 * Output under src/three/geo/:
 *   land.png   1-bit-ish coverage mask, grayscale, 1024x512. Drives the carved
 *              land fill and keeps the continents solid at any viewing angle.
 *   land.json  coastline loops and country borders, quantised to hundredths of
 *              a degree and packed as zig-zag varint deltas, base64. Drives the
 *              crisp vector outline that a raster mask cannot give.
 */

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const SRC_DIR = process.env.NE_DIR ?? '/tmp/earth'
const OUT_DIR = path.join(process.cwd(), 'src/three/geo')

const W = 2048
const H = 1024
const Q = 100 // hundredths of a degree

/* -------------------------------------------------------------------------- */
/* load                                                                        */
/* -------------------------------------------------------------------------- */

const read = (f) => JSON.parse(fs.readFileSync(path.join(SRC_DIR, f), 'utf8'))
const land = read('land50.geojson')
const borders = read('borders50.geojson')

function rings(fc) {
  const out = []
  for (const f of fc.features) {
    const g = f.geometry
    if (!g) continue
    if (g.type === 'Polygon') out.push(...g.coordinates)
    else if (g.type === 'MultiPolygon') for (const p of g.coordinates) out.push(...p)
    else if (g.type === 'LineString') out.push(g.coordinates)
    else if (g.type === 'MultiLineString') out.push(...g.coordinates)
  }
  return out
}

const landRings = rings(land)
const borderRings = rings(borders)
console.log(`land rings: ${landRings.length}, border rings: ${borderRings.length}`)

/* -------------------------------------------------------------------------- */
/* mask                                                                        */
/* -------------------------------------------------------------------------- */

const mask = new Uint8Array(W * H)
const rowCross = Array.from({ length: H }, () => [])

for (const ring of landRings) {
  const n = ring.length
  if (n < 3) continue
  for (let i = 0; i < n; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % n]
    let x0 = a[0]
    let y0 = a[1]
    let x1 = b[0]
    let y1 = b[1]
    // Skip the artificial antimeridian jump.
    if (Math.abs(x1 - x0) > 180) continue
    if (y0 === y1) continue
    if (y0 > y1) {
      ;[x0, x1] = [x1, x0]
      ;[y0, y1] = [y1, y0]
    }
    const py0 = ((90 - y1) / 180) * H
    const py1 = ((90 - y0) / 180) * H
    const rStart = Math.max(0, Math.ceil(py0 - 0.5))
    const rEnd = Math.min(H - 1, Math.floor(py1 - 0.5))
    for (let py = rStart; py <= rEnd; py++) {
      const lat = 90 - ((py + 0.5) / H) * 180
      const t = (lat - y0) / (y1 - y0)
      if (t < 0 || t > 1) continue
      rowCross[py].push(((x0 + t * (x1 - x0) + 180) / 360) * W)
    }
  }
}

for (let py = 0; py < H; py++) {
  const xs = rowCross[py]
  if (!xs.length) continue
  xs.sort((a, b) => a - b)
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const a = Math.max(0, Math.ceil(xs[i] - 0.5))
    const b = Math.min(W - 1, Math.floor(xs[i + 1] - 0.5))
    for (let px = a; px <= b; px++) mask[py * W + px] = 255
  }
}

// fill single-pixel holes so small islands do not read as noise
const filled = new Uint8Array(mask)
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const i = y * W + x
    if (mask[i]) continue
    if (mask[i - 1] && mask[i + 1] && mask[i - W] && mask[i + W]) filled[i] = 255
  }
}
mask.set(filled)

/* -------------------------------------------------------------------------- */
/* PNG writer (grayscale, 8 bit, no interlacing)                               */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function writeGrayPng(width, height, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 0 // grayscale
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  // one filter byte per scanline, filter type 0 (none)
  const raw = Buffer.alloc(height * (width + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0
    pixels.copy
      ? pixels.copy(raw, y * (width + 1) + 1, y * width, y * width + width)
      : raw.set(pixels.subarray(y * width, y * width + width), y * (width + 1) + 1)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* -------------------------------------------------------------------------- */
/* vector packing                                                              */
/* -------------------------------------------------------------------------- */

function simplify(ring, tol) {
  const out = []
  let last = null
  for (const p of ring) {
    if (!last || Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) > tol) {
      out.push(p)
      last = p
    }
  }
  return out
}

/** Area in square degrees, for culling islands too small to see. */
function ringArea(r) {
  let a = 0
  for (let i = 0, n = r.length; i < n; i++) {
    const p = r[i]
    const q = r[(i + 1) % n]
    a += p[0] * q[1] - q[0] * p[1]
  }
  return Math.abs(a / 2)
}

function writeVarint(out, value) {
  let v = value < 0 ? (-value << 1) | 1 : value << 1
  while (v > 0x7f) {
    out.push((v & 0x7f) | 0x80)
    v >>>= 7
  }
  out.push(v)
}

function pack(ringsIn, { tol, minPoints, minArea, closed }) {
  const bytes = []
  let prevX = 0
  let prevY = 0
  const loops = []

  for (const r of ringsIn) {
    if (minArea && ringArea(r) < minArea) continue
    let s = simplify(r, tol)
    if (closed && s.length > 2) s = s.concat([s[0]])
    if (s.length < minPoints) continue

    const pts = []
    for (const p of s) {
      const x = Math.round(p[0] * Q)
      const y = Math.round(p[1] * Q)
      writeVarint(bytes, x - prevX)
      writeVarint(bytes, y - prevY)
      prevX = x
      prevY = y
      pts.push([x, y])
    }
    loops.push(pts.length)
  }

  return {
    counts: loops,
    data: Buffer.from(bytes).toString('base64'),
    points: loops.reduce((a, b) => a + b, 0),
  }
}

const coast = pack(landRings, { tol: 0.16, minPoints: 8, minArea: 0.04, closed: true })
const border = pack(borderRings, { tol: 0.2, minPoints: 4, minArea: 0, closed: false })

/* -------------------------------------------------------------------------- */

fs.mkdirSync(OUT_DIR, { recursive: true })
const png = writeGrayPng(W, H, Buffer.from(mask))
fs.writeFileSync(path.join(OUT_DIR, 'land.png'), png)

const json = {
  meta: { source: 'Natural Earth 1:50m (public domain)', width: W, height: H, quantum: Q },
  coast,
  border,
}
fs.writeFileSync(path.join(OUT_DIR, 'land.json'), JSON.stringify(json))

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const jsonBuf = fs.readFileSync(path.join(OUT_DIR, 'land.json'))
console.log(`coast ${coast.points} pts / ${coast.counts.length} loops`)
console.log(`border ${border.points} pts / ${border.counts.length} lines`)
console.log(`land.png   ${kb(png.length)}`)
console.log(`land.json  ${kb(jsonBuf.length)}  (gzip ${kb(zlib.gzipSync(jsonBuf).length)})`)

// Keep the lossless CPU mask in sync with the shading texture.
await import('./build-mask.mjs')
