import assert from 'node:assert/strict'
import test from 'node:test'
import { createCanvas } from '@napi-rs/canvas'
import { EquirectangularReflectionMapping, HalfFloatType, LinearSRGBColorSpace, NoColorSpace, SRGBColorSpace, DataUtils } from 'three'
import { makeWheatHead } from '../src/three/wheatGeometry.ts'

test('authored surface maps keep color and material data separate', async () => {
  globalThis.document = { createElement: () => createCanvas(1, 1) }
  try {
    const { makeBluePotteryTexture, makeCategorySurface } = await import('../src/three/categoryTextures.ts')
    const glaze = makeBluePotteryTexture()
    assert.equal(glaze.colorSpace, SRGBColorSpace)
    assert.equal(glaze.image.width, 1024)
    assert.equal(glaze.image.height, 512)
    for (const name of ['glaze', 'wheat', 'copper', 'cotton', 'pine']) {
      const surface = makeCategorySurface(name)
      assert.equal(surface.colorSpace, NoColorSpace, name)
      assert.equal(surface.generateMipmaps, true, name)
      assert.ok(surface.image.width <= 256 && surface.image.height <= 256, name)
      const pixels = surface.image.getContext('2d').getImageData(0, 0, surface.image.width, surface.image.height).data
      assert.ok(new Set(pixels.filter((_, index) => index % 4 === 0)).size > 12, name)
      assert.ok(new Set(pixels.filter((_, index) => index % 4 === 1)).size > 12, name)
    }
  } finally {
    delete globalThis.document
  }
})

test('wheat can sample detail across its complete single-mesh silhouette', () => {
  const geometry = makeWheatHead()
  const uv = geometry.getAttribute('uv')
  assert.ok(uv, 'each husk, stem and awn carries UVs')
  assert.equal(uv.count, geometry.getAttribute('position').count)
  assert.ok(uv.array.every(value => value >= 0 && value <= 1))
  geometry.dispose()
})

test('the category studio has linear HDR softboxes and a dark floor at mobile-friendly resolution', async () => {
  const { makeCategoryEnvironment } = await import('../src/three/category-environment.ts')
  const environment = makeCategoryEnvironment()
  assert.equal(environment.mapping, EquirectangularReflectionMapping)
  assert.equal(environment.type, HalfFloatType)
  assert.equal(environment.colorSpace, LinearSRGBColorSpace)
  assert.equal(environment.image.data.byteLength, 512 * 256 * 8)
  const { width, height, data } = environment.image
  const peak = data.reduce((max, value, i) => i % 4 === 0 ? Math.max(max, DataUtils.fromHalfFloat(value)) : max, 0)
  assert.ok(peak >= 3, 'softboxes retain unclipped radiance')
  assert.ok(DataUtils.fromHalfFloat(data[width / 2 * 4]) < .16)
  environment.dispose()
})
