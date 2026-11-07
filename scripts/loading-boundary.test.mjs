import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import zlib from 'node:zlib'
import { stripTypeScriptTypes } from 'node:module'
const source = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const js = stripTypeScriptTypes(source('src/three/mask.ts'))
const { decodeMask } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

test('page-facing quality and stage modules do not import the renderer', () => {
  for (const file of ['Stage.tsx', 'performance.ts']) {
    assert.doesNotMatch(source(`src/three/${file}`), /import\s[^\n]*from\s+['"](?:three|@react-three\/fiber)['"]/)
  }
})
test('lossless CPU mask matches every source PNG pixel', () => {
  const packed = fs.readFileSync(new URL('../src/three/geo/land.mask', import.meta.url))
  const { data, width, height } = decodeMask(packed.buffer.slice(packed.byteOffset, packed.byteOffset + packed.byteLength))
  const png = fs.readFileSync(new URL('../src/three/geo/land.png', import.meta.url))
  assert.equal(width, png.readUInt32BE(16)); assert.equal(height, png.readUInt32BE(20))
  const chunks = []
  for (let p = 8; p < png.length;) {
    const size = png.readUInt32BE(p)
    if (png.toString('ascii', p + 4, p + 8) === 'IDAT') chunks.push(png.subarray(p + 8, p + 8 + size))
    p += size + 12
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks))
  for (let y = 0; y < height; y++) {
    assert.equal(raw[y * (width + 1)], 0)
    assert.deepEqual(Buffer.from(data.subarray(y * width, (y + 1) * width)), raw.subarray(y * (width + 1) + 1, (y + 1) * (width + 1)))
  }
})
test('malformed masks fail rather than silently altering relief', () => {
  assert.throws(() => decodeMask(new ArrayBuffer(3)))
  assert.throws(() => decodeMask(new ArrayBuffer(8)))
  const buffer = new ArrayBuffer(13), view = new DataView(buffer)
  view.setUint32(0, 2, true); view.setUint32(4, 2, true); view.setUint32(8, 5, true)
  assert.throws(() => decodeMask(buffer), /Invalid mask run/)
})
