import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

/* Every photograph the site names must exist, with the half-size "-small"
   copy that srcset expects beside it. For the craft band, whose tiles declare
   their size to reserve space, the declared size must be the file's own. */

const require = createRequire(import.meta.url)
const { loadImage } = require('@napi-rs/canvas')
const content = readFileSync(new URL('../src/content.ts', import.meta.url), 'utf8')
const file = (src) => new URL(`../public${src}`, import.meta.url)
const small = (src) => src.replace(/\.webp$/, '-small.webp')

test('every photo in content.ts exists, with its -small copy', () => {
  const photos = [...new Set(content.match(/\/photos\/[a-z0-9-]+\.webp/g))]
  assert.ok(photos.length >= 12, `expected the site's photos, found ${photos.length}`)
  for (const src of photos) {
    if (src.endsWith('-small.webp')) continue
    assert.ok(existsSync(file(src)), `${src} is missing`)
    assert.ok(existsSync(file(small(src))), `${small(src)} is missing`)
  }
})

test('craft photos are the size their tiles declare, and -small is half', async () => {
  const items = [...content.matchAll(/src: '(\/photos\/craft-[a-z-]+\.webp)', width: (\d+), height: (\d+)/g)]
  assert.equal(items.length, 4, 'four craft photos')
  for (const [, src, w, h] of items) {
    const full = await loadImage(readFileSync(file(src)))
    assert.deepEqual([full.width, full.height], [+w, +h], `${src} is ${full.width}x${full.height}`)
    const half = await loadImage(readFileSync(file(small(src))))
    assert.deepEqual([half.width, half.height], [Math.round(w / 2), Math.round(h / 2)], `${small(src)} should be half size`)
  }
})
