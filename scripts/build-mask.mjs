/** Losslessly pack the generated grayscale PNG for CPU carving, without a
 * browser image/canvas readback. Run after build-geo.mjs. */
import fs from 'node:fs'
import zlib from 'node:zlib'
const png = fs.readFileSync(new URL('../src/three/geo/land.png', import.meta.url))
const width = png.readUInt32BE(16), height = png.readUInt32BE(20)
if (png[24] !== 8 || png[25] !== 0 || png[28] !== 0) throw Error('Expected non-interlaced 8-bit grayscale PNG')
const chunks = []
for (let p = 8; p < png.length;) {
  const size = png.readUInt32BE(p)
  if (png.toString('ascii', p + 4, p + 8) === 'IDAT') chunks.push(png.subarray(p + 8, p + 8 + size))
  p += size + 12
}
const raw = zlib.inflateSync(Buffer.concat(chunks))
const pixels = Buffer.alloc(width * height)
for (let y = 0; y < height; y++) {
  if (raw[y * (width + 1)] !== 0) throw Error('Expected unfiltered generator output')
  raw.copy(pixels, y * width, y * (width + 1) + 1, (y + 1) * (width + 1))
}
// Header: uint32 width, height. Each run: uint32 length, uint8 value.
const runs = []
for (let i = 0; i < pixels.length;) {
  let end = i + 1
  while (end < pixels.length && pixels[end] === pixels[i]) end++
  const run = Buffer.alloc(5)
  run.writeUInt32LE(end - i); run[4] = pixels[i]
  runs.push(run); i = end
}
const header = Buffer.alloc(8)
header.writeUInt32LE(width); header.writeUInt32LE(height, 4)
fs.writeFileSync(new URL('../src/three/geo/land.mask', import.meta.url), Buffer.concat([header, ...runs]))
console.log(`Packed exact ${width}×${height} mask: ${runs.length} runs`)
